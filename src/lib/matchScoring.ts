/**
 * Match scoring engine.
 * Weights: skills 50%, seniority 20%, salary 10%, location 10%, experience 10%.
 */

export interface CandidateProfile {
  skills: string[];
  seniority: string; // Junior | Mid | Senior | Lead
  preferredSalaryMin: number; // in k
  preferredSalaryMax: number;
  remotePreference: string; // Remote | Hybrid | On-site | Any
  location: string;
  experienceYears: number;
  title: string;
}

export interface JobForScoring {
  tags: string[];
  salary: string;
  location: string;
  type: string;
  title: string;
  description: string;
}

export interface MatchResult {
  score: number; // 0–100
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

// Default demo candidate
export const DEMO_CANDIDATE: CandidateProfile = {
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js"],
  seniority: "Senior",
  preferredSalaryMin: 120,
  preferredSalaryMax: 180,
  remotePreference: "Any",
  location: "San Francisco, CA",
  experienceYears: 5,
  title: "Frontend Developer",
};

function parseSalaryRange(salary: string): { min: number; max: number } | null {
  const matches = salary.match(/\$(\d+)k\s*-\s*\$(\d+)k/i);
  if (matches) return { min: parseInt(matches[1]), max: parseInt(matches[2]) };
  const single = salary.match(/\$(\d+)k/i);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return null;
}

function inferSeniority(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lead") || t.includes("principal") || t.includes("staff")) return "Lead";
  if (t.includes("senior") || t.includes("sr")) return "Senior";
  if (t.includes("junior") || t.includes("jr") || t.includes("intern")) return "Junior";
  return "Mid";
}

export function calculateMatch(candidate: CandidateProfile, job: JobForScoring): MatchResult {
  const reasons: string[] = [];

  // 1. Skill match (50%)
  const jobSkills = job.tags.map((t) => t.toLowerCase());
  const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
  const matchedSkills = job.tags.filter((t) => candidateSkills.includes(t.toLowerCase()));
  const missingSkills = job.tags.filter((t) => !candidateSkills.includes(t.toLowerCase()));
  const skillScore = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 50;

  if (matchedSkills.length > 0) {
    reasons.push(`${matchedSkills.length}/${job.tags.length} required skills match`);
  }
  if (missingSkills.length > 0) {
    reasons.push(`Missing: ${missingSkills.join(", ")}`);
  }

  // 2. Seniority match (20%)
  const jobSeniority = inferSeniority(job.title);
  const seniorityLevels = ["Junior", "Mid", "Senior", "Lead"];
  const jobIdx = seniorityLevels.indexOf(jobSeniority);
  const candIdx = seniorityLevels.indexOf(candidate.seniority);
  const seniorityDiff = Math.abs(jobIdx - candIdx);
  const seniorityScore = seniorityDiff === 0 ? 100 : seniorityDiff === 1 ? 70 : 30;

  if (seniorityDiff === 0) {
    reasons.push(`Seniority level aligns (${candidate.seniority})`);
  } else {
    reasons.push(`Seniority gap: you're ${candidate.seniority}, role is ${jobSeniority}`);
  }

  // 3. Salary alignment (10%)
  const salaryRange = parseSalaryRange(job.salary);
  let salaryScore = 50;
  if (salaryRange) {
    const overlap =
      Math.min(salaryRange.max, candidate.preferredSalaryMax) -
      Math.max(salaryRange.min, candidate.preferredSalaryMin);
    const range = salaryRange.max - salaryRange.min || 1;
    salaryScore = overlap >= 0 ? Math.min(100, (overlap / range) * 100 + 30) : 10;
    if (overlap >= 0) {
      reasons.push("Salary range aligns with your preference");
    } else {
      reasons.push("Salary may not meet your expectations");
    }
  }

  // 4. Location compatibility (10%)
  let locationScore = 50;
  const jobLoc = job.location.toLowerCase();
  const candLoc = candidate.location.toLowerCase();
  if (
    candidate.remotePreference === "Any" ||
    jobLoc.includes("remote") ||
    job.type === "Remote"
  ) {
    locationScore = 100;
    if (jobLoc.includes("remote") || job.type === "Remote") reasons.push("Remote-friendly role");
  } else if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc.split(",")[0])) {
    locationScore = 100;
    reasons.push("Location matches your preference");
  } else {
    locationScore = 30;
    reasons.push(`Location differs: ${job.location}`);
  }

  // 5. Experience (10%)
  const expScore = candidate.experienceYears >= 3 ? 80 : candidate.experienceYears >= 1 ? 60 : 40;

  const totalScore = Math.round(
    skillScore * 0.5 +
      seniorityScore * 0.2 +
      salaryScore * 0.1 +
      locationScore * 0.1 +
      expScore * 0.1
  );

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    matchedSkills,
    missingSkills,
    reasons: reasons.slice(0, 4),
  };
}
