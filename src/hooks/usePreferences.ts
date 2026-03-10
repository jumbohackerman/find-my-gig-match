/**
 * Hook for user preferences through the provider registry.
 * Wraps localStorage in demo, Supabase table in production.
 */

import { useCallback } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";

export function usePreferences() {
  const { user } = useAuth();
  const userId = user?.id || "anonymous";

  const get = useCallback(
    (key: string) => getProvider("preferences").get(userId, key),
    [userId],
  );

  const set = useCallback(
    (key: string, value: string) => getProvider("preferences").set(userId, key, value),
    [userId],
  );

  return { get, set };
}
