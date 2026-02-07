import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface OnlineUser {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  display_name: string;
  avatar_url: string | null;
  gender: "male" | "female" | "other" | null;
  country: string;
  bio: string;
  is_anonymous: boolean;
  status: "online" | "busy" | "in_chat";
  last_seen: string;
}

interface UsePresenceOptions {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  gender?: "male" | "female" | "other";
  country?: string;
  bio?: string;
  isAnonymous: boolean;
}

export function usePresence(options: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const presenceId = useRef<string | null>(null);

  // Register as online
  const goOnline = useCallback(async () => {
    try {
      const payload: Record<string, unknown> = {
        display_name: options.displayName,
        avatar_url: options.avatarUrl || null,
        gender: options.gender || null,
        country: options.country || "BR",
        bio: options.bio || "",
        is_anonymous: options.isAnonymous,
        status: "online",
        last_seen: new Date().toISOString(),
      };

      if (options.isAnonymous) {
        payload.anonymous_id = options.userId;
        payload.user_id = null;
      } else {
        payload.user_id = options.userId;
        payload.anonymous_id = null;
      }

      // Upsert: insert or update if already exists
      const { data, error } = await supabase
        .from("online_users")
        .upsert(payload, {
          onConflict: options.isAnonymous ? "anonymous_id" : "user_id",
        })
        .select()
        .single();

      if (error) {
        console.error("Presence error:", error);
        return;
      }

      if (data) {
        presenceId.current = data.id;
      }
    } catch (err) {
      console.error("Error going online:", err);
    }
  }, [options]);

  // Update heartbeat (last_seen)
  const heartbeat = useCallback(async () => {
    if (!presenceId.current) return;
    await supabase
      .from("online_users")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", presenceId.current);
  }, []);

  // Go offline
  const goOffline = useCallback(async () => {
    if (presenceId.current) {
      await supabase
        .from("online_users")
        .delete()
        .eq("id", presenceId.current);
      presenceId.current = null;
    }
  }, []);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("online_users")
      .select("*")
      .gte("last_seen", twoMinutesAgo)
      .order("last_seen", { ascending: false });

    if (error) {
      console.error("Error fetching online users:", error);
      return;
    }

    // Filter out self
    const filtered = (data || []).filter((u) => {
      if (options.isAnonymous) return u.anonymous_id !== options.userId;
      return u.user_id !== options.userId;
    });

    setOnlineUsers(filtered);
    setLoading(false);
  }, [options.userId, options.isAnonymous]);

  // Setup: register, heartbeat, fetch, subscribe
  useEffect(() => {
    goOnline();

    // Heartbeat every 30s
    heartbeatInterval.current = setInterval(() => {
      heartbeat();
    }, 30000);

    // Fetch users initially
    fetchOnlineUsers();

    // Poll for updates every 10s
    const fetchInterval = setInterval(() => {
      fetchOnlineUsers();
    }, 10000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel("online-users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "online_users" },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      clearInterval(fetchInterval);
      supabase.removeChannel(channel);
      goOffline();
    };
  }, [goOnline, heartbeat, fetchOnlineUsers, goOffline]);

  // Re-register when profile info changes
  useEffect(() => {
    if (presenceId.current) {
      goOnline();
    }
  }, [options.displayName, options.gender, options.country, options.bio]);

  return {
    onlineUsers,
    loading,
    refreshUsers: fetchOnlineUsers,
    goOffline,
  };
}
