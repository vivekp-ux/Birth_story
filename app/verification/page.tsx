"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useStory } from "@/context/StoryContext";
import { getCurrentUserProfile } from "@/services/stories";
import { recordStoryAudit } from "@/services/activityLogs";
import { UserProfile } from "@/types/story";
import Toast from "@/components/Toast";

function VerificationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  
  const { form, setForm, babyImage, loadStoryFromDb, loading, saveStoryToDb } = useStory();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push("/login");
        return;
      }
      setUserProfile(profile);
      if (idParam && (!form.id || form.id !== idParam)) {
        loadStoryFromDb(idParam);
      }
    };
    checkAuth();
  }, [idParam]);

  const accent = form.gender === "female" ? "text-pink-400" : "text-[#3bbfbf]";
  const accentHex = form.gender === "female" ? "#f472b6" : "#3bbfbf";
  const btnPrimary = form.gender === "female" ? "bg-pink-400 hover:bg-pink-500 text-white" : "bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white";
  const btnSecondary = form.gender === "female" ? "border border-pink-400 text-pink-400 hover:bg-pink-50" : "border border-[#3bbfbf] text-[#3bbfbf] hover:bg-[#e8f7f7]";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading details for verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center gap-4">
        <Link href={form.id ? `/create-story?id=${form.id}` : "/create-story"} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">Verify Details</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">

          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg min-h-[300px] relative bg-white flex items-center justify-center">
            {babyImage ? (
              <Image
                src={babyImage}
                alt="Baby"
                width={600}
                height={800}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8">
                <Image src="/icon.png" alt="No image" width={64} height={64} className="object-contain opacity-40" />
                <p className="text-sm text-gray-400">No photo uploaded</p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <Image src="/logo.png" alt="Ovum Hospital" width={130} height={48} className="object-contain" />
              </div>

              <h2 className={`text-base font-semibold uppercase tracking-widest mb-5 ${accent}`}>
                Your First Moments
              </h2>

              <dl className="flex flex-col gap-4 text-sm">
                {[
                  ["Baby Name", form.babyName || "—"],
                  ["Birth Weight", form.birthWeight ? form.birthWeight + " kg" : "—"],
                  ["Height", form.height ? form.height + " cm" : "—"],
                  ["First Cry Time", form.firstCryTime || "—"],
                  ["Latitude", form.latitude ? `${form.latitude}° N` : "—"],
                  ["Longitude", form.longitude ? `${form.longitude}° E` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <dt className="font-semibold text-gray-600">{label}</dt>
                    <dd className="font-semibold" style={{ color: accentHex }}>{value}</dd>
                  </div>
                ))}
              </dl>

              {(form.firstOutfit || form.motherOutfit) && (
                <p className="mt-5 text-sm text-gray-500 leading-relaxed">
                  {form.firstOutfit && <>Your first outfit was <span className="text-gray-700 font-medium">{form.firstOutfit}</span></>}
                  {form.firstOutfit && form.motherOutfit && ", "}
                  {form.motherOutfit && <>while your mother wore a <span className="text-gray-700 font-medium">{form.motherOutfit}</span> during delivery</>}.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-8">
              {/* Approver Controls */}
              {userProfile?.role === "APPROVER" && (
                <>
                  {form.status === "Pending Approval" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          setSubmittingAction(true);
                          try {
                            const savedId = await saveStoryToDb("Approved");
                            recordStoryAudit({
                              action: "STORY_APPROVED",
                              storyId: savedId || form.id,
                              details: {
                                baby_name: form.babyName,
                                mother_name: form.motherName,
                                hospital: form.hospital,
                              },
                            });
                            setToast({ message: "Keepsake approved successfully!", type: "success" });
                            setTimeout(() => router.push("/dashboard"), 1500);
                          } catch (err: any) {
                            setToast({ message: "Failed to approve: " + err.message, type: "error" });
                          } finally {
                            setSubmittingAction(false);
                          }
                        }}
                        disabled={submittingAction}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
                      >
                        {submittingAction ? "Approving..." : "Approve Keepsake"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectionReason("");
                          setShowRejectModal(true);
                        }}
                        disabled={submittingAction}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
                      >
                        Reject Keepsake
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className={`px-4 py-2.5 rounded-lg border text-center font-semibold text-sm ${
                        form.status === "Approved" || form.status === "Completed"
                          ? "bg-teal-50 border-teal-200 text-teal-700"
                          : form.status === "Rejected"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}>
                        Status: {form.status} {form.status === "Rejected" && form.rejection_reason ? `(${form.rejection_reason})` : ""}
                      </div>
                      {(form.status === "Approved" || form.status === "Completed") && (
                        <Link
                          href={form.id ? `/pdf-preview?id=${form.id}` : "/pdf-preview"}
                          className={`w-full text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnPrimary}`}
                        >
                          View/Print Booklet
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Staff / Admin Controls */}
              {userProfile?.role !== "APPROVER" && (
                <>
                  {form.status === "Pending Approval" && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-center rounded-lg px-4 py-2.5 text-xs font-semibold animate-pulse">
                        Waiting for Centre Approval
                      </div>
                      <Link
                        href={form.id ? `/pdf-preview?id=${form.id}` : "/pdf-preview"}
                        className={`w-full text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnSecondary}`}
                      >
                        Preview PDF Layout (Print Disabled)
                      </Link>
                    </div>
                  )}

                  {(form.status === "Approved" || form.status === "Completed") && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-center rounded-lg px-4 py-2.5 text-xs font-semibold">
                        Approved - Ready to Print!
                      </div>
                      <Link
                        href={form.id ? `/pdf-preview?id=${form.id}` : "/pdf-preview"}
                        className={`w-full text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnPrimary}`}
                      >
                        Print / Generate Keepsake PDF
                      </Link>
                    </div>
                  )}

                  {(form.status === "Draft" || form.status === "Rejected") && (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setSubmittingAction(true);
                            try {
                              const savedId = await saveStoryToDb("Pending Approval");
                              recordStoryAudit({
                                action: "STORY_SUBMITTED",
                                storyId: savedId || form.id,
                                details: {
                                  baby_name: form.babyName,
                                  mother_name: form.motherName,
                                  hospital: form.hospital,
                                },
                              });
                              setToast({ message: "Story submitted for approval!", type: "success" });
                              setTimeout(() => router.push("/dashboard"), 1500);
                            } catch (err: any) {
                              setToast({ message: "Submission failed: " + err.message, type: "error" });
                            } finally {
                              setSubmittingAction(false);
                            }
                          }}
                          disabled={submittingAction}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
                        >
                          {submittingAction ? "Submitting..." : "Submit for Approval"}
                        </button>

                        <Link
                          href={form.id ? `/create-story?id=${form.id}` : "/create-story"}
                          className={`flex-1 text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnSecondary}`}
                        >
                          Edit Details
                        </Link>
                      </div>

                      <Link
                        href={form.id ? `/pdf-preview?id=${form.id}` : "/pdf-preview"}
                        className="text-center text-xs font-semibold text-gray-500 hover:underline py-1"
                      >
                        Preview PDF Layout (Draft)
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Reject Birth Story</h3>
              <p className="text-xs text-gray-400 mt-1">Select a reason or enter a custom correction requirement.</p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                "Doctor name mismatch",
                "Mother name incorrect",
                "DOB incorrect"
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectionReason(reason)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    rejectionReason === reason
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter details about what corrections are required..."
                rows={3}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50/50"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    setToast({ message: "Please specify a reason.", type: "error" });
                    return;
                  }
                  setSubmittingAction(true);
                  try {
                    // Update form state with rejection reason first
                    setForm((f) => ({ ...f, rejection_reason: rejectionReason }));
                    
                    // Call saveStoryToDb with Rejected status
                    // Note: setForm takes effect after rerender, so let's set it in the payload explicitly
                    const dbStory = { ...form, status: "Rejected" as const, rejection_reason: rejectionReason };
                    const dbData = {
                      baby_name: dbStory.babyName,
                      gender: dbStory.gender || undefined,
                      birth_date: dbStory.birthDate || undefined,
                      birth_time: dbStory.birthTime,
                      birth_weight: dbStory.birthWeight ? dbStory.birthWeight : undefined,
                      height: dbStory.height ? dbStory.height : undefined,
                      first_cry_time: dbStory.firstCryTime,
                      latitude: dbStory.latitude,
                      longitude: dbStory.longitude,
                      hospital: dbStory.hospital,
                      mother_name: dbStory.motherName,
                      father_name: dbStory.fatherName,
                      maternal_grandmother: dbStory.maternalGrandmother,
                      maternal_grandfather: dbStory.maternalGrandfather,
                      paternal_grandmother: dbStory.paternalGrandmother,
                      paternal_grandfather: dbStory.paternalGrandfather,
                      other_family: dbStory.otherFamily,
                      room_type: dbStory.roomType,
                      checkin_date: dbStory.checkInDate || undefined,
                      checkin_time: dbStory.checkInTime,
                      doctor_names: dbStory.doctors,
                      nurse_names: dbStory.nurse,
                      baby_first_outfit: dbStory.firstOutfit,
                      mother_outfit: dbStory.motherOutfit,
                      first_feed: dbStory.firstCryTime,
                      status: "Rejected" as const,
                      photo_url: dbStory.photo_url || null,
                      latest_pdf_url: dbStory.latest_pdf_url || null,
                      rejection_reason: rejectionReason,
                    };
                    if (form.id) {
                      (dbData as any).id = form.id;
                    }
                    const { saveStory } = await import("@/services/stories");
                    await saveStory(dbData);

                    recordStoryAudit({
                      action: "STORY_REJECTED",
                      storyId: form.id,
                      details: {
                        baby_name: dbStory.babyName,
                        mother_name: dbStory.motherName,
                        hospital: dbStory.hospital,
                        reason: rejectionReason,
                      },
                    });
                    
                    setShowRejectModal(false);
                    setToast({ message: "Keepsake rejected and sent back for corrections.", type: "info" });
                    setTimeout(() => router.push("/dashboard"), 1500);
                  } catch (err: any) {
                    setToast({ message: "Failed to reject: " + err.message, type: "error" });
                  } finally {
                    setSubmittingAction(false);
                  }
                }}
                disabled={submittingAction}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-xs transition-colors cursor-pointer"
              >
                {submittingAction ? "Submitting..." : "Confirm Reject"}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={submittingAction}
                className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading verification details...</p>
        </div>
      </div>
    }>
      <VerificationPageContent />
    </Suspense>
  );
}
