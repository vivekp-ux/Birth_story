"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: wire up your auth provider here
    if (form.email && form.password) {
      router.push("/dashboard");
    } else {
      setError("Please fill in all fields.");
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

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {[
            { label: "Full Name", key: "name", type: "text", autoComplete: "name", placeholder: "Jane Doe" },
            { label: "Email", key: "email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
            { label: "Password", key: "password", type: "password", autoComplete: "new-password", placeholder: "••••••••" },
          ].map(({ label, key, type, autoComplete, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">{label}</label>
              <input
                type={type}
                autoComplete={autoComplete}
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                placeholder={placeholder}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
                required
              />
            </div>
          ))}

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
