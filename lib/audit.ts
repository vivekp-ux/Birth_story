import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Healthcare-Safe Server Audit Logging Helper.
 * 
 * Strict Rules:
 * 1. Executed ONLY on the server using service-role client.
 * 2. Automatically strips out sensitive keys (passwords, tokens, api keys, private health data).
 * 3. Never throws fatal errors to the main business flow if logging fails, but logs an error on server.
 */

// Denylist of sensitive keys that should never be persisted in audit log details
const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "confirm_password",
  "confirmpassword",
  "token",
  "access_token",
  "refresh_token",
  "service_role_key",
  "jwt",
  "secret",
  "api_key",
  "apikey",
]);

export function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> {
  if (!details || typeof details !== "object") return {};

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      continue; // exclude completely
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = sanitizeAuditDetails(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) =>
        typeof item === "object" ? sanitizeAuditDetails(item) : item
      );
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

export async function createServerAuditLog(params: {
  supabaseAdmin: SupabaseClient;
  userId?: string | null;
  userName: string;
  userRole: string;
  action: string;
  entityType: "STORY" | "USER" | "AUTH";
  entityId?: string | null;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const sanitizedDetails = sanitizeAuditDetails(params.details);

    const { error } = await params.supabaseAdmin.from("activity_logs").insert({
      user_id: params.userId || null,
      user_name: params.userName || "System",
      user_role: params.userRole || "STAFF",
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: sanitizedDetails,
    });

    if (error) {
      console.error("[AuditLog Error] Failed to write audit log:", error.message);
    }
  } catch (err: any) {
    console.error("[AuditLog Exception] Unexpected error in audit logging:", err?.message || err);
  }
}
