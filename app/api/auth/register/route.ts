import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, assigned_centre } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields: email, password, and name" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase server configuration" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Verify caller is authenticated ADMIN ─────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    let actorId: string | undefined = undefined;
    let actorName = "Admin";
    let actorRole = "ADMIN";

    if (token) {
      const { data: authData } = await supabaseAdmin.auth.getUser(token);
      if (authData?.user) {
        actorId = authData.user.id;
        const { data: callerProfile } = await supabaseAdmin
          .from("users")
          .select("name, role")
          .eq("id", actorId)
          .maybeSingle();
        if (callerProfile) {
          actorName = callerProfile.name || "Admin";
          actorRole = callerProfile.role || "ADMIN";
        }
      }
    }

    // ── Create user in auth.users ────────────────────────────────────────
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role || "STAFF",
        assigned_centre: assigned_centre || null,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Upsert record into public.users
      const { error: profileError } = await supabaseAdmin.from("users").upsert(
        {
          id: data.user.id,
          name: name || "User",
          email: email,
          role: role || "STAFF",
          assigned_centre: assigned_centre || null,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Failed to upsert user profile:", profileError.message);
      }

      // ── Server-Side Audit Log ─────────────────────────────────────────
      await createServerAuditLog({
        supabaseAdmin,
        userId: actorId,
        userName: actorName,
        userRole: actorRole,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: data.user.id,
        details: {
          created_user_name: name,
          created_user_email: email,
          role: role || "STAFF",
          assigned_centre: assigned_centre || "All Centres",
        },
      });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}
