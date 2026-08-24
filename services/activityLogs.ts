import { supabase } from "@/lib/supabase";
import { ActivityLog } from "@/types/story";

export async function fetchActivityLogs(options?: {
  page?: number;
  limit?: number;
  action?: string;
  category?: string;
  search?: string;
}): Promise<{ logs: ActivityLog[]; total: number; totalPages: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 15;
  const action = options?.action ?? "All";
  const category = options?.category ?? "All";
  const search = (options?.search ?? "").trim().toLowerCase();

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action && action !== "All") {
    query = query.eq("action", action);
  }

  if (category && category !== "All") {
    if (category === "USER") {
      query = query.eq("entity_type", "USER");
    } else if (category === "STORY") {
      query = query.eq("entity_type", "STORY");
    } else if (category === "AUTH") {
      query = query.eq("entity_type", "AUTH");
    }
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("Failed to fetch activity logs:", error.message);
    return { logs: [], total: 0, totalPages: 1 };
  }

  let logs = (data as ActivityLog[]) ?? [];

  if (search) {
    logs = logs.filter((log) => {
      const uName = (log.user_name || "").toLowerCase();
      const uRole = (log.user_role || "").toLowerCase();
      const actionText = (log.action || "").toLowerCase().replace(/_/g, " ");
      const detailsText = JSON.stringify(log.details || {}).toLowerCase();
      return (
        uName.includes(search) ||
        uRole.includes(search) ||
        actionText.includes(search) ||
        detailsText.includes(search)
      );
    });
  }

  const total = search ? logs.length : (count ?? logs.length);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = (page - 1) * limit;
  const paginated = logs.slice(from, from + limit);

  return {
    logs: paginated,
    total,
    totalPages,
  };
}

export async function recordStoryAudit(params: {
  action: "STORY_CREATED" | "STORY_UPDATED" | "STORY_SUBMITTED" | "STORY_APPROVED" | "STORY_REJECTED" | "PDF_GENERATED";
  storyId?: string | null;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch("/api/stories/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: params.action,
        storyId: params.storyId,
        details: params.details || {},
      }),
    });
  } catch (err) {
    console.error("Error recording story audit:", err);
  }
}
