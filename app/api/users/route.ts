import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerAuditLog } from "@/lib/audit";

/**
 * User Management API:
 * - GET: List all users from public.users (ordered by created_at DESC)
 * - DELETE: Admin-gated endpoint to delete a user from auth.users and public.users
 */

export async function GET(req: NextRequest) {
  try {
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

    const { data: users, error: fetchError } = await adminClient
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: users || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing target user ID" }, { status: 400 });
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

    // ── Verify caller is ADMIN ──────────────────────────────────────────
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized: invalid session" }, { status: 401 });
    }

    const callerId = authData.user.id;

    if (callerId === targetUserId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const { data: callerProfile } = await adminClient
      .from("users")
      .select("name, role")
      .eq("id", callerId)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: ADMIN role required to delete users" }, { status: 403 });
    }

    // ── Get target user details for audit trail ─────────────────────────
    const { data: targetProfile } = await adminClient
      .from("users")
      .select("name, email, role, assigned_centre")
      .eq("id", targetUserId)
      .maybeSingle();

    const targetName = targetProfile?.name || "User";
    const targetEmail = targetProfile?.email || "";
    const targetRole = targetProfile?.role || "STAFF";

    // ── Delete from public.users and auth.users ────────────────────────
    await adminClient.from("users").delete().eq("id", targetUserId);
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      console.warn("Notice: Auth user deletion warning:", deleteAuthError.message);
    }

    // ── Server-Side Audit Log ─────────────────────────────────────────
    await createServerAuditLog({
      supabaseAdmin: adminClient,
      userId: callerId,
      userName: callerProfile.name,
      userRole: callerProfile.role,
      action: "USER_DELETED",
      entityType: "USER",
      entityId: targetUserId,
      details: {
        deleted_user_name: targetName,
        deleted_user_email: targetEmail,
        deleted_user_role: targetRole,
        assigned_centre: targetProfile?.assigned_centre || "All",
      },
    });

    return NextResponse.json({ success: true, message: `User ${targetName} deleted successfully` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
