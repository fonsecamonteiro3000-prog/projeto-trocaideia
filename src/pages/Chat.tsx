import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { usePresence, type OnlineUser } from "@/hooks/usePresence";
import { supabase } from "@/lib/supabase";
import ReportModal from "@/components/chat/ReportModal";
import GenderSelector from "@/components/chat/GenderSelector";
import CountrySelector from "@/components/chat/CountrySelector";
import ProfileModal from "@/components/chat/ProfileModal";
import UserCard from "@/components/chat/UserCard";
import ThemeToggle from "@/components/ThemeToggle";
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
  Flag,
  User,
  UserCircle,
  MapPin,
  Search,
  Users,
  RefreshCw,
  Filter,
  ArrowLeft,
} from "lucide-react";
import logo from "@/assets/logo.png";

type ChatTab = "video" | "mensagens" | "encontrar";

const Chat = () => {
  const { user, signOut, isAnonymous, profile, updateProfile, getUserId } = useAuth();
  const currentUserId = getUserId();
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
    roomId,
  } = useWebRTC(currentUserId);

  const [input, setInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(window.innerWidth >= 1024);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [country, setCountry] = useState(profile.country || "BR");
  const [activeTab, setActiveTab] = useState<ChatTab>("video");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Saved conversations state
  interface SavedConversation {
    id: string;
    room_id: string;
    partner_name: string;
    started_at: string;
    ended_at: string | null;
    last_message: string | null;
    message_count: number;
  }
  interface SavedMessage {
    id: string;
    sender_type: "you" | "stranger" | "system";
    content: string;
    created_at: string;
  }
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<SavedConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<SavedMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load saved conversations when switching to mensagens tab
  useEffect(() => {
    if (activeTab === "mensagens" && currentUserId) {
      setLoadingConversations(true);
      supabase
        .from("saved_conversations")
        .select("*")
        .eq("user_id", currentUserId)
        .order("started_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading conversations:", error);
          } else {
            setSavedConversations((data as SavedConversation[]) || []);
          }
          setLoadingConversations(false);
        });
    }
  }, [activeTab, currentUserId]);

  // Load messages for a selected conversation
  const loadConversationMessages = async (conv: SavedConversation) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("saved_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setConversationMessages((data as SavedMessage[]) || []);
    }
    setLoadingMessages(false);
  };

  // Presence hook — registers this user as online and fetches online users
  const { onlineUsers, loading: loadingUsers, refreshUsers } = usePresence({
    userId: currentUserId,
    displayName: profile.displayName || user?.email?.split("@")[0] || "Usuário",
    avatarUrl: profile.avatarUrl,
    gender: profile.gender,
    country: profile.country || country,
    bio: profile.bio,
    isAnonymous,
  });

  // Filter online users based on search/filters
  const filteredUsers = useMemo(() => {
    return onlineUsers.filter((u) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.display_name.toLowerCase().includes(q);
        const matchesBio = u.bio?.toLowerCase().includes(q);
        const matchesCountry = u.country?.toLowerCase().includes(q);
        if (!matchesName && !matchesBio && !matchesCountry) return false;
      }

      // Gender filter
      if (filterGender !== "all" && u.gender !== filterGender) return false;

      // Country filter
      if (filterCountry !== "all" && u.country !== filterCountry) return false;

      return true;
    });
  }, [onlineUsers, searchQuery, filterGender, filterCountry]);

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

  const handleReport = async (category: string, detail: string) => {
    try {
      await supabase.from("reports").insert({
        reporter_id: user?.id || null,
        category,
        reason: detail || category,
      });
    } catch (err) {
      console.error("Error reporting:", err);
    }
    // End chat immediately
    disconnect();
  };

  const handleGenderChange = (gender: "male" | "female" | "other") => {
    updateProfile({ gender });
  };

  const handleCountryChange = (code: string) => {
    setCountry(code);
    updateProfile({ country: code });
  };

  const handleConnectToUser = (targetUser: OnlineUser) => {
    // Switch to video tab and find match
    setActiveTab("video");
    findMatch();
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

  const displayName = profile.displayName || user?.email?.split("@")[0] || "Usuário";

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-[#111] overflow-hidden">
      {/* ═══════════ TOP NAV BAR ═══════════ */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="TrocaIdeia" className="h-9 sm:h-14 w-auto" />
          </a>

          {/* Nav tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {([
              { key: "video" as ChatTab, label: "Chat vídeo", icon: <Video className="w-4 h-4" /> },
              { key: "mensagens" as ChatTab, label: "Mensagens", icon: <MessageSquare className="w-4 h-4" /> },
              { key: "encontrar" as ChatTab, label: "Encontrar amigos", icon: <Users className="w-4 h-4" /> },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Online counter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">{onlineCount.toLocaleString()} online</span>
          </div>

          <ThemeToggle />

          {/* Profile button */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-white/20"
              />
            ) : (
              <UserCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:block max-w-[120px] truncate">
              {displayName}
            </span>
            {isAnonymous && (
              <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium hidden sm:inline">
                Anônimo
              </span>
            )}
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="lg:hidden flex items-center border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]">
        {([
          { key: "video" as ChatTab, label: "Vídeo", icon: <Video className="w-4 h-4" /> },
          { key: "mensagens" as ChatTab, label: "Msgs", icon: <MessageSquare className="w-4 h-4" /> },
          { key: "encontrar" as ChatTab, label: "Encontrar", icon: <Users className="w-4 h-4" /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-green-500 text-green-600 dark:text-green-400"
                : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      {activeTab === "video" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ─── VIDEO AREA ─── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Video panels — mobile: PiP layout, desktop: side by side */}
            <div className="flex-1 relative bg-gray-100 dark:bg-[#0a0a0a]">
              {/* STRANGER'S CAMERA (fullscreen on mobile, right half on desktop) */}
              <div className="absolute inset-0 md:relative md:h-full md:flex-1">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {status !== "connected" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
                    {status === "searching" || status === "connecting" ? (
                      <>
                        <div className="relative mb-4 sm:mb-6">
                          <div className="flex gap-1.5 sm:gap-2">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500/60 rounded-full animate-bounce"
                                style={{
                                  animationDelay: `${i * 0.15}s`,
                                  animationDuration: "1s",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-800 dark:text-white text-base sm:text-lg font-medium">
                          {status === "searching" ? "Procurando alguém..." : "Conectando..."}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1.5">Aguarde um momento</p>
                      </>
                    ) : status === "disconnected" ? (
                      <>
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3 sm:mb-4">
                          <User className="w-7 h-7 sm:w-10 sm:h-10 text-red-400" />
                        </div>
                        <p className="text-gray-800 dark:text-white text-base sm:text-lg font-medium">Estranho desconectou</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1.5">
                          Procurando outra pessoa...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                          <User className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-800 dark:text-white text-base sm:text-lg font-medium">Ninguém conectado</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1.5">
                          Toque em "Iniciar" para começar
                        </p>
                      </>
                    )}
                  </div>
                )}

                {status === "connected" && (
                  <>
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1.5">
                      <span className="text-white text-xs sm:text-sm font-medium">Estranho</span>
                    </div>
                    <button
                      onClick={() => setShowReport(true)}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-500 hover:text-red-400 transition-colors text-xs sm:text-sm font-medium"
                    >
                      <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Denunciar</span>
                    </button>
                  </>
                )}
              </div>

              {/* Desktop: side-by-side layout wrapper */}
              <div className="hidden md:flex md:flex-row md:absolute md:inset-0">
                {/* YOUR CAMERA — desktop left half */}
                <div className="flex-1 relative bg-gray-100 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {!localStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800/50 flex items-center justify-center mb-4">
                        <VideoOff className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Câmera desligada</p>
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
                    {profile.avatarUrl && (
                      <img src={profile.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span className="text-white text-sm font-medium">{displayName}</span>
                    {profile.gender && (
                      <span className="text-sm">
                        {profile.gender === "male" ? "👦" : profile.gender === "female" ? "👧" : "🧑"}
                      </span>
                    )}
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
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isMuted
                            ? "bg-red-500/80 hover:bg-red-500 text-white"
                            : "bg-black/40 hover:bg-black/60 text-white"
                        }`}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* STRANGER — desktop right half */}
                <div className="flex-1 relative bg-gray-100 dark:bg-[#0a0a0a]">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {status !== "connected" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
                      {status === "searching" || status === "connecting" ? (
                        <>
                          <div className="relative mb-6">
                            <div className="flex gap-2">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 bg-green-500/60 rounded-full animate-bounce"
                                  style={{
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: "1s",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-800 dark:text-white text-lg font-medium">
                            {status === "searching" ? "Procurando alguém..." : "Conectando..."}
                          </p>
                          <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
                        </>
                      ) : status === "disconnected" ? (
                        <>
                          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                            <User className="w-10 h-10 text-red-400" />
                          </div>
                          <p className="text-gray-800 dark:text-white text-lg font-medium">Estranho desconectou</p>
                          <p className="text-gray-400 text-sm mt-2">
                            Procurando outra pessoa...
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center mb-4">
                            <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-gray-800 dark:text-white text-lg font-medium">Ninguém conectado</p>
                          <p className="text-gray-400 text-sm mt-2">
                            Clique em "Iniciar" para começar
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {status === "connected" && (
                    <>
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-white text-sm font-medium">Estranho</span>
                      </div>
                      <button
                        onClick={() => setShowReport(true)}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
                      >
                        <Flag className="w-4 h-4" />
                        Denunciar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* YOUR CAMERA — mobile PiP overlay (small corner) */}
              <div className="md:hidden absolute top-2 right-2 w-[110px] h-[150px] sm:w-[130px] sm:h-[175px] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 dark:border-white/10 z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {!localStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 dark:bg-[#1a1a1a]">
                    <VideoOff className="w-6 h-6 text-gray-400" />
                    <button
                      onClick={startCamera}
                      className="mt-1 text-[10px] text-green-500 font-medium"
                    >
                      Ligar
                    </button>
                  </div>
                )}

                {/* Mini controls on PiP */}
                {localStream && (
                  <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1">
                    <button
                      onClick={toggleVideo}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isVideoOff ? "bg-red-500/80 text-white" : "bg-black/50 text-white"
                      }`}
                    >
                      {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isMuted ? "bg-red-500/80 text-white" : "bg-black/50 text-white"
                      }`}
                    >
                      {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="absolute top-2 left-2 right-[130px] sm:right-[150px] md:right-16 md:left-3 md:top-3 bg-red-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 z-30">
                  <p className="text-white text-xs sm:text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* ─── BOTTOM CONTROLS ─── */}
            <div className="bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-white/10 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
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
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[140px] ${
                    !localStream
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      : status === "connected"
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                  }`}
                >
                  {status === "searching" || status === "connecting" ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {status === "connected"
                    ? "Próximo"
                    : status === "searching" || status === "connecting"
                    ? "Buscando..."
                    : "Iniciar"}
                </button>

                {/* PARAR button */}
                <button
                  onClick={disconnect}
                  disabled={status === "idle"}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[140px] ${
                    status === "idle"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 shadow-lg"
                  }`}
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  Parar
                </button>

                {/* PAÍS selector */}
                <CountrySelector value={country} onChange={handleCountryChange} />

                {/* EU SOU selector */}
                <GenderSelector value={profile.gender} onChange={handleGenderChange} />

                {/* Toggle chat button (mobile) */}
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="lg:hidden flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-all"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Status text */}
              <div className="flex items-center justify-center mt-1.5 sm:mt-2 gap-2">
                <span className={`text-xs sm:text-sm font-medium ${getStatusColor()}`}>
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

              {/* Rules notice — hidden on small mobile */}
              <div className="hidden sm:flex items-center justify-center mt-2">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-4 py-2 max-w-xl">
                  <img src={logo} alt="" className="w-6 h-6 rounded" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ao pressionar "Iniciar", você concorda com nossas{" "}
                    <a href="#" className="text-green-600 dark:text-green-400 hover:underline">
                      regras
                    </a>
                    . Os infratores das regras serão banidos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CHAT SIDEBAR ─── */}
          {isChatOpen && (
            <>
              {/* Backdrop escuro no mobile */}
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setIsChatOpen(false)}
              />
              <div
                className="fixed inset-y-0 right-0 z-50 lg:relative lg:inset-auto lg:z-auto flex flex-col w-[85%] max-w-[360px] lg:w-[300px] lg:max-w-none bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-white/10 flex-shrink-0 shadow-2xl lg:shadow-none"
              >
                {/* Chat header */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {/* Botão voltar no mobile */}
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors mr-1"
                      title="Fechar chat"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <h3 className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">Chat</h3>
                    {status === "connected" && (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "connected" && (
                      <button
                        onClick={() => setShowReport(true)}
                        className="text-red-400/60 hover:text-red-500 p-1 transition-colors"
                        title="Denunciar"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      title="Fechar chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm">As mensagens aparecerão aqui</p>
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
                    <div className="bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-1.5 max-w-[90%]">
                      <p className="text-xs text-gray-400 italic">{msg.text}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        msg.sender === "you"
                          ? "bg-green-500 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-md"
                      }`}
                    >
                      <p className="text-[10px] font-bold mb-0.5 opacity-60 uppercase tracking-wide">
                        {msg.sender === "you" ? displayName : "Estranho"}
                      </p>
                      <p className="break-words">{msg.text}</p>
                      <p className="text-[10px] opacity-40 mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-gray-200 dark:border-white/10 p-3">
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
                  className="flex-1 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 rounded-xl px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || status !== "connected"}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ MENSAGENS TAB ═══════════ */}
      {activeTab === "mensagens" && (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#111] overflow-hidden">
          {selectedConversation ? (
            // ─── Viewing a conversation ───
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Conversation header */}
              <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setConversationMessages([]);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedConversation.partner_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(selectedConversation.started_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Nenhuma mensagem nesta conversa.
                    </p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "you" ? "justify-end" : msg.sender_type === "system" ? "justify-center" : "justify-start"}`}
                    >
                      {msg.sender_type === "system" ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-1">
                          {msg.content}
                        </span>
                      ) : (
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.sender_type === "you"
                              ? "bg-green-500 text-white rounded-br-md"
                              : "bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-bl-md"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_type === "you" ? "text-green-100" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // ─── Conversations list ───
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 px-4 py-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Suas Mensagens
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Histórico de conversas salvas
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                ) : savedConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      Nenhuma conversa salva
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm">
                      Suas conversas serão salvas automaticamente aqui. Comece a conversar para ver o histórico!
                    </p>
                    {isAnonymous && (
                      <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 mb-6 max-w-sm">
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                          Crie uma conta para salvar suas conversas permanentemente.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setActiveTab("video")}
                      className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-500/20"
                    >
                      <Video className="w-5 h-5 inline mr-2" />
                      Ir para o Chat de Vídeo
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {savedConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversationMessages(conv)}
                        className="w-full text-left px-4 py-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {conv.partner_name || "Desconhecido"}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                {new Date(conv.started_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {conv.last_message || "Conversa iniciada"}
                            </p>
                          </div>
                          {conv.message_count > 0 && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                              {conv.message_count}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ ENCONTRAR AMIGOS TAB ═══════════ */}
      {activeTab === "encontrar" && (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#111] overflow-hidden">
          {/* Search bar + filters */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/30 rounded-xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                    showFilters || filterGender !== "all" || filterCountry !== "all"
                      ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>
                <button
                  onClick={refreshUsers}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 text-xs sm:text-sm font-medium transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Filter options */}
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Gênero:</span>
                    {[
                      { value: "all", label: "Todos" },
                      { value: "male", label: "👦 Masculino" },
                      { value: "female", label: "👧 Feminino" },
                      { value: "other", label: "🧑 Outro" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterGender(opt.value)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                          filterGender === opt.value
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">País:</span>
                    <select
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500 [&>option]:bg-white [&>option]:dark:bg-[#2a2a2a] [&>option]:text-gray-900 [&>option]:dark:text-gray-200"
                    >
                      <option value="all">Todos os países</option>
                      <option value="BR">🇧🇷 Brasil</option>
                      <option value="US">🇺🇸 EUA</option>
                      <option value="PT">🇵🇹 Portugal</option>
                      <option value="AR">🇦🇷 Argentina</option>
                      <option value="MX">🇲🇽 México</option>
                      <option value="ES">🇪🇸 Espanha</option>
                      <option value="FR">🇫🇷 França</option>
                      <option value="DE">🇩🇪 Alemanha</option>
                      <option value="GB">🇬🇧 Reino Unido</option>
                      <option value="JP">🇯🇵 Japão</option>
                    </select>
                  </div>
                  {(filterGender !== "all" || filterCountry !== "all") && (
                    <button
                      onClick={() => {
                        setFilterGender("all");
                        setFilterCountry("all");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Users list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {/* Stats bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>
                    <strong className="text-gray-900 dark:text-white">{onlineUsers.length}</strong>{" "}
                    {onlineUsers.length === 1 ? "pessoa online" : "pessoas online"}
                  </span>
                  {filteredUsers.length !== onlineUsers.length && (
                    <span className="text-gray-400">
                      ({filteredUsers.length} {filteredUsers.length === 1 ? "resultado" : "resultados"})
                    </span>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {loadingUsers && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando usuários...</p>
                </div>
              )}

              {/* Empty state */}
              {!loadingUsers && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 sm:mb-6">
                    <Users className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {onlineUsers.length === 0
                      ? "Ninguém online agora"
                      : "Nenhum resultado encontrado"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
                    {onlineUsers.length === 0
                      ? "Seja o primeiro! Abra o chat de vídeo e espere alguém aparecer."
                      : "Tente mudar os filtros ou a busca."}
                  </p>
                  <button
                    onClick={() => setActiveTab("video")}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-500/20"
                  >
                    <Video className="w-5 h-5 inline mr-2" />
                    Ir para o Chat de Vídeo
                  </button>
                </div>
              )}

              {/* User cards grid */}
              {!loadingUsers && filteredUsers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onConnect={handleConnectToUser}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODALS ═══════════ */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onReport={handleReport}
      />
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        profile={profile}
        onSave={updateProfile}
      />
    </div>
  );
};

export default Chat;
