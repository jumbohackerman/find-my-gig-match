/**
 * useJobFeed — orchestrator hook for the candidate job browsing flow.
 *
 * Manages: filtered job list, current card index, swipe actions (skip/save/apply),
 * match scoring, and feed reset. All persistence goes through the provider registry.
 *
 * Pages use this instead of managing swipe state inline.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { getProvider } from "@/providers/registry";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { filterJobs, defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import { calculateMatch, type MatchResult } from "@/lib/matchScoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Job } from "@/domain/models";

export function useJobFeed() {
  const { user } = useAuth();
  const { jobs: allJobs, loading: jobsLoading } = useJobs();
  const { candidate: candidateProfile } = useCandidateProfile();
  const { savedJobIds, saveJob, removeJob: unsaveJob } = useSavedJobs();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedJobIds, setSwipedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<JobFiltersState>({ ...defaultFilters });

  const userId = user?.id ?? "anonymous";

  // Load swiped IDs on mount
  useEffect(() => {
    getProvider("swipeEvents")
      .listSwipedJobIds(userId)
      .then((ids) => setSwipedJobIds(new Set(ids)));
  }, [userId]);

  // Filtered and un-swiped jobs
  const filteredJobs = useMemo(() => filterJobs(allJobs, filters), [allJobs, filters]);

  // Match scores
  const matchResults = useMemo(() => {
    const map: Record<string, MatchResult> = {};
    filteredJobs.forEach((job) => {
      map[job.id] = calculateMatch(candidateProfile, job);
    });
    return map;
  }, [filteredJobs, candidateProfile]);

  const remainingJobs = filteredJobs.slice(currentIndex);
  const isFinished = currentIndex >= filteredJobs.length;

  // ── Apply to job (backend call) ──────────────────────────────────────────
  const applyToJob = useCallback(
    async (job: Job) => {
      if (!user) return;
      try {
        const { error } = await supabase.rpc("apply_to_job", {
          _static_job_id: job.id,
          _job_title: job.title,
          _job_company: job.company,
          _job_location: job.location,
          _job_logo: job.logo,
          _job_salary: job.salary,
          _job_tags: job.tags,
          _job_type: job.type,
          _job_description: job.description,
        });
        if (error) {
          console.error("Apply error:", error);
          toast.error("Nie udało się zaaplikować");
        } else {
          toast.success(`Zaaplikowano na: ${job.title}`);
        }
      } catch (err) {
        console.error("Apply error:", err);
      }
    },
    [user],
  );

  // ── Swipe handler ────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "save") => {
      const job = filteredJobs[currentIndex];
      if (!job) return;

      // Record swipe event
      await getProvider("swipeEvents").record(userId, job.id, direction);
      setSwipedJobIds((prev) => new Set(prev).add(job.id));

      if (direction === "right") {
        await applyToJob(job);
      } else if (direction === "save") {
        await saveJob(job.id);
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, filteredJobs, userId, applyToJob, saveJob],
  );

  // ── Apply from saved list ────────────────────────────────────────────────
  const applyFromSaved = useCallback(
    async (job: Job) => {
      await unsaveJob(job.id);
      await applyToJob(job);
    },
    [unsaveJob, applyToJob],
  );

  // ── Reset feed ───────────────────────────────────────────────────────────
  const resetFeed = useCallback(async () => {
    await getProvider("swipeEvents").clear(userId);
    setSwipedJobIds(new Set());
    setCurrentIndex(0);
  }, [userId]);

  // ── Update filters (resets index) ────────────────────────────────────────
  const updateFilters = useCallback((newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setCurrentIndex(0);
  }, []);

  // ── Saved jobs as full Job objects ───────────────────────────────────────
  const savedJobs = useMemo(
    () => allJobs.filter((j) => savedJobIds.has(j.id)),
    [allJobs, savedJobIds],
  );

  return {
    // State
    allJobs,
    filteredJobs,
    remainingJobs,
    savedJobs,
    savedJobIds,
    currentIndex,
    isFinished,
    jobsLoading,
    filters,
    matchResults,

    // Actions
    handleSwipe,
    applyFromSaved,
    applyToJob,
    resetFeed,
    updateFilters,
  };
}
