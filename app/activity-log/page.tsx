"use client";
import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchActivityLogs } from "@/services/activityLogs";
import { getCurrentUserProfile } from "@/services/stories";
import { ActivityLog, UserProfile } from "@/types/story";

function formatRelativeTime(isoStr: string) {
  if (!isoStr) return "—";
  const date = new Date(isoStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatExactTime(isoStr: string) {
  if (!isoStr) return "—";
  const date = new Date(isoStr);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getActionStyle(action: string) {
  switch (action) {
    case "STORY_CREATED":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        badge: "bg-blue-100 text-blue-700",
        label: "Story Created",
      };
    case "STORY_UPDATED":
      return {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-700",
        badge: "bg-indigo-100 text-indigo-700",
        label: "Story Updated",
      };
    case "STORY_SUBMITTED":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700",
        label: "Submitted for Approval",
      };
    case "STORY_APPROVED":
      return {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-700",
        badge: "bg-teal-100 text-teal-700",
        label: "Story Approved",
      };
    case "STORY_REJECTED":
      return {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        badge: "bg-rose-100 text-rose-700",
        label: "Story Rejected",
      };
    case "STORY_DELETED":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        badge: "bg-red-100 text-red-700",
        label: "Story Deleted",
      };
    case "PDF_GENERATED":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700",
        label: "Keepsake PDF Generated",
      };
    case "USER_CREATED":
      return {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-700",
        badge: "bg-teal-100 text-teal-700",
        label: "User Created",
      };
    case "USER_DELETED":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        badge: "bg-red-100 text-red-700",
        label: "User Deleted",
      };
    case "PASSWORD_CHANGED":
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        badge: "bg-purple-100 text-purple-700",
        label: "Password Changed",
      };
    case "PASSWORD_RESET":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-700",
        label: "Password Reset (Admin)",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-700",
        badge: "bg-gray-100 text-gray-700",
        label: action.replace(/_/g, " "),
      };
  }
}

function ActionIcon({ action }: { action: string }) {
  if (action.includes("DELETE")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-600">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
      </svg>
    );
  }
  if (action === "STORY_APPROVED") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-teal-600">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    );
  }
  if (action === "STORY_REJECTED") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-rose-600">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    );
  }
  if (action.includes("PASSWORD")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-600">
        <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707l5.414-5.414A5 5 0 018 7zm1-2a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    );
  }
  if (action === "PDF_GENERATED") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
      </svg>
    );
  }
  if (action === "USER_CREATED") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-teal-600">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function ActivityLogContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const PAGE_SIZE = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let profile = currentUser;
      if (!profile) {
        profile = await getCurrentUserProfile();
        if (!profile) {
          router.push("/login");
          return;
        }
        setCurrentUser(profile);
      }

      const { logs: data, total, totalPages: pages } = await fetchActivityLogs({
        page: currentPage,
        limit: PAGE_SIZE,
        category: categoryFilter,
        action: actionFilter,
        search: searchQuery,
      });

      setLogs(data);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, categoryFilter, actionFilter, searchQuery]);

  const renderDetails = (log: ActivityLog) => {
    const d = log.details || {};
    const items: React.ReactNode[] = [];

    if (d.baby_name) {
      items.push(
        <span key="baby" className="font-semibold text-gray-800">
          Baby: <span className="text-[#3bbfbf]">{d.baby_name}</span>
        </span>
      );
    }

    if (d.hospital) {
      items.push(
        <span key="hospital" className="text-gray-500">
          Branch: <span className="font-medium text-gray-700">{d.hospital}</span>
        </span>
      );
    }

    if (d.reason) {
      items.push(
        <span key="reason" className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[11px] font-semibold">
          Reason: {d.reason}
        </span>
      );
    }

    if (d.created_user_name || d.target_user_name || d.deleted_user_name) {
      const target = d.created_user_name || d.target_user_name || d.deleted_user_name;
      const targetRole = d.role || d.target_user_role || d.deleted_user_role;
      items.push(
        <span key="target" className="font-semibold text-gray-700">
          Target User: <span className="text-purple-600">{target}</span> {targetRole ? `(${targetRole})` : ""}
        </span>
      );
    }

    if (d.previous_status) {
      items.push(
        <span key="prevStatus" className="text-gray-400 text-xs">
          (was {d.previous_status})
        </span>
      );
    }

    if (items.length === 0) {
      return <span className="text-gray-400 text-xs italic">System operation completed</span>;
    }

    return <div className="flex flex-wrap items-center gap-2 text-xs">{items}</div>;
  };

  const startRange = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#3bbfbf] hover:text-[#3bbfbf] text-xs font-semibold transition-all"
          >
            ← Back to Dashboard
          </Link>
          <Image src="/logo.png" alt="Ovum Hospital" width={110} height={40} className="object-contain" />
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.role === "ADMIN" && (
            <Link
              href="/register"
              className="text-xs font-semibold px-3 py-1.5 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-lg transition-all"
            >
              User Directory
            </Link>
          )}
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
            System Audit Trail
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Activity & Audit Log</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Immutable healthcare audit record tracking story lifecycle, approvals, user actions, and security events.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Logs
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search audit trail by user, baby name, branch, action..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50/50 text-gray-700"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Category Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { label: "All Events", value: "All" },
                { label: "Story Events", value: "STORY" },
                { label: "User Management", value: "USER" },
                { label: "Security / Auth", value: "AUTH" },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategoryFilter(c.value);
                    setActionFilter("All");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === c.value
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Action Specific Filter */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700 font-semibold"
            >
              <option value="All">All Actions</option>
              <option value="STORY_CREATED">Story Created</option>
              <option value="STORY_UPDATED">Story Updated</option>
              <option value="STORY_SUBMITTED">Story Submitted</option>
              <option value="STORY_APPROVED">Story Approved</option>
              <option value="STORY_REJECTED">Story Rejected</option>
              <option value="STORY_DELETED">Story Deleted</option>
              <option value="PDF_GENERATED">PDF Generated</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="PASSWORD_CHANGED">Password Changed</option>
              <option value="PASSWORD_RESET">Password Reset (Admin)</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden flex-1 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Event & Action</th>
                  <th className="py-3.5 px-5">Actor / User</th>
                  <th className="py-3.5 px-5">Operational Details</th>
                  <th className="py-3.5 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-gray-400">Loading audit trail...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <p className="font-semibold text-gray-500">No activity logs found.</p>
                        <p className="text-xs">System operations and events will appear here automatically.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const style = getActionStyle(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Event / Action */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${style.bg} border ${style.border}`}>
                              <ActionIcon action={log.action} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-gray-800">{style.label}</span>
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                {log.entity_type}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-gray-800">{log.user_name || "System"}</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {log.user_role || "STAFF"}
                            </span>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-5">
                          {renderDetails(log)}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-gray-700">
                              {formatRelativeTime(log.created_at)}
                            </span>
                            <span className="text-[10px] text-gray-400" title={formatExactTime(log.created_at)}>
                              {formatExactTime(log.created_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          {!loading && logs.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3.5 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{startRange}–{endRange}</span> of{" "}
                <span className="font-semibold text-gray-600">{totalCount}</span> audit entries
              </p>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ActivityLogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading audit log...</p>
          </div>
        </div>
      }
    >
      <ActivityLogContent />
    </Suspense>
  );
}
