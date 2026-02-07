import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Free STUN/TURN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export type ConnectionStatus =
  | "idle"
  | "requesting-media"
  | "searching"
  | "connecting"
  | "connected"
  | "disconnected";

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: ConnectionStatus;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  findMatch: () => Promise<void>;
  disconnect: () => void;
  skipPerson: () => void;
  sendMessage: (text: string) => void;
  messages: ChatMessage[];
  onlineCount: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "you" | "stranger" | "system";
  timestamp: Date;
}

export function useWebRTC(userId: string | undefined): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const signalingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentRoomId = useRef<string | null>(null);
  const isInitiator = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const offerRetryInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const autoRequeue = useRef(false);
  const requeueTimeout = useRef<NodeJS.Timeout | null>(null);
  const findMatchRef = useRef<(() => Promise<void>) | null>(null);

  // Online counter simulation
  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 2000) + 500);
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const change = Math.floor(Math.random() * 21) - 10;
        return Math.max(100, prev + change);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = useCallback(
    (text: string, sender: ChatMessage["sender"]) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text,
          sender,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  const cleanupPeerConnection = useCallback(() => {
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (signalingChannel.current) {
      supabase.removeChannel(signalingChannel.current);
      signalingChannel.current = null;
    }
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = null;
    }
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    if (offerRetryInterval.current) {
      clearInterval(offerRetryInterval.current);
      offerRetryInterval.current = null;
    }
    if (requeueTimeout.current) {
      clearTimeout(requeueTimeout.current);
      requeueTimeout.current = null;
    }
    pendingOffer.current = null;
    setRemoteStream(null);
    currentRoomId.current = null;
    isInitiator.current = false;
  }, []);

  // Start camera/mic
  const startCamera = useCallback(async () => {
    try {
      setStatus("requesting-media");
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      setStatus("idle");
    } catch (err: any) {
      console.error("Erro ao acessar câmera/microfone:", err);
      if (err.name === "NotAllowedError") {
        setError("Permissão para câmera/microfone negada. Por favor, permita o acesso.");
      } else if (err.name === "NotFoundError") {
        setError("Nenhuma câmera ou microfone encontrado.");
      } else {
        setError("Erro ao acessar câmera/microfone.");
      }
      setStatus("idle");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    cleanupPeerConnection();
    setStatus("idle");
    setMessages([]);
  }, [cleanupPeerConnection]);

  // Create RTCPeerConnection and set up event handlers
  const createPeerConnection = useCallback(
    (roomId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      // Add local tracks to connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote tracks
      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remote.addTrack(track);
        });
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      // Handle ICE candidates - send via signaling
      pc.onicecandidate = (event) => {
        if (event.candidate && signalingChannel.current) {
          signalingChannel.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate.toJSON(),
              userId,
            },
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setStatus("connected");
          addMessage("Conectado! Diga olá 👋", "system");
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          if (status === "connected") {
            addMessage("O estranho se desconectou.", "system");
            // Auto-requeue after a short delay
            if (autoRequeue.current && localStreamRef.current) {
              addMessage("Procurando outra pessoa...", "system");
              cleanupPeerConnection();
              requeueTimeout.current = setTimeout(() => {
                findMatchRef.current?.();
              }, 1500);
            } else {
              setStatus("disconnected");
            }
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setStatus("connected");
        }
      };

      // Set up data channel for text messages
      if (isInitiator.current) {
        const dc = pc.createDataChannel("chat", { ordered: true });
        dataChannel.current = dc;
        setupDataChannel(dc);
      } else {
        pc.ondatachannel = (event) => {
          dataChannel.current = event.channel;
          setupDataChannel(event.channel);
        };
      }

      return pc;
    },
    [userId, addMessage, status]
  );

  const setupDataChannel = (dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log("Data channel opened");
    };
    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          addMessage(data.text, "stranger");
        }
      } catch {
        addMessage(event.data, "stranger");
      }
    };
    dc.onclose = () => {
      console.log("Data channel closed");
    };
  };

  // Set up signaling channel via Supabase Realtime
  const setupSignaling = useCallback(
    (roomId: string) => {
      const channel = supabase.channel(`signal:${roomId}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "ready" }, async (payload) => {
          const data = payload.payload;
          if (data.userId === userId) return;

          // The responder is ready — send the offer now (and stop retrying)
          console.log("Partner is ready, sending offer");
          if (offerRetryInterval.current) {
            clearInterval(offerRetryInterval.current);
            offerRetryInterval.current = null;
          }
          if (pendingOffer.current && signalingChannel.current) {
            signalingChannel.current.send({
              type: "broadcast",
              event: "offer",
              payload: {
                sdp: pendingOffer.current,
                userId,
              },
            });
          }
        })
        .on("broadcast", { event: "offer" }, async (payload) => {
          const data = payload.payload;
          if (data.userId === userId) return;

          console.log("Received offer");
          const pc = peerConnection.current;
          if (!pc) return;

          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.sdp)
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.send({
              type: "broadcast",
              event: "answer",
              payload: {
                sdp: answer,
                userId,
              },
            });
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        })
        .on("broadcast", { event: "answer" }, async (payload) => {
          const data = payload.payload;
          if (data.userId === userId) return;

          console.log("Received answer");
          // Stop retrying the offer — we got the answer
          if (offerRetryInterval.current) {
            clearInterval(offerRetryInterval.current);
            offerRetryInterval.current = null;
          }
          pendingOffer.current = null;

          const pc = peerConnection.current;
          if (!pc) return;

          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.sdp)
            );
          } catch (err) {
            console.error("Error handling answer:", err);
          }
        })
        .on("broadcast", { event: "ice-candidate" }, async (payload) => {
          const data = payload.payload;
          if (data.userId === userId) return;

          const pc = peerConnection.current;
          if (!pc) return;

          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        })
        .on("broadcast", { event: "leave" }, (payload) => {
          const data = payload.payload;
          if (data.userId === userId) return;
          addMessage("O estranho se desconectou.", "system");
          cleanupPeerConnection();
          // Auto-requeue after the stranger leaves
          if (autoRequeue.current && localStreamRef.current) {
            addMessage("Procurando outra pessoa...", "system");
            requeueTimeout.current = setTimeout(() => {
              findMatchRef.current?.();
            }, 1500);
          } else {
            setStatus("disconnected");
          }
        })
        .subscribe();

      signalingChannel.current = channel;
      return channel;
    },
    [userId, addMessage, cleanupPeerConnection]
  );

  // Find a match
  const findMatch = useCallback(async () => {
    if (!localStreamRef.current) {
      setError("Ligue a câmera primeiro!");
      return;
    }

    cleanupPeerConnection();
    setMessages([]);
    setStatus("searching");
    autoRequeue.current = true;
    addMessage("Procurando alguém...", "system");

    try {
      // Clean up old queue entries for this user first
      await supabase
        .from("chat_queue")
        .delete()
        .eq("user_id", userId);

      // Also clean up stale entries older than 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      await supabase
        .from("chat_queue")
        .delete()
        .eq("status", "waiting")
        .lt("created_at", twoMinutesAgo);

      // Register in queue
      const { data: queueEntry, error: insertError } = await supabase
        .from("chat_queue")
        .insert({ user_id: userId, status: "waiting" })
        .select()
        .single();

      if (insertError) {
        console.error("Queue error:", insertError);
        // Fallback: create direct room
        await createDirectRoom();
        return;
      }

      // Look for a partner
      const { data: partner } = await supabase
        .from("chat_queue")
        .select("*")
        .neq("user_id", userId)
        .eq("status", "waiting")
        .neq("id", queueEntry.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (partner) {
        // We found someone! We are the initiator
        isInitiator.current = true;
        const roomId = crypto.randomUUID();
        currentRoomId.current = roomId;

        // Update both queue entries
        await supabase
          .from("chat_queue")
          .update({ status: "matched", room_id: roomId })
          .in("id", [queueEntry.id, partner.id]);

        // Set up signaling and peer connection
        setupSignaling(roomId);
        const pc = createPeerConnection(roomId);

        setStatus("connecting");
        addMessage("Conectando...", "system");

        // Create offer and store it — will send when partner is "ready"
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        pendingOffer.current = offer;

        // Retry sending the offer every 2 seconds in case the partner
        // subscribed before the "ready" event was set up
        offerRetryInterval.current = setInterval(() => {
          if (signalingChannel.current && pendingOffer.current) {
            console.log("Retrying offer...");
            signalingChannel.current.send({
              type: "broadcast",
              event: "offer",
              payload: {
                sdp: pendingOffer.current,
                userId,
              },
            });
          }
        }, 2000);

        // Also send offer after a short delay as initial attempt
        setTimeout(() => {
          if (signalingChannel.current && pendingOffer.current) {
            signalingChannel.current.send({
              type: "broadcast",
              event: "offer",
              payload: {
                sdp: pendingOffer.current,
                userId,
              },
            });
          }
        }, 1000);
      } else {
        // Wait to be matched (polling)
        pollInterval.current = setInterval(async () => {
          const { data: updated } = await supabase
            .from("chat_queue")
            .select("*")
            .eq("id", queueEntry.id)
            .single();

          if (updated?.status === "matched" && updated?.room_id) {
            clearInterval(pollInterval.current!);
            pollInterval.current = null;

            isInitiator.current = false;
            currentRoomId.current = updated.room_id;

            // Set up signaling and peer connection (as responder)
            setupSignaling(updated.room_id);
            createPeerConnection(updated.room_id);

            setStatus("connecting");
            addMessage("Conectando...", "system");

            // Notify the initiator that we are ready to receive the offer
            setTimeout(() => {
              if (signalingChannel.current) {
                signalingChannel.current.send({
                  type: "broadcast",
                  event: "ready",
                  payload: { userId },
                });
              }
            }, 500);
          }
        }, 1500);

        // Timeout after 30s — retry automatically
        searchTimeout.current = setTimeout(async () => {
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
          }
          // Clean up queue
          await supabase.from("chat_queue").delete().eq("id", queueEntry.id);
          
          addMessage("Ninguém encontrado. Tentando de novo...", "system");
          // Re-enter the queue
          requeueTimeout.current = setTimeout(() => {
            findMatchRef.current?.();
          }, 2000);
        }, 30000);
      }
    } catch (err) {
      console.error("Error finding match:", err);
      setStatus("disconnected");
      addMessage("Erro ao procurar. Tente novamente.", "system");
    }
  }, [userId, cleanupPeerConnection, addMessage, setupSignaling, createPeerConnection]);

  // Keep ref in sync so auto-requeue can call findMatch without circular deps
  useEffect(() => {
    findMatchRef.current = findMatch;
  }, [findMatch]);

  // Fallback: create a demo room for testing
  const createDirectRoom = useCallback(async () => {
    const roomId = crypto.randomUUID();
    currentRoomId.current = roomId;
    isInitiator.current = true;

    setupSignaling(roomId);
    createPeerConnection(roomId);

    setStatus("searching");
    addMessage("Aguardando alguém entrar...", "system");

    // Keep searching state - the signaling will handle connection when someone joins
  }, [setupSignaling, createPeerConnection, addMessage]);

  // Disconnect from current chat (manual stop — does NOT auto-requeue)
  const disconnect = useCallback(() => {
    autoRequeue.current = false;
    if (signalingChannel.current) {
      signalingChannel.current.send({
        type: "broadcast",
        event: "leave",
        payload: { userId },
      });
    }
    cleanupPeerConnection();
    setStatus("idle");
    setMessages([]);
    addMessage("Você se desconectou.", "system");
  }, [userId, cleanupPeerConnection, addMessage]);

  // Skip to next person
  const skipPerson = useCallback(() => {
    if (signalingChannel.current) {
      signalingChannel.current.send({
        type: "broadcast",
        event: "leave",
        payload: { userId },
      });
    }
    cleanupPeerConnection();
    setMessages([]);
    findMatch();
  }, [userId, cleanupPeerConnection, findMatch]);

  // Send text message via data channel
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      addMessage(text, "you");

      if (dataChannel.current?.readyState === "open") {
        dataChannel.current.send(JSON.stringify({ type: "chat", text }));
      } else if (signalingChannel.current) {
        // Fallback: send via signaling channel
        signalingChannel.current.send({
          type: "broadcast",
          event: "chat-message",
          payload: { text, userId },
        });
      }
    },
    [addMessage, userId]
  );

  // Also listen for chat messages via signaling (fallback)
  useEffect(() => {
    if (!signalingChannel.current) return;

    const channel = signalingChannel.current;
    // The broadcast listener is already set up in setupSignaling
    // Add chat message handler
    channel.on("broadcast", { event: "chat-message" }, (payload) => {
      const data = payload.payload;
      if (data.userId !== userId) {
        addMessage(data.text, "stranger");
      }
    });
  }, [signalingChannel.current, userId, addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupPeerConnection]);

  return {
    localStream,
    remoteStream,
    status,
    error,
    startCamera,
    stopCamera,
    findMatch,
    disconnect,
    skipPerson,
    sendMessage,
    messages,
    onlineCount,
  };
}
