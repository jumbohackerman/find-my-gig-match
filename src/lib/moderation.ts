import { supabase } from "@/integrations/supabase/client";

/** Log an action to the audit_log table */
export async function logAudit(
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_log" as any).insert({
    actor_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  } as any);
}

/** Hide a job via RPC (employer only, auto-logs to audit) */
export async function hideJob(jobId: string) {
  const { error } = await supabase.rpc("hide_job" as any, { _job_id: jobId });
  if (error) throw error;
}

/** Unhide/republish a job via RPC */
export async function unhideJob(jobId: string) {
  const { error } = await supabase.rpc("unhide_job" as any, { _job_id: jobId });
  if (error) throw error;
}
