/**
 * Mock preferences repository — wraps localStorage for demo mode.
 * Future: swap to Supabase user_preferences table.
 */

import type { PreferencesRepository } from "@/repositories/interfaces";

export const mockPreferencesRepository: PreferencesRepository = {
  async get(_userId: string, key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },

  async set(_userId: string, key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
};
