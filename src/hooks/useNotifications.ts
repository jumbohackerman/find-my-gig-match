/**
 * Hook for notifications through the provider registry.
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/domain/models";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getProvider("notifications").listForUser(user.id);
    setNotifications(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await getProvider("notifications").markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetch };
}
