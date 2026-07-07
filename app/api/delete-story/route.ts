import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Architecture: Option A — public.users is the single source of truth for roles.
 *
 * Key insight from diagnostics:
 *   - The `sb_secret_` service role key is an opaque token (NOT a JWT).
 *   - PostgREST rejects it as `Authorization: Bearer` → "permission denied".
 *   - It only works as an API-gateway `apikey` header (GoTrue auth, not PostgREST).
 *
 * Working pattern (Strategy B, confirmed 200):
 *   apikey: <anon-key>          ← API gateway accepts anon key
 *   Authorization: Bearer <user-jwt>  ← PostgREST uses this for RLS (auth.uid() = id)
 *
 * Flow:
 *   1. Verify JWT via GoTrue (adminClient.auth.getUser — works with sb_secret_ key)
 *   2. Read role from public.users via raw REST with anon key + user JWT
 *   3. Gate on ADMIN
 *   4. Delete via raw REST with anon key + user JWT
 *      (relies on RLS SELECT/DELETE policies that allow authenticated users to act on their own data,
 *       or permissive policies — same pattern the browser client uses successfully)
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing story id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // ── Step 1: Extract Bearer token ─────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: no token" }, { status: 401 });
  }

  // ── Step 2: Verify JWT via GoTrue (sb_secret_ key works here) ────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    console.error("[delete-story] JWT verification failed:", authError?.message);
    return NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 });
  }

  // ── Step 3: Read role — anon key + user JWT (confirmed working via diagnostics) ──
  const roleRes = await fetch(
    `${supabaseUrl}/rest/v1/users?select=role&id=eq.${user.id}&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!roleRes.ok) {
    const body = await roleRes.text();
    console.error("[delete-story] Role lookup failed:", roleRes.status, body);
    return NextResponse.json({ error: "Could not verify user role" }, { status: 403 });
  }

  const profiles: Array<{ role: string }> = await roleRes.json();
  const role = profiles[0]?.role;
  console.log("[delete-story] Role:", role, "for user:", user.id);

  if (!role) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: ADMIN role required" }, { status: 403 });
  }

  // ── Step 4: Delete pdf_versions first (FK constraint) ────────────────────────
  const deletePdfRes = await fetch(
    `${supabaseUrl}/rest/v1/pdf_versions?story_id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
      },
    }
  );
  if (!deletePdfRes.ok) {
    const body = await deletePdfRes.text();
    console.warn("[delete-story] pdf_versions delete:", deletePdfRes.status, body);
    // Non-fatal — continue to story delete
  }

  // ── Step 5: Delete the story ──────────────────────────────────────────────────
  const deleteStoryRes = await fetch(
    `${supabaseUrl}/rest/v1/stories?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
      },
    }
  );

  if (!deleteStoryRes.ok) {
    const body = await deleteStoryRes.text();
    console.error("[delete-story] Story delete failed:", deleteStoryRes.status, body);
    return NextResponse.json(
      { error: `Delete failed (${deleteStoryRes.status}): ${body}` },
      { status: 500 }
    );
  }

  console.log("[delete-story] Successfully deleted story:", id);
  return NextResponse.json({ success: true });
}
