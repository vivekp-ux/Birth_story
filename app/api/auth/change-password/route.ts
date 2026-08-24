import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase server configuration" },
        { status: 500 }
      );
    }

    // Extract Bearer token
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

    const user = authData.user;

    // Get user details for audit trail
    const { data: profile } = await adminClient
      .from("users")
      .select("name, role, email")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.name || user.user_metadata?.name || user.email || "User";
    const userRole = profile?.role || user.user_metadata?.role || "STAFF";

    // Update password in Supabase Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Server-side audit log (Zero sensitive data!)
    await createServerAuditLog({
      supabaseAdmin: adminClient,
      userId: user.id,
      userName,
      userRole,
      action: "PASSWORD_CHANGED",
      entityType: "AUTH",
      entityId: user.id,
      details: {
        method: "self_service",
        user_email: profile?.email || user.email,
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
