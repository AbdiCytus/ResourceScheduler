import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useNotifications(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetchNotif = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, [userId, supabase]);

  const markAsRead = async () => {
    if (unreadCount > 0 && userId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);
      setUnreadCount(0);
    }
  };

  return { unreadCount, notifications, markAsRead };
}
