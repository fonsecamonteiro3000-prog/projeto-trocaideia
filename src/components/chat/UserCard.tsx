import { User, MapPin, Video } from "lucide-react";
import type { OnlineUser } from "@/hooks/usePresence";

const COUNTRY_FLAGS: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  PT: "🇵🇹",
  AR: "🇦🇷",
  MX: "🇲🇽",
  ES: "🇪🇸",
  FR: "🇫🇷",
  DE: "🇩🇪",
  IT: "🇮🇹",
  JP: "🇯🇵",
  GB: "🇬🇧",
  CO: "🇨🇴",
  CL: "🇨🇱",
  PE: "🇵🇪",
  UY: "🇺🇾",
};

const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  PT: "Portugal",
  AR: "Argentina",
  MX: "México",
  ES: "Espanha",
  FR: "França",
  DE: "Alemanha",
  IT: "Itália",
  JP: "Japão",
  GB: "Reino Unido",
  CO: "Colômbia",
  CL: "Chile",
  PE: "Peru",
  UY: "Uruguai",
};

interface UserCardProps {
  user: OnlineUser;
  onConnect: (user: OnlineUser) => void;
}

export default function UserCard({ user, onConnect }: UserCardProps) {
  const genderEmoji =
    user.gender === "male" ? "👦" : user.gender === "female" ? "👧" : user.gender === "other" ? "🧑" : null;

  const statusColors = {
    online: "bg-green-400",
    busy: "bg-yellow-400",
    in_chat: "bg-blue-400",
  };

  const statusLabels = {
    online: "Online",
    busy: "Ocupado",
    in_chat: "No chat",
  };

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 group">
      {/* Header: avatar + info */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-white/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1a1a1a] ${statusColors[user.status]}`}
            title={statusLabels[user.status]}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
              {user.display_name}
            </h3>
            {genderEmoji && <span className="text-sm flex-shrink-0">{genderEmoji}</span>}
            {user.is_anonymous && (
              <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                Anon
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {COUNTRY_FLAGS[user.country] || "🌍"}{" "}
              {COUNTRY_NAMES[user.country] || user.country}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${
            user.status === "online"
              ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
              : user.status === "in_chat"
              ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
              : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          {statusLabels[user.status]}
        </span>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {user.bio}
        </p>
      )}

      {/* Connect button */}
      <button
        onClick={() => onConnect(user)}
        disabled={user.status === "in_chat"}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          user.status === "in_chat"
            ? "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 group-hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        <Video className="w-4 h-4" />
        {user.status === "in_chat" ? "Ocupado" : "Conversar"}
      </button>
    </div>
  );
}
