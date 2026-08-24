import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerAuditLog } from "@/lib/audit";

/**
 * Server-verified Story Lifecycle Audit Endpoint.
 * 
 * Verifies JWT token, reads the authentic user profile from public.users,
 * and writes an immutable server-side audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, storyId, details } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase server configuration" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: no token provided" }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized: invalid session" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Fetch verified profile from database
    const { data: profile } = await adminClient
      .from("users")
      .select("name, role, assigned_centre")
      .eq("id", userId)
      .maybeSingle();

    const userName = profile?.name || authData.user.user_metadata?.name || "Staff";
    const userRole = profile?.role || authData.user.user_metadata?.role || "STAFF";

    // Write server-side audit record
    await createServerAuditLog({
      supabaseAdmin: adminClient,
      userId,
      userName,
      userRole,
      action,
      entityType: "STORY",
      entityId: storyId || null,
      details: {
        ...details,
        user_branch: profile?.assigned_centre || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
