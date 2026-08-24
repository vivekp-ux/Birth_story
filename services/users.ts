import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/story";

export async function fetchUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as UserProfile[]) || [];
}

export async function deleteUser(userId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Authentication required");

  const res = await fetch(`/api/users?id=${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Failed to delete user");
  }
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Authentication required");

  const res = await fetch("/api/users/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, newPassword }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Failed to reset password");
  }

  return body.message || "Password successfully reset";
}

export async function changeMyPassword(newPassword: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Authentication required");

  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Failed to change password");
  }
}
