"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const handleSignOut = () => {
    // TODO: clear auth state when auth provider is wired up
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between">
        <Image src="/logo.png" alt="Ovum Hospital" width={120} height={44} className="object-contain" />
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome back</h2>
        <p className="text-gray-500 mb-8">Create and manage birth story booklets.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/create-story"
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow flex flex-col gap-3 border border-transparent hover:border-[#3bbfbf]"
          >
            <div className="w-10 h-10 rounded-full bg-[#e8f7f7] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3bbfbf"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Create New Story</h3>
            <p className="text-sm text-gray-500">
              Fill in birth details and generate a personalised booklet.
            </p>
          </Link>

          <Link
            href="/pdf-preview"
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow flex flex-col gap-3 border border-transparent hover:border-[#3bbfbf]"
          >
            <div className="w-10 h-10 rounded-full bg-[#e8f7f7] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3bbfbf"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">
              Preview &amp; Print
            </h3>
            <p className="text-sm text-gray-500">
              Preview the birth story booklet and download as PDF.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
