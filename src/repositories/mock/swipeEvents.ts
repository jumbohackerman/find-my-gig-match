/**
 * Mock swipe-events repository — in-memory store for demo mode.
 */

import type { SwipeEventRepository, SwipeDirection } from "@/repositories/interfaces";

interface SwipeRecord {
  jobId: string;
  direction: SwipeDirection;
}

const store: Map<string, SwipeRecord[]> = new Map();

function getList(userId: string): SwipeRecord[] {
  if (!store.has(userId)) store.set(userId, []);
  return store.get(userId)!;
}

export const mockSwipeEventRepository: SwipeEventRepository = {
  async record(userId, jobId, direction) {
    const list = getList(userId);
    if (!list.some((r) => r.jobId === jobId)) {
      list.push({ jobId, direction });
    }
  },

  async listSwipedJobIds(userId) {
    return getList(userId).map((r) => r.jobId);
  },

  async clear(userId) {
    store.set(userId, []);
  },
};
