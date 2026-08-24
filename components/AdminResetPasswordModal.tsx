"use client";
import { useState } from "react";
import { adminResetPassword } from "@/services/users";
import { UserProfile } from "@/types/story";

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

interface AdminResetPasswordModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdminResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: AdminResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const msg = await adminResetPassword(user.id, newPassword);
      setSuccessMsg(msg);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || "Failed to reset user password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-[scaleIn_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Reset User Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">Admin Security Control</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-3.5 mb-5 flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">User:</span>
            <span className="font-bold text-gray-800">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Email:</span>
            <span className="font-semibold text-gray-700">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Role / Branch:</span>
            <span className="font-semibold text-[#3bbfbf]">{user.role} ({user.assigned_centre || "All Branches"})</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-emerald-600">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">New Password for User</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50/50"
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
            <p className="text-[11px] text-gray-400 mt-0.5">
              The user can use this new password immediately to sign in.
            </p>
          </div>

          <div className="flex gap-2.5 mt-3">
            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-sm cursor-pointer"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl py-2.5 text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
