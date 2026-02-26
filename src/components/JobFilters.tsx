import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Job } from "@/data/jobs";

export interface JobFiltersState {
  location: string;
  type: string;
  salaryMin: number;
}

interface JobFiltersProps {
  filters: JobFiltersState;
  onChange: (filters: JobFiltersState) => void;
}

const locations = ["All", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Chicago, IL", "Remote"];
const jobTypes = ["All", "Full-time", "Part-time", "Contract", "Remote"];

const JobFilters = ({ filters, onChange }: JobFiltersProps) => {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.location !== "All" || filters.type !== "All" || filters.salaryMin > 0;

  const clearFilters = () => {
    onChange({ location: "All", type: "All", salaryMin: 0 });
  };

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <Select
                  value={filters.location}
                  onValueChange={(v) => onChange({ ...filters, location: v })}
                >
                  <SelectTrigger className="h-9 bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Job Type</label>
                <Select
                  value={filters.type}
                  onValueChange={(v) => onChange({ ...filters, type: v })}
                >
                  <SelectTrigger className="h-9 bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min Salary: {filters.salaryMin > 0 ? `$${filters.salaryMin}k+` : "Any"}
                </label>
                <Slider
                  value={[filters.salaryMin]}
                  onValueChange={([v]) => onChange({ ...filters, salaryMin: v })}
                  max={200}
                  step={10}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobFilters;

export function filterJobs(jobs: Job[], filters: JobFiltersState): Job[] {
  return jobs.filter((job) => {
    if (filters.location !== "All" && job.location !== filters.location) return false;
    if (filters.type !== "All" && job.type !== filters.type) return false;
    if (filters.salaryMin > 0) {
      const match = job.salary.match(/\$(\d+)k/);
      const min = match ? parseInt(match[1]) : 0;
      if (min < filters.salaryMin) return false;
    }
    return true;
  });
}
