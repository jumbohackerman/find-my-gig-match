/**
 * Mock saved-jobs repository — in-memory store for demo mode.
 */

import type { SavedJobRepository } from "@/repositories/interfaces";

const store: Map<string, Set<string>> = new Map();

function getSet(userId: string): Set<string> {
  if (!store.has(userId)) store.set(userId, new Set());
  return store.get(userId)!;
}

export const mockSavedJobRepository: SavedJobRepository = {
  async listIds(userId) {
    return [...getSet(userId)];
  },

  async save(userId, jobId) {
    getSet(userId).add(jobId);
  },

  async remove(userId, jobId) {
    getSet(userId).delete(jobId);
  },

  async isSaved(userId, jobId) {
    return getSet(userId).has(jobId);
  },
};
