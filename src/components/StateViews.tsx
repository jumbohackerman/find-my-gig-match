import { motion } from "framer-motion";
import { AlertTriangle, Inbox, RefreshCw, Loader2 } from "lucide-react";

/* ── Skeleton Pulse ── */
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-xl bg-secondary animate-pulse ${className}`} />
);

/* ── Card Skeleton ── */
export const CardSkeleton = () => (
  <div className="card-gradient rounded-xl border border-border p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-lg" />
      <Skeleton className="h-6 w-16 rounded-lg" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  </div>
);

/* ── Swipe Card Skeleton ── */
export const SwipeCardSkeleton = () => (
  <div className="card-gradient rounded-2xl border border-border p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
    <Skeleton className="h-5 w-4/5" />
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
    <div className="grid grid-cols-2 gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-7 w-20 rounded-lg" />
      <Skeleton className="h-7 w-20 rounded-lg" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  </div>
);

/* ── Profile Form Skeleton ── */
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="card-gradient rounded-2xl border border-border p-5 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
    <div className="card-gradient rounded-2xl border border-border p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

/* ── Empty State ── */
interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyView = ({ icon, title, description, action }: EmptyProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
      {icon || <Inbox className="w-6 h-6 text-muted-foreground" />}
    </div>
    <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground max-w-[280px]">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);

/* ── Error State with Retry ── */
interface ErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorView = ({
  title = "Coś poszło nie tak",
  description = "Nie udało się załadować danych. Spróbuj ponownie.",
  onRetry,
}: ErrorProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-destructive" />
    </div>
    <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground max-w-[280px]">{description}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
      </button>
    )}
  </motion.div>
);

/* ── Inline Loading Spinner ── */
export const Spinner = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Loader2 className={`animate-spin text-muted-foreground ${className}`} />
);

/* ── Full Page Loading ── */
export const PageLoading = ({ text = "Ładowanie..." }: { text?: string }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
    <Spinner className="w-6 h-6" />
    <p className="text-muted-foreground text-sm">{text}</p>
  </div>
);
