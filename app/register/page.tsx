"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUserProfile } from "@/services/stories";
import { fetchUsers, deleteUser } from "@/services/users";
import { UserProfile } from "@/types/story";
import Toast from "@/components/Toast";
import AdminResetPasswordModal from "@/components/AdminResetPasswordModal";

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

function formatDate(isoStr?: string) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function UserManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"directory" | "create">("directory");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [checking, setChecking] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "ADMIN" | "STAFF" | "APPROVER">("All");
  const [branchFilter, setBranchFilter] = useState("All");

  // Create User Form State
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF", assigned_centre: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal & Toast
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const loadUsersList = async () => {
    try {
      setLoadingUsers(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setToast({ message: "Failed to load users: " + (err?.message || ""), type: "error" });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const guard = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile || profile.role !== "ADMIN") {
        router.replace("/login");
      } else {
        setCurrentUser(profile);
        setChecking(false);
        loadUsersList();
      }
    };
    guard();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const signUpData: any = { name: form.name.trim(), role: form.role };
      if (form.role === "STAFF" || form.role === "APPROVER") {
        if (!form.assigned_centre) {
          setCreateError("Please select a branch.");
          setCreating(false);
          return;
        }
        signUpData.assigned_centre = form.assigned_centre;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          ...signUpData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || "An error occurred during registration.");
        setCreating(false);
        return;
      }

      setToast({ message: `Account created for ${form.name}!`, type: "success" });
      setForm({ name: "", email: "", password: "", role: "STAFF", assigned_centre: "" });
      setCreating(false);
      
      // Refresh list and switch to directory tab
      await loadUsersList();
      setActiveTab("directory");
    } catch (err: any) {
      setCreateError(err?.message || "An error occurred during registration.");
      setCreating(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      setToast({ message: "You cannot delete your own admin account.", type: "error" });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setToast({ message: `User "${user.name}" deleted successfully.`, type: "success" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      setToast({ message: "Failed to delete user: " + (err?.message || ""), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.assigned_centre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesBranch = branchFilter === "All" || (u.assigned_centre === branchFilter);

    return matchesSearch && matchesRole && matchesBranch;
  });

  const staffCount = users.filter((u) => u.role === "STAFF").length;
  const approverCount = users.filter((u) => u.role === "APPROVER").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

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
          <Link
            href="/activity-log"
            className="text-xs font-semibold px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all"
          >
            Activity Log
          </Link>
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 border border-purple-200 text-purple-700">
            Admin Portal
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 flex flex-col gap-6">
        {/* Title & Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff & User Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage hospital staff accounts, assign centre roles, and control system access.
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/80">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "directory"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              User Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "create"
                  ? "bg-[#3bbfbf] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>+</span> Add New Staff
            </button>
          </div>
        </div>

        {/* User Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-gray-400">Total Users</span>
            <span className="text-2xl font-black text-gray-800 mt-1">{users.length}</span>
          </div>
          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-teal-600">Staff Members</span>
            <span className="text-2xl font-black text-teal-700 mt-1">{staffCount}</span>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-blue-600">Approvers</span>
            <span className="text-2xl font-black text-blue-700 mt-1">{approverCount}</span>
          </div>
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-purple-600">Administrators</span>
            <span className="text-2xl font-black text-purple-700 mt-1">{adminCount}</span>
          </div>
        </div>

        {/* Tab 1: User Directory */}
        {activeTab === "directory" && (
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search user by name, email, branch or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-gray-50/50 text-gray-700"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* Role Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {(["All", "STAFF", "APPROVER", "ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        roleFilter === r
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {r === "All" ? "All Roles" : r}
                    </button>
                  ))}
                </div>

                {/* Branch Dropdown */}
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white text-gray-700 font-semibold"
                >
                  <option value="All">All Branches</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <button
                  onClick={loadUsersList}
                  title="Refresh users"
                  className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Staff Name & Email</th>
                      <th className="py-3.5 px-5">Role</th>
                      <th className="py-3.5 px-5">Assigned Branch</th>
                      <th className="py-3.5 px-5">Date Registered</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-[#3bbfbf] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-gray-400">Loading staff directory...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <p className="font-semibold text-gray-500">No users found.</p>
                            <p className="text-xs">Try adjusting your search criteria or add a new staff member.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isCurrent = u.id === currentUser?.id;
                        const roleColor =
                          u.role === "ADMIN"
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : u.role === "APPROVER"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-teal-50 border-teal-200 text-teal-700";

                        const avatarColor =
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "APPROVER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-teal-100 text-teal-700";

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                            {/* User Info */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${avatarColor}`}>
                                  {(u.name || u.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-gray-800">{u.name || "User"}</span>
                                    {isCurrent && (
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-5">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${roleColor}`}>
                                {u.role}
                              </span>
                            </td>

                            {/* Branch */}
                            <td className="py-3.5 px-5 text-gray-600 text-xs font-semibold">
                              {u.assigned_centre ? (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                  {u.assigned_centre}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">All Centres</span>
                              )}
                            </td>

                            {/* Registered */}
                            <td className="py-3.5 px-5 text-gray-400 text-xs whitespace-nowrap">
                              {formatDate(u.created_at)}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedUserForReset(u)}
                                  className="px-2.5 py-1.5 border border-purple-200 text-purple-600 hover:bg-purple-50 text-xs font-semibold rounded-lg transition-colors"
                                  title="Reset password for user"
                                >
                                  Reset Password
                                </button>

                                {!isCurrent && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={deletingId === u.id}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete user"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                    </svg>
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
            </div>
          </div>
        )}

        {/* Tab 2: Add New Staff */}
        {activeTab === "create" && (
          <div className="max-w-xl mx-auto w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Create Staff / User Account</h2>
            <p className="text-xs text-gray-400 mb-6">Enter staff details to grant platform access.</p>

            {createError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{createError}</span>
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleCreateUser}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Doe"
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-gray-50/50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="staff@ovumhospital.com"
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-gray-50/50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-gray-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Role</label>
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
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white text-gray-700"
                  required
                >
                  <option value="STAFF">Reception / Staff (Create & Edit)</option>
                  <option value="APPROVER">Centre Approver (Verify & Authorize)</option>
                  <option value="ADMIN">System Administrator (Full Access)</option>
                </select>
              </div>

              {(form.role === "STAFF" || form.role === "APPROVER") && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned Branch / Centre</label>
                  <select
                    value={form.assigned_centre}
                    onChange={(e) => setForm((f) => ({ ...f, assigned_centre: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] bg-white text-gray-700"
                    required
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#3bbfbf] hover:bg-[#2ea8a8] disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-sm cursor-pointer"
                >
                  {creating ? "Creating account..." : "Register Staff Member"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("directory")}
                  className="px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl py-2.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Admin Reset Password Modal */}
      {selectedUserForReset && (
        <AdminResetPasswordModal
          user={selectedUserForReset}
          onClose={() => setSelectedUserForReset(null)}
          onSuccess={() => setToast({ message: "Password reset completed successfully!", type: "success" })}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
