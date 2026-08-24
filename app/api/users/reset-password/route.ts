import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "User ID and a new password (min 6 characters) are required" },
        { status: 400 }
      );
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
    const { data: callerProfile } = await adminClient
      .from("users")
      .select("name, role")
      .eq("id", callerId)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: ADMIN role required to reset user passwords" },
        { status: 403 }
      );
    }

    // ── Get target user details for audit trail ─────────────────────────
    const { data: targetProfile } = await adminClient
      .from("users")
      .select("name, email, role")
      .eq("id", userId)
      .maybeSingle();

    const targetName = targetProfile?.name || "User";
    const targetEmail = targetProfile?.email || "";

    // ── Reset target user password ──────────────────────────────────────
    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 400 });
    }

    // ── Server-Side Audit Log (Zero sensitive data!) ────────────────────
    await createServerAuditLog({
      supabaseAdmin: adminClient,
      userId: callerId,
      userName: callerProfile.name,
      userRole: callerProfile.role,
      action: "PASSWORD_RESET",
      entityType: "AUTH",
      entityId: userId,
      details: {
        method: "admin_reset",
        target_user_name: targetName,
        target_user_email: targetEmail,
        target_user_role: targetProfile?.role || "STAFF",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${targetName} (${targetEmail}) has been successfully reset.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
