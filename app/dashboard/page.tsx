"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story, UserProfile, PdfVersion } from "@/types/story";
import { fetchStories, getCurrentUserProfile, fetchPdfVersions, fetchStoryStats } from "@/services/stories";
import Toast from "@/components/Toast";
import * as XLSX from "xlsx";

type StatusFilter = "All" | "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Completed" | "Archived";

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

// Formats "2026-05-09" → "9th May 2026"
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const suffix = ["th","st","nd","rd"][((day % 100) - 20) % 10] ?? ["th","st","nd","rd"][day % 100] ?? "th";
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function formatDateTime(isoStr: string): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Icon components ── */
function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  );
}

/* ── Skeleton row ── */
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {[1,2,3,4,5,6,7].map((i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read params directly from the URL (source of truth)
  const currentPage = Number(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("search") || "";
  const selectedBranch = searchParams.get("branch") || "All";

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Set default status filter based on role (default to Pending Approval for APPROVER)
  const defaultStatus = userProfile?.role === "APPROVER" ? "Pending Approval" : "All";
  const statusFilter = (searchParams.get("status") || defaultStatus) as StatusFilter;

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
  const [activeHistoryStory, setActiveHistoryStory] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  // Search input state to allow typing without triggering fetches on every keystroke
  const [searchInput, setSearchInput] = useState(searchQuery);

  const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_PAGE_SIZE) || 10;

  // Sync searchInput state with URL searchQuery when it changes (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounce search input to update URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateUrl(1, statusFilter, searchInput);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateUrl = (pageVal: number, statusVal: string, searchVal: string, branchVal?: string) => {
    const params = new URLSearchParams();
    if (pageVal > 1) {
      params.set("page", String(pageVal));
    }
    const targetStatus = statusVal || statusFilter;
    if (targetStatus !== "All") {
      params.set("status", targetStatus);
    }
    if (searchVal.trim()) {
      params.set("search", searchVal.trim());
    }
    const branchToUse = branchVal ?? selectedBranch;
    if (branchToUse && branchToUse !== "All") {
      params.set("branch", branchToUse);
    }
    const queryStr = params.toString();
    router.replace(queryStr ? `/dashboard?${queryStr}` : "/dashboard");
  };

  // Redirect APPROVER to Pending Approval if no status is specified
  useEffect(() => {
    if (userProfile && !searchParams.get("status") && userProfile.role === "APPROVER") {
      updateUrl(currentPage, "Pending Approval", searchQuery);
    }
  }, [userProfile]);

  // Load data when URL params change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let profile = userProfile;
        if (!profile) {
          profile = await getCurrentUserProfile();
          if (!profile) {
            router.push("/login");
            return;
          }
          setUserProfile(profile);
        }

        const targetHospital = (profile.role === "ADMIN")
          ? (selectedBranch === "All" ? undefined : selectedBranch)
          : (profile.assigned_centre || undefined);

        const { stories: data, total, totalPages: pages } = await fetchStories({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchQuery,
          status: statusFilter,
          hospital: targetHospital,
        });

        setStories(data);
        setTotalCount(total);
        setTotalPages(pages);

        const statsData = await fetchStoryStats(targetHospital);
        setStats(statsData);
      } catch (err) {
        console.error("Load stories / stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentPage, statusFilter, searchQuery, selectedBranch]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this birth story? This action cannot be undone.")) return;

    // Optimistic Update: remove from local state immediately
    const originalStories = [...stories];
    setStories((prev) => prev.filter((s) => s.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated — please sign in again.");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expired — please sign in again.");

      const res = await fetch(`/api/delete-story?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Delete API error:", res.status, body);
        throw new Error(body.error || `Delete failed (${res.status})`);
      }

      // Background Refetch: sync pagination details & stats in the background
      const targetHospital = (userProfile?.role === "ADMIN")
        ? (selectedBranch === "All" ? undefined : selectedBranch)
        : (userProfile?.assigned_centre || undefined);

      const { stories: data, total, totalPages: pages } = await fetchStories({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        status: statusFilter,
        hospital: targetHospital,
      });
      setStories(data);
      setTotalCount(total);
      setTotalPages(pages);

      const statsData = await fetchStoryStats(targetHospital);
      setStats(statsData);
    } catch (err: unknown) {
      console.error("Delete error:", err);
      // Revert optimistic update on failure
      setStories(originalStories);
      setTotalCount(originalStories.length);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setToast({ message: `Failed to delete: ${msg}`, type: "error" });
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      let filteredStories = data as Story[];
      if (selectedBranch !== "All") {
        filteredStories = filteredStories.filter(s => s.hospital === selectedBranch);
      }

      const headers = [
        "Baby Name", "Gender", "Birth Date", "Birth Time", "Birth Weight", "Height",
        "First Cry Time", "Hospital", "Mother Name", "Father Name", "Room Type",
        "Check-in Date", "Status", "Submitted At", "Approved By", "Approved At"
      ];

      const rows = filteredStories.map(s => [
        s.baby_name || "",
        s.gender || "",
        s.birth_date || "",
        s.birth_time || "",
        s.birth_weight || "",
        s.height || "",
        s.first_cry_time || "",
        s.hospital || "",
        s.mother_name || "",
        s.father_name || "",
        s.room_type || "",
        s.checkin_date || "",
        s.status || "",
        s.submitted_at || "",
        s.approved_by || "",
        s.approved_at || ""
      ]);

      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Birth Stories");
      
      XLSX.writeFile(workbook, `birth_stories_${selectedBranch.toLowerCase().replace(/\s+/g, "_")}.xlsx`);

      setToast({ message: "Export completed successfully!", type: "success" });
    } catch (err) {
      console.error("Export error:", err);
      setToast({ message: "Failed to export data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === "ADMIN";

  const getStatCards = () => {
    const list = [];
    list.push({
      label: "Total Stories",
      count: stats.total,
      filter: "All" as StatusFilter,
      color: "from-[#e0f7f7] to-[#bbf0f0]",
      text: "text-[#1d7b7b]",
      ring: "ring-[#3bbfbf]",
    });

    if (userProfile?.role !== "APPROVER") {
      list.push({
        label: "Draft Stories",
        count: stats.draft,
        filter: "Draft" as StatusFilter,
        color: "from-gray-100 to-gray-200",
        text: "text-gray-600",
        ring: "ring-gray-300",
      });
    }

    list.push({
      label: "Pending Approval",
      count: stats.pending,
      filter: "Pending Approval" as StatusFilter,
      color: "from-[#fff3e0] to-[#ffe0b2]",
      text: "text-[#e65100]",
      ring: "ring-amber-400",
    });

    list.push({
      label: "Approved Stories",
      count: stats.approved,
      filter: "Approved" as StatusFilter,
      color: "from-teal-50 to-teal-100",
      text: "text-teal-700",
      ring: "ring-teal-400",
    });

    if (userProfile?.role !== "APPROVER") {
      list.push({
        label: "Rejected Stories",
        count: stats.rejected,
        filter: "Rejected" as StatusFilter,
        color: "from-red-50 to-red-100",
        text: "text-red-700",
        ring: "ring-red-400",
      });
    }

    list.push({
      label: "Completed Booklets",
      count: stats.completed,
      filter: "Completed" as StatusFilter,
      color: "from-[#e8f5e9] to-[#c8e6c9]",
      text: "text-[#2e7d32]",
      ring: "ring-emerald-400",
    });

    return list;
  };

  const statCards = getStatCards();

  const startRange = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <Image src="/logo.png" alt="Ovum Hospital" width={120} height={44} className="object-contain" />
        <div className="flex items-center gap-4">
          {userProfile && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-600">{userProfile.name}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                isAdmin
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : userProfile.role === "APPROVER"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-teal-50 border-teal-200 text-teal-700"
              }`}>
                {userProfile.role} {userProfile.assigned_centre ? `(${userProfile.assigned_centre})` : ""}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold px-4 py-2 text-gray-600 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-all hover:bg-red-50/40"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back, {userProfile?.name || "…"}!</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {userProfile?.role === "APPROVER" 
              ? `Review and verify birth story keepsakes for the ${userProfile.assigned_centre} branch.`
              : userProfile?.role === "STAFF"
              ? `Create and submit birth story keepsakes for the ${userProfile.assigned_centre} branch.`
              : "Create, review, and print birth story keepsakes for newborn mothers."
            }
          </p>
        </div>

        {/* Stat Cards — clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat) => {
            const isActive = statusFilter === stat.filter;
            return (
              <button
                key={stat.filter}
                onClick={() => updateUrl(1, stat.filter, searchQuery)}
                className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 shadow-sm flex flex-col justify-between border text-left transition-all duration-150 ${
                  isActive
                    ? `ring-2 ${stat.ring} border-transparent shadow-md scale-[1.02]`
                    : "border-white/40 hover:scale-[1.01] hover:shadow"
                }`}
              >
                <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                <span className={`text-4xl font-extrabold mt-3 ${stat.text}`}>
                  {loading ? <span className="inline-block w-8 h-8 bg-white/60 rounded-lg animate-pulse" /> : stat.count}
                </span>
                {isActive && (
                  <span className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">Filtered ↓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + New Story */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white/95 backdrop-blur-sm p-4 sm:px-6 rounded-2xl shadow border border-gray-100">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </span>
            <input
              type="text"
              id="dashboard-search"
              placeholder="Search by baby, mother, father, doctor or hospital…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-gray-50/50"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
            {(userProfile?.role === "APPROVER"
              ? ["Pending Approval", "Approved", "Completed", "All"]
              : ["All", "Draft", "Pending Approval", "Approved", "Rejected", "Completed"]
            ).map((f) => (
              <button
                key={f}
                onClick={() => updateUrl(1, f, searchQuery)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === f
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <select
                value={selectedBranch}
                onChange={(e) => updateUrl(1, statusFilter, searchQuery, e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white text-gray-700 font-semibold"
              >
                <option value="All">All Branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {isAdmin && (
              <button
                onClick={handleExportExcel}
                className="border border-emerald-300 text-emerald-600 hover:bg-emerald-50 text-sm font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export Excel
              </button>
            )}

            {isAdmin && (
              <Link
                href="/register"
                className="border border-purple-300 text-purple-600 hover:bg-purple-50 text-sm font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                  <path d="M16 19h6" />
                  <path d="M19 16v6" />
                  <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
                </svg>
                Add Staff
              </Link>
            )}

            {userProfile?.role !== "APPROVER" && (
              <Link
                href="/create-story"
                className="bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white text-sm font-semibold rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Story
              </Link>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow border border-gray-100 overflow-hidden flex-1 relative">
          {/* Skeletons overlay during fetch */}
          {loading && stories.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="w-8 h-8 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">
                    <span className="flex items-center gap-1.5">
                      Baby
                      <span className="flex items-center gap-1 font-normal normal-case text-[10px] text-gray-400 ml-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" title="Boy" />
                        <span className="hidden sm:inline">Boy</span>
                        <span className="w-2 h-2 rounded-full bg-pink-400 inline-block ml-1" title="Girl" />
                        <span className="hidden sm:inline">Girl</span>
                      </span>
                    </span>
                  </th>
                  <th className="py-3.5 px-5">Mother</th>
                  <th className="py-3.5 px-5">Branch</th>
                  <th className="py-3.5 px-5">Doctor</th>
                  <th className="py-3.5 px-5">Birth Date</th>
                  <th className="py-3.5 px-5">Created</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading && stories.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : stories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-200">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p className="font-semibold text-gray-500">
                          {searchQuery ? `No stories matching "${searchQuery}"` : "No stories found."}
                        </p>
                        <p className="text-xs">
                          {searchQuery
                            ? "Try a different search term or clear the filter."
                            : "Create your first Birth Story."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stories.map((story) => {
                    const isFemale = story.gender === "female";
                    const isCompleted = story.status === "Completed";
                    const babyName = story.baby_name?.trim() || "";
                    const displayName = babyName || "Untitled Draft";

                    return (
                      <tr key={story.id} className="hover:bg-[#f0fbfb] transition-colors group">
                        {/* Baby Name */}
                        <td className="py-3.5 px-5 font-semibold text-gray-800">
                          <div className="flex items-center gap-2">
                            <span
                              title={isFemale ? "Girl" : "Boy"}
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${isFemale ? "bg-pink-400" : "bg-blue-400"}`}
                            />
                            <div className="flex flex-col">
                              <span className={!babyName ? "text-gray-400 italic font-normal" : ""}>
                                {displayName}
                              </span>
                              {story.status === "Rejected" && story.rejection_reason && (
                                <span className="text-[11px] text-red-500 font-medium bg-red-50/50 border border-red-100 rounded px-1.5 py-0.5 mt-0.5 w-max">
                                  Reason: {story.rejection_reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mother */}
                        <td className="py-3.5 px-5 text-gray-600">
                          {story.mother_name || <span className="text-gray-300">—</span>}
                        </td>

                        {/* Branch */}
                        <td className="py-3.5 px-5 text-gray-600 font-medium">
                          {story.hospital || <span className="text-gray-300">—</span>}
                        </td>

                        {/* Doctor */}
                        <td className="py-3.5 px-5 text-gray-500 max-w-[160px] truncate" title={story.doctor_names?.join(", ")}>
                          {story.doctor_names && story.doctor_names.length > 0
                            ? story.doctor_names.join(", ")
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Birth Date */}
                        <td className="py-3.5 px-5 text-gray-500 whitespace-nowrap">
                          {story.birth_date ? formatDate(story.birth_date) : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 px-5 text-gray-400 text-xs whitespace-nowrap">
                          {formatDateTime(story.created_at ?? "")}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            story.status === "Completed"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : story.status === "Approved"
                              ? "bg-teal-50 border-teal-200 text-teal-700"
                              : story.status === "Pending Approval"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : story.status === "Rejected"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : story.status === "Archived"
                              ? "bg-gray-100 border-gray-200 text-gray-500"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}>
                            {story.status || "Draft"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit / Review */}
                            {userProfile?.role === "APPROVER" ? (
                              <Link
                                href={`/verification?id=${story.id}`}
                                className="px-3 py-1.5 bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                              >
                                Review
                              </Link>
                            ) : (
                              <>
                                {(isAdmin || (userProfile?.role === "STAFF" && (story.status === "Draft" || story.status === "Rejected"))) ? (
                                  <Link
                                    href={`/create-story?id=${story.id}`}
                                    title="Edit story"
                                    className="p-1.5 rounded-lg text-[#3bbfbf] hover:bg-[#e0f7f7] transition-colors"
                                  >
                                    <IconEdit />
                                  </Link>
                                ) : (
                                  <span title="Editing disabled after submission" className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed">
                                    <IconEdit />
                                  </span>
                                )}

                                {/* Preview */}
                                <Link
                                  href={`/verification?id=${story.id}`}
                                  title="Preview story"
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                >
                                  <IconEye />
                                </Link>
                              </>
                            )}

                            {/* History */}
                            {isCompleted ? (
                              <button
                                onClick={() => setActiveHistoryStory({ id: story.id!, name: displayName })}
                                title="View PDF history"
                                className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              >
                                <IconHistory />
                              </button>
                            ) : (
                              userProfile?.role !== "APPROVER" && (
                                <span title="PDF history available after completion" className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed">
                                  <IconHistory />
                                </span>
                              )
                            )}

                            {/* PDF */}
                            {story.latest_pdf_url ? (
                              <a
                                href={story.latest_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download PDF"
                                className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                              >
                                <IconPdf />
                              </a>
                            ) : (
                              userProfile?.role !== "APPROVER" && (
                                <span title="PDF available after story is completed" className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed">
                                  <IconPdf />
                                </span>
                              )
                            )}

                            {/* Delete */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(story.id!)}
                                title="Delete story"
                                className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors ml-0.5"
                              >
                                <IconTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer — row count & pagination controls */}
          {!loading && stories.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3.5 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{startRange}–{endRange}</span> of{" "}
                <span className="font-semibold text-gray-600">{totalCount}</span> stories
              </p>
              
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1 || loading}
                  onClick={() => updateUrl(currentPage - 1, statusFilter, searchQuery)}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => updateUrl(currentPage + 1, statusFilter, searchQuery)}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Version History Modal */}
      {activeHistoryStory && (
        <VersionHistoryModal
          storyId={activeHistoryStory.id}
          babyName={activeHistoryStory.name}
          onClose={() => setActiveHistoryStory(null)}
        />
      )}
    </div>
  );
}

/* ─── Version History Modal ─── */
function VersionHistoryModal({ storyId, babyName, onClose }: { storyId: string; babyName: string; onClose: () => void }) {
  const [versions, setVersions] = useState<PdfVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const data = await fetchPdfVersions(storyId);
        setVersions(data);
      } catch (err) {
        console.error("Error loading PDF versions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
  }, [storyId]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col max-h-[85vh] border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-800 text-lg">Keepsake PDF History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none">×</button>
        </div>

        <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-lg">
          Version archive for baby: <span className="font-semibold text-[#3bbfbf]">{babyName}</span>
        </p>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-6 h-6 border-2 border-[#3bbfbf] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading versions…</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">No booklet versions archived yet.</div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex justify-between items-center border border-gray-100 rounded-xl p-3 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-xs text-gray-800">Version {v.version}</p>
                  <p className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleString()}</p>
                </div>
                <a
                  href={v.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                >
                  Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
