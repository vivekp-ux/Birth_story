import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerAuditLog } from "@/lib/audit";

/**
 * Delete Story API Route — server-side only, ADMIN-gated with immutable audit trail.
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing story id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Supabase URL or Service Role Key" },
      { status: 500 }
    );
  }

  // ── Step 1: Extract Bearer token ─────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: no token provided" }, { status: 401 });
  }

  // ── Step 2: Initialize service-role client & verify JWT ──────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized: invalid or expired session" }, { status: 401 });
  }
  const user = authData.user;

  // ── Step 3: Read user role strictly from public.users table ─────────────────
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: `Database error verifying user role: ${profileError.message}` },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Access denied: user profile record not found in database" },
      { status: 403 }
    );
  }

  if (profile.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: ADMIN role required in user profile to delete birth stories" },
      { status: 403 }
    );
  }

  // ── Step 4: Fetch story metadata before deletion for the audit trail ─────────
  const { data: storyData } = await adminClient
    .from("stories")
    .select("baby_name, mother_name, hospital, status")
    .eq("id", id)
    .maybeSingle();

  const babyName = storyData?.baby_name || "Unknown";
  const hospital = storyData?.hospital || "Unknown";
  const motherName = storyData?.mother_name || "Unknown";

  // ── Step 5: Delete pdf_versions & stories via service-role client ────────────
  const { error: pdfDeleteError } = await adminClient
    .from("pdf_versions")
    .delete()
    .eq("story_id", id);

  if (pdfDeleteError) {
    return NextResponse.json(
      { error: `Failed to delete pdf versions: ${pdfDeleteError.message}` },
      { status: 500 }
    );
  }

  const { error: storyDeleteError } = await adminClient
    .from("stories")
    .delete()
    .eq("id", id);

  if (storyDeleteError) {
    return NextResponse.json(
      { error: `Failed to delete birth story: ${storyDeleteError.message}` },
      { status: 500 }
    );
  }

  // ── Step 6: Server-side audit log ───────────────────────────────────────────
  await createServerAuditLog({
    supabaseAdmin: adminClient,
    userId: user.id,
    userName: profile.name || "Admin",
    userRole: profile.role,
    action: "STORY_DELETED",
    entityType: "STORY",
    entityId: id,
    details: {
      baby_name: babyName,
      mother_name: motherName,
      hospital: hospital,
      previous_status: storyData?.status || "Unknown",
    },
  });

  return NextResponse.json({ success: true, message: "Story deleted successfully" });
}
