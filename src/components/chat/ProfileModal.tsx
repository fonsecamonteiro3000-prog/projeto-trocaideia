import { useState, useRef } from "react";
import { X, Camera, User } from "lucide-react";
import type { UserProfile } from "@/contexts/AuthContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
}

const ProfileModal = ({ isOpen, onClose, profile, onSave }: ProfileModalProps) => {
  const [name, setName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      displayName: name || profile.displayName,
      bio: bio.slice(0, 160),
      avatarUrl: avatarPreview || undefined,
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Meu Perfil</h3>
            <p className="text-xs text-gray-400">Edite suas informações</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden flex items-center justify-center border-2 border-white/20">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-500" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-gray-300 font-medium mb-1 block">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 text-sm"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-300 font-medium mb-1 flex items-center justify-between">
              <span>Bio curta</span>
              <span className="text-xs text-gray-500">{bio.length}/160</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Fale um pouco sobre você..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50 text-sm resize-none"
            />
          </div>

          {/* Anonymous notice */}
          {profile.isAnonymous && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-xs text-yellow-300">
                💡 Você está no modo anônimo. Criar um perfil é opcional — suas informações só serão visíveis enquanto estiver online.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
