"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUserProfile } from "@/services/stories";

const BRANCHES = [
  "Banashankari",
  "HSR Layout",
  "Kalyan Nagar",
  "Hennur Road",
  "Bhattarahalli",
  "Budigere Cross",
  "Hoskote",
  "Hosur"
];

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 3l18 18" />
      <path d="M10.584 10.587a2 2 0 0 0 2.828 2.83" />
      <path d="M9.363 5.365A9.466 9.466 0 0 1 12 5c3.6 0 6.6 2 9 6c-.9 1.5 -1.9 2.77 -3.03 3.79m-2.14 1.61c-1.19.4 -2.43.6 -3.83.6c-3.6 0 -6.6 -2 -9 -6c.9 -1.5 1.9 -2.77 3.03 -3.79" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF", assigned_centre: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guard = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile || profile.role !== "ADMIN") {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    };
    guard();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const signUpData: any = { name: form.name, role: form.role };
      if (form.role === "STAFF" || form.role === "APPROVER") {
        if (!form.assigned_centre) {
          setError("Please select a branch.");
          setLoading(false);
          return;
        }
        signUpData.assigned_centre = form.assigned_centre;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: signUpData,
        },
      });

      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      if (data.session) {
        router.push("/dashboard");
      } else {
        setSuccess("Account created! Check your email for a confirmation link, then sign in.");
        setLoading(false);
        setTimeout(() => router.push("/login"), 4000);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Ovum Hospital" width={160} height={60} className="object-contain" priority />
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Create Staff Account</h2>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg">
            {success}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
              placeholder="Jane Doe"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Role</label>
            <select
              value={form.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setForm((f) => ({
                  ...f,
                  role: newRole,
                  assigned_centre: newRole === "ADMIN" ? "" : f.assigned_centre,
                }));
              }}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white"
              required
            >
              <option value="STAFF">Reception / Staff</option>
              <option value="APPROVER">Approver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {(form.role === "STAFF" || form.role === "APPROVER") && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Branch / Centre</label>
              <select
                value={form.assigned_centre}
                onChange={set("assigned_centre")}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white"
                required
              >
                <option value="">Select a branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#3bbfbf] hover:bg-[#2ea8a8] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/dashboard" className="text-[#3bbfbf] font-medium hover:underline">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
