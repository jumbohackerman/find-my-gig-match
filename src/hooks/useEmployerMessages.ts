/**
 * Employer-side hook for candidate messaging.
 * Uses the message repository — backend-agnostic.
 * Manages per-application chat state, unlock logic, and realtime subscriptions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { getProvider } from "@/providers/registry";
import type { Message } from "@/domain/models";

export interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

/** Convert domain Message → ChatMessage for the UI */
function toChatMessage(msg: Message, senderName: string): ChatMessage {
  return {
    id: msg.id,
    applicationId: msg.applicationId,
    senderId: msg.senderId,
    senderName,
    content: msg.content,
    createdAt: msg.createdAt,
  };
}

export function useEmployerMessages(employerId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unlockedChats, setUnlockedChats] = useState<Set<string>>(new Set());
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current.clear();
    };
  }, []);

  const subscribeToApplication = useCallback(
    (applicationId: string) => {
      // Don't double-subscribe
      if (subscriptionsRef.current.has(applicationId)) return;

      const unsub = getProvider("messages").subscribe(applicationId, (msg) => {
        const chatMsg = toChatMessage(
          msg,
          msg.senderId === employerId ? "Ty" : "Kandydat",
        );
        setMessages((prev) => {
          // Deduplicate — optimistic send may already have this message
          if (prev.some((m) => m.id === chatMsg.id)) return prev;
          return [...prev, chatMsg];
        });
      });

      subscriptionsRef.current.set(applicationId, unsub);
    },
    [employerId],
  );

  const unsubscribeFromApplication = useCallback((applicationId: string) => {
    const unsub = subscriptionsRef.current.get(applicationId);
    if (unsub) {
      unsub();
      subscriptionsRef.current.delete(applicationId);
    }
  }, []);

  const loadMessages = useCallback(
    async (applicationId: string) => {
      const repo = getProvider("messages");
      const msgs = await repo.listByApplication(applicationId);
      const chatMsgs = msgs.map((m) =>
        toChatMessage(m, m.senderId === employerId ? "Ty" : "Kandydat"),
      );
      setMessages((prev) => {
        const other = prev.filter((m) => m.applicationId !== applicationId);
        return [...other, ...chatMsgs];
      });

      // Auto-subscribe to realtime after loading
      subscribeToApplication(applicationId);
    },
    [employerId, subscribeToApplication],
  );

  const sendMessage = useCallback(
    async (applicationId: string, content: string) => {
      if (!employerId) return;

      // Optimistic update with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        applicationId,
        senderId: employerId,
        senderName: "Ty",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const repo = getProvider("messages");
        const msg = await repo.send(applicationId, employerId, content);
        // Replace optimistic message with server-confirmed one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? toChatMessage(msg, "Ty") : m)),
        );
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [employerId],
  );

  const unlockChat = useCallback(
    (applicationId: string) => {
      setUnlockedChats((prev) => new Set(prev).add(applicationId));
      // Start listening for realtime messages when chat is unlocked
      subscribeToApplication(applicationId);
    },
    [subscribeToApplication],
  );

  const isChatOpen = useCallback(
    (applicationId: string) =>
      unlockedChats.has(applicationId) ||
      messages.some((m) => m.applicationId === applicationId),
    [unlockedChats, messages],
  );

  const getMessages = useCallback(
    (applicationId: string) =>
      messages
        .filter((m) => m.applicationId === applicationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  return {
    messages,
    sendMessage,
    unlockChat,
    isChatOpen,
    getMessages,
    loadMessages,
    unsubscribeFromApplication,
  };
}
