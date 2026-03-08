/**
 * useSavedJobs — hook for saved-jobs through the provider registry.
 */

import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";

export function useSavedJobs() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const ids = await getProvider("savedJobs").listIds(userId);
    setSavedJobIds(new Set(ids));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const saveJob = useCallback(
    async (jobId: string) => {
      await getProvider("savedJobs").save(userId, jobId);
      setSavedJobIds((prev) => new Set(prev).add(jobId));
    },
    [userId],
  );

  const removeJob = useCallback(
    async (jobId: string) => {
      await getProvider("savedJobs").remove(userId, jobId);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    },
    [userId],
  );

  const isSaved = useCallback(
    (jobId: string) => savedJobIds.has(jobId),
    [savedJobIds],
  );

  return { savedJobIds, loading, saveJob, removeJob, isSaved, refetch: fetch };
}
