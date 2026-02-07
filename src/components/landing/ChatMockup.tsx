import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  SkipForward, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send,
  Loader2,
  User
} from "lucide-react";

type ChatState = "searching" | "connecting" | "connected";

const mockMessages = [
  { id: 1, sender: "stranger", text: "Oi! De onde você é?" },
  { id: 2, sender: "you", text: "Opa! Sou de São Paulo, e você?" },
  { id: 3, sender: "stranger", text: "Curitiba! Legal conhecer gente de SP" },
];

const ChatMockup = () => {
  const [chatState, setChatState] = useState<ChatState>("searching");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [messageInput, setMessageInput] = useState("");

  // Auto-cycle through states for demo
  useEffect(() => {
    const timer1 = setTimeout(() => setChatState("connecting"), 2000);
    const timer2 = setTimeout(() => setChatState("connected"), 4000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleNextPerson = () => {
    setChatState("searching");
    setTimeout(() => setChatState("connecting"), 2000);
    setTimeout(() => setChatState("connected"), 4000);
  };

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-4">
            Experimente a plataforma
          </h2>
          <p className="text-secondary-foreground/70 text-lg">
            Interface intuitiva e elegante. Veja como é fácil começar uma conversa.
          </p>
        </div>

        {/* Chat mockup container */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-troca-dark rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
            {/* Video area */}
            <div className="grid md:grid-cols-2 gap-1 p-1 bg-black/20">
              {/* Stranger video */}
              <div className="relative aspect-video bg-gradient-to-br from-troca-dark to-black rounded-xl overflow-hidden">
                {chatState === "connected" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-secondary-foreground/60 text-sm">
                        {chatState === "searching" && "Procurando alguém..."}
                        {chatState === "connecting" && "Conectando..."}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Status badge */}
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    chatState === "connected" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      chatState === "connected" ? "bg-primary" : "bg-yellow-400 animate-pulse"
                    }`} />
                    {chatState === "connected" ? "Em conversa" : "Conectando"}
                  </span>
                </div>
              </div>

              {/* Your video */}
              <div className="relative aspect-video bg-gradient-to-br from-troca-dark/80 to-black/60 rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-foreground/80" />
                  </div>
                </div>
                
                {/* Label */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-black/40 text-secondary-foreground/80 text-xs font-medium">
                    Você
                  </span>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      micEnabled 
                        ? "bg-secondary-foreground/20 hover:bg-secondary-foreground/30" 
                        : "bg-destructive hover:bg-destructive/80"
                    }`}
                  >
                    {micEnabled ? (
                      <Mic className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <MicOff className="w-5 h-5 text-destructive-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`p-3 rounded-full transition-colors ${
                      videoEnabled 
                        ? "bg-secondary-foreground/20 hover:bg-secondary-foreground/30" 
                        : "bg-destructive hover:bg-destructive/80"
                    }`}
                  >
                    {videoEnabled ? (
                      <Video className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-destructive-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom controls and chat */}
            <div className="p-4 md:p-6 bg-troca-dark border-t border-primary/10">
              <div className="grid md:grid-cols-[1fr,2fr] gap-4">
                {/* Next button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleNextPerson}
                    size="lg"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                  >
                    <SkipForward className="mr-2 h-5 w-5" />
                    Próximo
                  </Button>
                </div>

                {/* Chat input */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 rounded-xl bg-secondary-foreground/10 border border-primary/20 text-secondary-foreground placeholder:text-secondary-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-12 w-12 bg-primary hover:bg-primary/90 rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mini chat preview */}
              {chatState === "connected" && (
                <div className="mt-4 p-4 rounded-xl bg-black/20 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {mockMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"}`}
                      >
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg text-sm ${
                            msg.sender === "you"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary-foreground/20 text-secondary-foreground"
                          }`}
                        >
                          {msg.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatMockup;
