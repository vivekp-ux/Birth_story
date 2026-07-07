"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            name: form.name,
            role: form.role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

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

        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Create Account</h2>

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
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Role</label>
            <select
              value={form.role}
              onChange={set("role")}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white"
              required
            >
              <option value="STAFF">Reception / Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#3bbfbf] hover:bg-[#2ea8a8] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3bbfbf] font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
