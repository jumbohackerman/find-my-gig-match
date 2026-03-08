/**
 * Default / fallback values for demo mode.
 * Only imported by mock repositories and hooks that need a fallback
 * when no real user profile is loaded.
 *
 * NEVER import this file from page components or UI components.
 */

import type { Candidate } from "@/domain/models";

/** Default candidate profile used when no real profile is loaded (demo/anonymous) */
export const DEFAULT_CANDIDATE: Candidate = {
  id: "demo",
  userId: "demo",
  name: "Demo User",
  avatar: "👤",
  title: "Frontend Developer",
  location: "Warszawa",
  bio: "",
  summary: "",
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js"],
  seniority: "Senior",
  experience: "5 lat",
  workMode: "Zdalnie",
  employmentType: "Full-time",
  availability: "Elastycznie",
  salaryMin: 18000,
  salaryMax: 28000,
  experienceEntries: [],
  links: {},
  cvUrl: null,
  lastActive: new Date().toISOString(),
};

/** Fallback candidate used when DB returns no candidate data */
export function createFallbackCandidate(candidateId: string): Candidate {
  return {
    id: candidateId,
    userId: candidateId,
    name: "Kandydat",
    avatar: "👤",
    title: "",
    location: "",
    bio: "",
    summary: "",
    skills: [],
    seniority: "Mid",
    experience: "",
    workMode: "Zdalnie",
    employmentType: "Full-time",
    availability: "Elastycznie",
    salaryMin: 0,
    salaryMax: 0,
    experienceEntries: [],
    links: {},
    cvUrl: null,
    lastActive: new Date().toISOString(),
  };
}
