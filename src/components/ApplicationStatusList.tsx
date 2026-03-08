import { motion, AnimatePresence } from "framer-motion";
import StatusPipeline from "@/components/employer/StatusPipeline";
import type { ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";
import type { ApplicationWithJob } from "@/hooks/useApplications";

interface Props {
  applications: ApplicationWithJob[];
  loading: boolean;
}

const ApplicationStatusList = ({ applications, loading }: Props) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Brak aplikacji.</p>
        <p className="text-muted-foreground text-xs mt-1">Przesuń w prawo na oferty, które Ci się podobają!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {applications.map((app, i) => {
          const status = app.status as ApplicationStatus;
          const job = app.job;
          if (!job) return null;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-gradient rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-semibold text-foreground truncate">
                    {job.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        status === "hired"
                          ? "bg-accent/20 text-accent border border-accent/40"
                          : status === "interview"
                          ? "bg-yellow-400/15 text-yellow-500 border border-yellow-400/30"
                          : status === "shortlisted"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : status === "viewed"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : status === "closed"
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      Status: {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-3">
                <StatusPipeline currentStatus={status} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationStatusList;
