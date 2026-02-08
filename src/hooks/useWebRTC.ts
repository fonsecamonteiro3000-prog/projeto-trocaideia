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
  roomId: string | null;
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
  const lobbyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lobbySeekingInterval = useRef<NodeJS.Timeout | null>(null);
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
  const matchedFlag = useRef(false);
  const conversationId = useRef<string | null>(null);
  const [exposedRoomId, setExposedRoomId] = useState<string | null>(null);

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
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        text,
        sender,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);

      // Persist non-system messages to the database
      if (sender !== "system" && conversationId.current && currentRoomId.current && userId) {
        supabase
          .from("saved_messages")
          .insert({
            conversation_id: conversationId.current,
            room_id: currentRoomId.current,
            sender_id: userId,
            sender_type: sender,
            content: text,
          })
          .then(({ error }) => {
            if (error) console.error("Error saving message:", error);
          });

        // Update conversation last_message and count
        supabase
          .from("saved_conversations")
          .update({
            last_message: text.substring(0, 200),
            message_count: undefined, // will use RPC or just increment client-side
          })
          .eq("id", conversationId.current)
          .then(() => {});
      }
    },
    [userId]
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
    if (lobbyChannelRef.current) {
      supabase.removeChannel(lobbyChannelRef.current);
      lobbyChannelRef.current = null;
    }
    if (lobbySeekingInterval.current) {
      clearInterval(lobbySeekingInterval.current);
      lobbySeekingInterval.current = null;
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
    matchedFlag.current = false;
    conversationId.current = null;
    setExposedRoomId(null);
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
          setExposedRoomId(roomId);
          addMessage("Conectado! Diga olá 👋", "system");

          // Create a conversation record for message persistence
          if (userId) {
            supabase
              .from("saved_conversations")
              .insert({
                room_id: roomId,
                user_id: userId,
                partner_name: "Desconhecido",
                is_anonymous: false,
                started_at: new Date().toISOString(),
                message_count: 0,
              })
              .select()
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error("Error creating conversation:", error);
                } else if (data) {
                  conversationId.current = data.id;
                }
              });
          }
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

  // Find a match using Supabase Realtime Broadcast (no database queue needed)
  const findMatch = useCallback(async () => {
    if (!localStreamRef.current) {
      setError("Ligue a câmera primeiro!");
      return;
    }

    cleanupPeerConnection();
    setMessages([]);
    setStatus("searching");
    autoRequeue.current = true;
    matchedFlag.current = false;
    addMessage("Procurando alguém...", "system");

    // Helper to start the WebRTC connection as initiator
    const startAsInitiator = async (roomId: string) => {
      isInitiator.current = true;
      currentRoomId.current = roomId;
      setupSignaling(roomId);
      const pc = createPeerConnection(roomId);

      setStatus("connecting");
      addMessage("Conectando...", "system");

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      pendingOffer.current = offer;

      // Retry sending the offer every 2 seconds until partner responds
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

      // Initial offer after short delay
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
    };

    // Helper to start as responder
    const startAsResponder = (roomId: string) => {
      isInitiator.current = false;
      currentRoomId.current = roomId;
      setupSignaling(roomId);
      createPeerConnection(roomId);

      setStatus("connecting");
      addMessage("Conectando...", "system");

      // Notify initiator that we're ready
      setTimeout(() => {
        if (signalingChannel.current) {
          signalingChannel.current.send({
            type: "broadcast",
            event: "ready",
            payload: { userId },
          });
        }
      }, 500);
    };

    // Clean up lobby helper
    const cleanupLobby = () => {
      if (lobbySeekingInterval.current) {
        clearInterval(lobbySeekingInterval.current);
        lobbySeekingInterval.current = null;
      }
      if (lobbyChannelRef.current) {
        supabase.removeChannel(lobbyChannelRef.current);
        lobbyChannelRef.current = null;
      }
    };

    try {
      // Use a unique channel name with a timestamp to avoid conflicts with stale channels
      const lobbyChannel = supabase.channel("matchmaking-lobby", {
        config: { broadcast: { self: false } },
      });
      lobbyChannelRef.current = lobbyChannel;

      lobbyChannel
        .on("broadcast", { event: "seeking" }, async ({ payload }) => {
          if (matchedFlag.current || !payload || payload.userId === userId) return;

          console.log("Found someone seeking:", payload.userId);

          // Deterministic initiator: the user with the smaller ID initiates
          const iAmInitiator = userId! < payload.userId;

          if (iAmInitiator) {
            // I'm the initiator — propose a match
            matchedFlag.current = true;
            const roomId = crypto.randomUUID();

            console.log("I'm initiator, proposing match with room:", roomId);

            // Send match proposal to the other user
            lobbyChannel.send({
              type: "broadcast",
              event: "match-proposal",
              payload: {
                roomId,
                initiator: userId,
                responder: payload.userId,
              },
            });

            // Clean up lobby
            cleanupLobby();

            // Start WebRTC as initiator
            await startAsInitiator(roomId);
          }
          // If I'm not the initiator, I wait for the match-proposal message
        })
        .on("broadcast", { event: "match-proposal" }, async ({ payload }) => {
          if (matchedFlag.current || !payload) return;

          // Only accept if I'm the intended responder
          if (payload.responder !== userId) return;

          console.log("Received match proposal for room:", payload.roomId);
          matchedFlag.current = true;

          // Clean up lobby
          cleanupLobby();

          // Start WebRTC as responder
          startAsResponder(payload.roomId);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Joined matchmaking lobby, broadcasting seeking...");

            // Immediately broadcast that we're seeking
            lobbyChannel.send({
              type: "broadcast",
              event: "seeking",
              payload: { userId, timestamp: Date.now() },
            });

            // Re-broadcast every 2 seconds so new joiners can find us
            lobbySeekingInterval.current = setInterval(() => {
              if (!matchedFlag.current) {
                lobbyChannel.send({
                  type: "broadcast",
                  event: "seeking",
                  payload: { userId, timestamp: Date.now() },
                });
              }
            }, 2000);
          }
        });

      // Timeout after 60 seconds — clean up and retry
      searchTimeout.current = setTimeout(() => {
        if (!matchedFlag.current) {
          cleanupLobby();
          addMessage("Ninguém encontrado. Tentando de novo...", "system");
          requeueTimeout.current = setTimeout(() => {
            findMatchRef.current?.();
          }, 2000);
        }
      }, 60000);
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

  // Disconnect from current chat (manual stop — does NOT auto-requeue)
  const disconnect = useCallback(() => {
    autoRequeue.current = false;

    // Mark conversation as ended
    if (conversationId.current) {
      supabase
        .from("saved_conversations")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", conversationId.current)
        .then(() => {});
    }

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
    roomId: exposedRoomId,
  };
}
