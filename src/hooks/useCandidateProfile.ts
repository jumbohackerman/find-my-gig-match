/**
 * Hook for loading the current user's candidate profile.
 * Falls back to DEFAULT_CANDIDATE in demo mode (no auth).
 */

import { useState, useEffect } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CANDIDATE } from "@/data/defaults";
import type { Candidate } from "@/domain/models";

export function useCandidateProfile() {
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<Candidate>(DEFAULT_CANDIDATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCandidate(DEFAULT_CANDIDATE);
      setLoading(false);
      return;
    }

    let cancelled = false;
    getProvider("candidates")
      .getByUserId(user.id)
      .then((result) => {
        if (!cancelled) {
          setCandidate(result || DEFAULT_CANDIDATE);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user]);

  const updateProfile = (data: Partial<Candidate>) => {
    setCandidate((prev) => ({ ...prev, ...data }));
  };

  return { candidate, loading, updateProfile };
}
