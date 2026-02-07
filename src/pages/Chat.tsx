import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  SkipForward,
  Loader2,
  LogOut,
  MessageCircle,
  Users,
  Shield,
  Flag,
} from "lucide-react";
import logo from "@/assets/logo.png";

type ChatStatus = "idle" | "searching" | "connected" | "disconnected";

interface Message {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
}

const Chat = () => {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated online counter
  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 500) + 100);
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 11) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for incoming messages via Supabase Realtime
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "broadcast",
        { event: "message" },
        (payload) => {
          const data = payload.payload;
          if (data.userId !== user?.id) {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: data.text,
                sender: "stranger",
                timestamp: new Date(),
              },
            ]);
          }
        }
      )
      .on(
        "broadcast",
        { event: "leave" },
        () => {
          setStatus("disconnected");
          addSystemMessage("O estranho se desconectou.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id]);

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        sender: "stranger",
        timestamp: new Date(),
      },
    ]);
  };

  const findMatch = useCallback(async () => {
    setStatus("searching");
    setMessages([]);
    setRoomId(null);

    // Registrar-se como disponível no Supabase
    const { data: queueEntry, error: insertError } = await supabase
      .from("chat_queue")
      .insert({ user_id: user?.id })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao entrar na fila:", insertError);
      // Fallback: criar sala aleatória para demo
      const demoRoom = crypto.randomUUID();
      setRoomId(demoRoom);
      setStatus("connected");
      setMessages([
        {
          id: crypto.randomUUID(),
          text: "Conectado! Diga olá 👋",
          sender: "stranger",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Procurar um parceiro na fila
    const { data: partner } = await supabase
      .from("chat_queue")
      .select("*")
      .neq("user_id", user?.id)
      .eq("status", "waiting")
      .limit(1)
      .single();

    if (partner) {
      const newRoomId = crypto.randomUUID();

      // Atualizar ambos os registros na fila
      await supabase
        .from("chat_queue")
        .update({ status: "matched", room_id: newRoomId })
        .in("id", [queueEntry.id, partner.id]);

      setRoomId(newRoomId);
      setStatus("connected");
      setMessages([
        {
          id: crypto.randomUUID(),
          text: "Conectado! Diga olá 👋",
          sender: "stranger",
          timestamp: new Date(),
        },
      ]);
    } else {
      // Aguardar ser encontrado (poll simples)
      const pollInterval = setInterval(async () => {
        const { data: updated } = await supabase
          .from("chat_queue")
          .select("*")
          .eq("id", queueEntry.id)
          .single();

        if (updated?.status === "matched" && updated?.room_id) {
          clearInterval(pollInterval);
          setRoomId(updated.room_id);
          setStatus("connected");
          setMessages([
            {
              id: crypto.randomUUID(),
              text: "Conectado! Diga olá 👋",
              sender: "stranger",
              timestamp: new Date(),
            },
          ]);
        }
      }, 2000);

      // Timeout de 30s
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === "searching") {
          setStatus("idle");
          // Limpar fila
          supabase
            .from("chat_queue")
            .delete()
            .eq("id", queueEntry.id);
        }
      }, 30000);
    }
  }, [user?.id, status]);

  const sendMessage = async () => {
    if (!input.trim() || !roomId) return;

    const text = input.trim();
    setInput("");

    // Add to local messages
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        sender: "you",
        timestamp: new Date(),
      },
    ]);

    // Broadcast via Supabase Realtime
    await supabase.channel(`room:${roomId}`).send({
      type: "broadcast",
      event: "message",
      payload: { text, userId: user?.id },
    });

    inputRef.current?.focus();
  };

  const skipPerson = async () => {
    if (roomId) {
      await supabase.channel(`room:${roomId}`).send({
        type: "broadcast",
        event: "leave",
        payload: {},
      });
    }
    findMatch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0f0d]">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/">
              <img src={logo} alt="TrocaIdeia" className="h-10 w-auto" />
            </a>
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/50">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {onlineCount} online
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 hidden sm:block">
              {user?.email}
            </span>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {/* Status bar */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            {status === "connected" && (
              <span className="flex items-center gap-2 text-sm text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Conversa ativa
              </span>
            )}
            {status === "searching" && (
              <span className="flex items-center gap-2 text-sm text-yellow-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Procurando alguém...
              </span>
            )}
            {status === "disconnected" && (
              <span className="flex items-center gap-2 text-sm text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                Desconectado
              </span>
            )}
            {status === "idle" && (
              <span className="flex items-center gap-2 text-sm text-white/40">
                Clique para começar
              </span>
            )}
          </div>

          {status === "connected" && (
            <Button
              onClick={() => {}}
              variant="ghost"
              size="sm"
              className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 text-xs"
            >
              <Flag className="w-3 h-3 mr-1" />
              Denunciar
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {status === "idle" && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Pronto para conversar?
              </h2>
              <p className="text-white/50 max-w-sm mb-8">
                Clique no botão abaixo para encontrar alguém aleatoriamente e
                começar uma conversa.
              </p>
              <Button
                onClick={findMatch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-6 text-lg shadow-glow rounded-xl hover:scale-105 transition-all"
              >
                <Users className="mr-2 h-5 w-5" />
                Encontrar Alguém
              </Button>
              <div className="flex items-center gap-2 mt-6 text-xs text-white/30">
                <Shield className="w-3 h-3" />
                Conversa anônima e segura
              </div>
            </div>
          )}

          {status === "searching" && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">
                Procurando alguém...
              </h2>
              <p className="text-white/50">Isso pode levar alguns segundos</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "you" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  msg.sender === "you"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-white/10 text-white rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            {(status === "idle" || status === "disconnected") && (
              <Button
                onClick={findMatch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-5 rounded-xl shadow-glow flex-shrink-0"
              >
                <Users className="mr-2 h-4 w-4" />
                {status === "disconnected" ? "Próximo" : "Começar"}
              </Button>
            )}

            {status === "searching" && (
              <Button
                onClick={() => setStatus("idle")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-6 py-5 rounded-xl flex-shrink-0"
              >
                Cancelar
              </Button>
            )}

            {status === "connected" && (
              <>
                <Button
                  onClick={skipPerson}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-4 py-5 rounded-xl flex-shrink-0"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary rounded-xl py-5"
                />

                <Button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-5 rounded-xl flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
