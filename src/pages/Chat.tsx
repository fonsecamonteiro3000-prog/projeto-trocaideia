import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Send,
  Loader2,
  LogOut,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  X,
  Play,
  Square,
  Globe,
  Smile,
  User,
} from "lucide-react";
import logo from "@/assets/logo.png";

const Chat = () => {
  const { user, signOut } = useAuth();
  const {
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
  } = useWebRTC(user?.id);

  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "requesting-media":
        return "Acessando câmera...";
      case "searching":
        return "Procurando alguém...";
      case "connecting":
        return "Conectando...";
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      default:
        return "Pronto para começar";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-400";
      case "searching":
      case "connecting":
        return "text-yellow-400";
      case "disconnected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1a1a2e] overflow-hidden">
      {/* ═══════════ TOP NAV BAR ═══════════ */}
      <header className="bg-[#16213e] border-b border-white/10 px-4 py-2 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="TrocaIdeia" className="h-10 w-auto" />
          </a>

          {/* Nav tabs like OmeTV */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: "Chat vídeo", icon: <Video className="w-4 h-4" />, active: true },
              { label: "Mensagens", icon: <MessageSquare className="w-4 h-4" />, active: false },
              { label: "Encontrar amigos", icon: <User className="w-4 h-4" />, active: false },
            ].map((tab) => (
              <button
                key={tab.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab.active
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Online counter */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">{onlineCount.toLocaleString()} online</span>
          </div>

          <span className="text-sm text-gray-500 hidden md:block">{user?.email}</span>

          <button
            onClick={signOut}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ─── VIDEO AREA ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video panels */}
          <div className="flex-1 flex flex-col md:flex-row gap-0 relative">
            {/* YOUR CAMERA (left/top) */}
            <div className="flex-1 relative bg-[#0f0f23] border-r border-white/5">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Overlay when no camera */}
              {!localStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f23]">
                  <div className="w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center mb-4">
                    <VideoOff className="w-12 h-12 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm">Câmera desligada</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Ligar Câmera
                  </button>
                </div>
              )}

              {/* Your name tag */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-white text-sm font-medium">Você</span>
              </div>

              {/* Camera/mic controls overlay */}
              {localStream && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={toggleVideo}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isVideoOff
                        ? "bg-red-500/80 hover:bg-red-500 text-white"
                        : "bg-black/40 hover:bg-black/60 text-white"
                    }`}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isMuted
                        ? "bg-red-500/80 hover:bg-red-500 text-white"
                        : "bg-black/40 hover:bg-black/60 text-white"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="absolute top-3 left-3 right-16 bg-red-500/90 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-white text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* STRANGER'S CAMERA (right/bottom) */}
            <div className="flex-1 relative bg-[#0f0f23]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Overlay when not connected */}
              {status !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f23]">
                  {status === "searching" || status === "connecting" ? (
                    <>
                      {/* Loading animation like OmeTV */}
                      <div className="relative mb-6">
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-4 h-4 bg-white/60 rounded-full animate-bounce"
                              style={{
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: "1s",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-white text-lg font-medium">
                        {status === "searching"
                          ? "Procurando alguém..."
                          : "Conectando..."}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Aguarde um momento
                      </p>
                    </>
                  ) : status === "disconnected" ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <User className="w-10 h-10 text-red-400" />
                      </div>
                      <p className="text-white text-lg font-medium">
                        Estranho desconectou
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Clique em "Iniciar" para encontrar outra pessoa
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <User className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-white text-lg font-medium">
                        Ninguém conectado
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Clique em "Iniciar" para começar
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Stranger name tag */}
              {status === "connected" && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-white text-sm font-medium">
                    Estranho
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── BOTTOM CONTROLS (like OmeTV) ─── */}
          <div className="bg-[#16213e] border-t border-white/10 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* INICIAR button */}
              <button
                onClick={() => {
                  if (status === "connected" || status === "searching" || status === "connecting") {
                    skipPerson();
                  } else {
                    findMatch();
                  }
                }}
                disabled={!localStream || status === "requesting-media"}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 min-w-[140px] ${
                  !localStream
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : status === "connected"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                }`}
              >
                {status === "searching" || status === "connecting" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {status === "connected"
                  ? "Próximo"
                  : status === "searching" || status === "connecting"
                  ? "Buscando..."
                  : "Iniciar"}
              </button>

              {/* PARAR button */}
              <button
                onClick={() => {
                  if (status === "searching" || status === "connecting") {
                    disconnect();
                  } else if (status === "connected") {
                    disconnect();
                  }
                }}
                disabled={status === "idle" && !localStream}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 min-w-[140px] ${
                  status === "idle"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-[#e8a0a0] hover:bg-[#d48a8a] text-[#1a1a2e] shadow-lg"
                }`}
              >
                <Square className="w-5 h-5" />
                Parar
              </button>

              {/* PAÍS button */}
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-105 active:scale-95 min-w-[120px]">
                <Globe className="w-5 h-5" />
                País 🇧🇷
              </button>

              {/* EU SOU button */}
              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-lg bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-105 active:scale-95 min-w-[120px]">
                <Smile className="w-5 h-5" />
                Eu sou 🧑
              </button>

              {/* Toggle chat button (mobile) */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="lg:hidden flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold text-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            {/* Status text */}
            <div className="flex items-center justify-center mt-2 gap-2">
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {status === "searching" || status === "connecting" ? (
                  <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                ) : (
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      status === "connected"
                        ? "bg-green-400"
                        : status === "disconnected"
                        ? "bg-red-400"
                        : "bg-gray-400"
                    }`}
                  />
                )}
                {getStatusText()}
              </span>
            </div>

            {/* Rules notice */}
            <div className="flex items-center justify-center mt-2">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 max-w-xl">
                <img src={logo} alt="" className="w-6 h-6 rounded" />
                <p className="text-xs text-gray-400">
                  Ao pressionar "Iniciar", você concorda com nossas{" "}
                  <a href="#" className="text-green-400 hover:underline">
                    regras
                  </a>
                  . Os infratores das regras serão banidos. Por favor, mantenha
                  seu rosto visível no quadro da câmera.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CHAT SIDEBAR ─── */}
        <div
          className={`${
            isChatOpen ? "flex" : "hidden"
          } lg:flex flex-col w-full lg:w-[380px] bg-[#0f3460] border-l border-white/10 flex-shrink-0`}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Chat</h3>
              {status === "connected" && (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">
                  As mensagens aparecerão aqui
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "you"
                    ? "justify-end"
                    : msg.sender === "system"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                {msg.sender === "system" ? (
                  <div className="bg-white/5 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-gray-400 italic">{msg.text}</p>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "you"
                        ? "bg-green-500 text-white rounded-br-md"
                        : "bg-white/15 text-white rounded-bl-md"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-0.5 opacity-70">
                      {msg.sender === "you" ? "Você" : "Estranho"}
                    </p>
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status === "connected"
                    ? "Escreva uma mensagem..."
                    : "Conecte-se para enviar mensagens"
                }
                disabled={status !== "connected"}
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 rounded-xl px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || status !== "connected"}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
