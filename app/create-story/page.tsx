"use client";
import { useRef, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useStory } from "@/context/StoryContext";
import { getCurrentUserProfile } from "@/services/stories";
import { recordStoryAudit } from "@/services/activityLogs";
import Toast from "@/components/Toast";

const toTitleCase = (str: string) => {
  return str
    .split(" ")
    .map(word => {
      // Slashes (e.g. B/O, S/O, W/O)
      if (word.includes("/")) {
        return word.split("/").map(part => {
          const lower = part.toLowerCase();
          if (lower === "o") return "O";
          if (lower === "s") return "S";
          if (lower === "w") return "W";
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join("/");
      }
      // Single Quote (e.g. O'Connor)
      if (word.includes("'")) {
        return word.split("'").map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("'");
      }
      // Dash (e.g. double-barrelled)
      if (word.includes("-")) {
        return word.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const capitalizedFields = [
  "babyName", "motherName", "fatherName",
  "maternalGrandmother", "maternalGrandfather",
  "paternalGrandmother", "paternalGrandfather",
  "otherFamily", "firstOutfit", "motherOutfit", "roomType",
];

const nameOnlyFields = [
  "babyName", "motherName", "fatherName",
  "maternalGrandmother", "maternalGrandfather",
  "paternalGrandmother", "paternalGrandfather",
  "otherFamily",
];

const BRANCHES = [
  { name: "Banashankari",   lat: "12.9248", lng: "77.5401" },
  { name: "HSR Layout",     lat: "12.9103", lng: "77.6432" },
  { name: "Kalyan Nagar",   lat: "13.0221", lng: "77.6494" },
  { name: "Hennur Road",    lat: "13.0538", lng: "77.6398" },
  { name: "Bhattarahalli",  lat: "13.0242", lng: "77.7126" },
  { name: "Budigere Cross", lat: "13.0505", lng: "77.7411" },
  { name: "Hoskote",        lat: "13.0691", lng: "77.7981" },
  { name: "Hosur",          lat: "12.7364", lng: "77.8322" },
];

function Field({ label, name, value, onChange, type = "text", placeholder = "", ringColor = "focus:ring-[#3bbfbf]", error = false }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; ringColor?: string; error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}{error && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} ${error ? "border-red-400 placeholder-red-300 bg-red-50" : "border-gray-200"}`}
      />
    </div>
  );
}

function TimeSelect({ label, value, onChange, ringColor = "focus:ring-[#3bbfbf]" }: {
  label: string; value: string;
  onChange: (time: string) => void;
  ringColor?: string;
}) {
  const parts = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const initHour = parts ? parts[1] : "12";
  const initMin = parts ? parts[2] : "00";
  const initAmpm = parts ? parts[3].toUpperCase() : "AM";

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMin);
  const [ampm, setAmpm] = useState(initAmpm);

  useEffect(() => {
    if (parts) {
      setHour(parts[1]);
      setMinute(parts[2]);
      setAmpm(parts[3].toUpperCase());
    }
  }, [value]);

  const emit = (h: string, m: string, a: string) => onChange(`${h}:${m} ${a}`);
  const selectClass = `border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} bg-white`;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="flex gap-2">
        <select
          value={hour}
          onChange={(e) => { setHour(e.target.value); emit(e.target.value, minute, ampm); }}
          className={`flex-1 ${selectClass}`}
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(e) => { setMinute(e.target.value); emit(hour, e.target.value, ampm); }}
          className={`flex-1 ${selectClass}`}
        >
          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={ampm}
          onChange={(e) => { setAmpm(e.target.value); emit(hour, minute, e.target.value); }}
          className={`w-20 ${selectClass}`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

function CreateStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const {
    form,
    setForm,
    babyImage,
    setBabyImage,
    saveDraft,
    draftSaved,
    loadStoryFromDb,
    setStoryId,
    saveStoryToDb,
    loading,
    validationError,
    clearValidationError,
  } = useStory();

  // Auto-dismiss validation error after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => clearValidationError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [doctorInput, setDoctorInput] = useState("");
  const [nurseInput, setNurseInput] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push("/login");
        return;
      }
      if (idParam) {
        loadStoryFromDb(idParam);
      } else {
        setStoryId(null);
      }
    };
    checkAuth();
  }, [idParam]);

  const isBoy = form.gender === "male";
  const isGirl = form.gender === "female";

  const accent = isGirl ? "text-pink-400" : "text-[#3bbfbf]";
  const ringColor = isGirl ? "focus:ring-pink-300" : "focus:ring-[#3bbfbf]";
  const btnPrimary = isGirl
    ? "bg-pink-400 hover:bg-pink-500 text-white"
    : "bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white";
  const btnSecondary = isGirl
    ? "border border-pink-400 text-pink-400 hover:bg-pink-50"
    : "border border-[#3bbfbf] text-[#3bbfbf] hover:bg-[#e8f7f7]";
  const uploadBorder = isGirl ? "border-pink-300" : "border-[#3bbfbf]";
  const uploadBg = isGirl ? "bg-pink-50 group-hover:bg-pink-100" : "bg-[#f0fafa] group-hover:bg-[#e0f5f5]";
  const uploadText = isGirl ? "text-pink-400" : "text-[#3bbfbf]";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Allow A-Z, /, -, ', and space
    const cleaned = nameOnlyFields.includes(name) ? value.replace(/[^a-zA-Z\s\/\-']/g, "") : value;
    setForm((f) => ({
      ...f,
      [name]: capitalizedFields.includes(name) ? toTitleCase(cleaned) : cleaned,
    }));
  };

  const requiredFields = {
    babyName: form.babyName,
    motherName: form.motherName,
    fatherName: form.fatherName,
    hospital: form.hospital,
  };
  const hasDoctor = form.doctors.length > 0;
  const hasNurse = form.nurse.length > 0;

  const missingFields = [
    ...Object.entries(requiredFields).filter(([, v]) => !v.trim()).map(([k]) => k),
    ...(!hasDoctor ? ["doctors"] : []),
    ...(!hasNurse ? ["nurse"] : []),
  ];

  const handlePreview = async () => {
    if (missingFields.length > 0) {
      setShowErrors(true);
      return;
    }
    try {
      const savedId = await saveStoryToDb(form.status || "Draft");
      router.push(`/verification?id=${savedId}`);
    } catch (err: unknown) {
      // Validation errors are already shown via the validationError banner
      const msg = err instanceof Error ? err.message : "";
      if (!msg.startsWith("Please enter")) {
        setToast({ message: "Failed to save story. Please try again.", type: "error" });
      }
    }
  };

  const handleSaveDraft = async () => {
    const id = await saveDraft();
    if (id) {
      recordStoryAudit({
        action: idParam ? "STORY_UPDATED" : "STORY_CREATED",
        storyId: id,
        details: {
          baby_name: form.babyName,
          mother_name: form.motherName,
          hospital: form.hospital,
        },
      });
      if (!idParam) {
        router.push(`/create-story?id=${id}`);
      }
    }
  };

  const handleSubmitApproval = async () => {
    if (missingFields.length > 0) {
      setShowErrors(true);
      setToast({ message: "Please fill in all required fields.", type: "error" });
      return;
    }
    try {
      const savedId = await saveStoryToDb("Pending Approval");
      recordStoryAudit({
        action: "STORY_SUBMITTED",
        storyId: savedId,
        details: {
          baby_name: form.babyName,
          mother_name: form.motherName,
          hospital: form.hospital,
        },
      });
      setToast({ message: "Story submitted for approval!", type: "success" });
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.startsWith("Please enter")) {
        setToast({ message: "Failed to submit story. Please try again.", type: "error" });
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBabyImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isReadOnly = form.status === "Pending Approval" || form.status === "Approved" || form.status === "Completed";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="Ovum Hospital" width={120} height={44} className="object-contain" />
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="mb-6 flex justify-between items-center bg-white/70 backdrop-blur-sm px-6 py-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">
            {idParam ? "Edit Birth Story" : "Create New Birth Story"}
          </h1>
          {idParam && form.status && (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              form.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {form.status}
            </span>
          )}
        </div>

        {/* Rejection Warning Banner */}
        {form.status === "Rejected" && form.rejection_reason && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-red-500">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-bold">⚠️ Rejected: {form.rejection_reason}</p>
              <p className="text-xs text-red-600 mt-0.5">Please correct the details and resubmit for approval.</p>
            </div>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-xl shadow-sm animate-[slideDown_0.3s_ease-out] mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-red-400">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium flex-1">{validationError}</p>
            <button
              onClick={clearValidationError}
              className="text-red-400 hover:text-red-600 transition-colors text-lg font-bold leading-none p-1"
            >
              ×
            </button>
          </div>
        )}

        <form className="bg-white/90 backdrop-blur-sm rounded-2xl shadow p-6 sm:p-8 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <fieldset disabled={isReadOnly} className="flex flex-col gap-6 w-full">

          {/* Gender toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, gender: "male" }))}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all border-2 ${
                isBoy
                  ? "bg-blue-500 border-blue-500 text-white shadow-lg scale-105"
                  : "bg-white border-blue-200 text-blue-400 hover:border-blue-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="10" cy="14" r="5" />
                <path d="M13.5 10.5L19 5m-4 0h4v4" />
              </svg>
              Boy
            </button>

            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, gender: "female" }))}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all border-2 ${
                isGirl
                  ? "bg-pink-400 border-pink-400 text-white shadow-lg scale-105"
                  : "bg-white border-pink-200 text-pink-400 hover:border-pink-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="9" r="5" />
                <path d="M12 14v7m-3-3h6" />
              </svg>
              Girl
            </button>
          </div>

          {/* Baby Details */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>Baby Details</h2>
            <div className="flex flex-col lg:flex-row gap-6">
              <div
                className={`w-full lg:w-64 h-[320px] flex-shrink-0 rounded-xl overflow-hidden shadow border-2 border-dashed ${uploadBorder} cursor-pointer group relative`}
                onClick={() => !isReadOnly && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleImageChange} />
                {babyImage ? (
                  <Image src={babyImage} alt="Baby" fill className="object-contain bg-white" unoptimized />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${uploadBg} transition-colors p-4`}>
                    <Image src="/icon.png" alt="Upload" width={48} height={48} className="object-contain" />
                    <p className={`text-sm font-semibold ${uploadText} text-center`}>
                      {isReadOnly ? "No photo uploaded" : "Upload Baby Photo"}
                    </p>
                    {!isReadOnly && <p className="text-xs text-gray-400 text-center">Supported formats: JPG, JPEG, PNG, WEBP</p>}
                  </div>
                )}
                {!isReadOnly && babyImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-semibold">Change Photo</p>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Baby Name", name: "babyName", placeholder: "Baby's name", required: true },
                  { label: "Birth Date", name: "birthDate", type: "date", required: false },
                  { label: "Birth Weight (kg)", name: "birthWeight", placeholder: "2.8", type: "number", required: false },
                  { label: "Height (cm)", name: "height", placeholder: "49", type: "number", required: false },
                ].map(({ label, name, type, placeholder, required }) => {
                  const hasError = showErrors && required && !(form[name as keyof typeof form] as string)?.trim();
                  return (
                    <div key={name} className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">{label}{hasError && <span className="text-red-500 ml-1">*</span>}</label>
                      <input
                        type={type || "text"}
                        name={name}
                        value={form[name as keyof typeof form] as string}
                        onChange={handleChange}
                        placeholder={placeholder || ""}
                        className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} ${hasError ? "border-red-400 placeholder-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </div>
                  );
                })}

                <TimeSelect label="Birth Time" value={form.birthTime} onChange={(t) => setForm((f) => ({ ...f, birthTime: t }))} ringColor={ringColor} />
                <TimeSelect label="First Cry Time" value={form.firstCryTime} onChange={(t) => setForm((f) => ({ ...f, firstCryTime: t }))} ringColor={ringColor} />

                {/* Latitude */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">Latitude</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="13.0216"
                      className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">° N</span>
                  </div>
                </div>

                {/* Longitude */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">Longitude</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="77.6423"
                      className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">° E</span>
                  </div>
                </div>

                {/* Branch dropdown */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Hospital / Branch</label>
                  <select
                    name="hospital"
                    value={form.hospital}
                    onChange={(e) => {
                      const branch = BRANCHES.find((b) => b.name === e.target.value);
                      setForm((f) => ({
                        ...f,
                        hospital: e.target.value,
                        latitude: branch ? branch.lat : f.latitude,
                        longitude: branch ? branch.lng : f.longitude,
                      }));
                    }}
                    className={`border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} bg-white`}
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Family */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>Family</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Mother's Name" name="motherName" value={form.motherName} onChange={handleChange} placeholder="Enter mother's full name" ringColor={ringColor} error={showErrors && !form.motherName.trim()} />
              <Field label="Father's Name" name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Enter father's full name" ringColor={ringColor} error={showErrors && !form.fatherName.trim()} />
              <Field label="Maternal Grandmother's Name" name="maternalGrandmother" value={form.maternalGrandmother} onChange={handleChange} placeholder="Enter mother's mother's name" ringColor={ringColor} />
              <Field label="Maternal Grandfather's Name" name="maternalGrandfather" value={form.maternalGrandfather} onChange={handleChange} placeholder="Enter mother's father's name" ringColor={ringColor} />
              <Field label="Paternal Grandmother's Name" name="paternalGrandmother" value={form.paternalGrandmother} onChange={handleChange} placeholder="Enter father's mother's name" ringColor={ringColor} />
              <Field label="Paternal Grandfather's Name" name="paternalGrandfather" value={form.paternalGrandfather} onChange={handleChange} placeholder="Enter father's father's name" ringColor={ringColor} />
              <Field label="Other" name="otherFamily" value={form.otherFamily} onChange={handleChange} placeholder="Other" ringColor={ringColor} />
            </div>
          </section>

          {/* Hospital */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>Hospital Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Room Type" name="roomType" value={form.roomType} onChange={handleChange} placeholder="Deluxe Suite" ringColor={ringColor} />
              <Field label="Check-in Date" name="checkInDate" value={form.checkInDate} onChange={handleChange} type="date" ringColor={ringColor} />
              <TimeSelect label="Check-in Time" value={form.checkInTime} onChange={(t) => setForm((f) => ({ ...f, checkInTime: t }))} ringColor={ringColor} />
            </div>
          </section>

          {/* Doctors */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>
              Doctors{showErrors && !hasDoctor && <span className="text-red-500 ml-1 text-sm font-normal">* Required</span>}
            </h2>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={doctorInput}
                  onChange={(e) => setDoctorInput("Dr. " + toTitleCase(e.target.value.replace(/^Dr\.\s*/i, "")))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (doctorInput.trim()) {
                        setForm((f) => ({ ...f, doctors: [...f.doctors, doctorInput.trim()] }));
                        setDoctorInput("");
                      }
                    }
                  }}
                  placeholder="Dr. Name"
                  className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} ${showErrors && !hasDoctor ? "border-red-400 placeholder-red-300 bg-red-50" : "border-gray-200"}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (doctorInput.trim()) {
                      setForm((f) => ({ ...f, doctors: [...f.doctors, doctorInput.trim()] }));
                      setDoctorInput("");
                    }
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${isGirl ? "bg-pink-400 hover:bg-pink-500" : "bg-[#3bbfbf] hover:bg-[#2ea8a8]"}`}
                >
                  Add
                </button>
              </div>
              {form.doctors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.doctors.map((d, i) => (
                    <span key={i} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${isGirl ? "bg-pink-100 text-pink-500" : "bg-[#e8f7f7] text-[#3bbfbf]"}`}>
                      {d}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, doctors: f.doctors.filter((_, j) => j !== i) }))} className="ml-1 hover:opacity-70">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Nurses */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>
              Nurses / Sisters{showErrors && !hasNurse && <span className="text-red-500 ml-1 text-sm font-normal">* Required</span>}
            </h2>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nurseInput}
                  onChange={(e) => setNurseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (nurseInput.trim()) {
                        setForm((f) => ({ ...f, nurse: [...f.nurse, nurseInput.trim()] }));
                        setNurseInput("");
                      }
                    }
                  }}
                  placeholder="Sister Name"
                  className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor} ${showErrors && !hasNurse ? "border-red-400 placeholder-red-300 bg-red-50" : "border-gray-200"}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (nurseInput.trim()) {
                      setForm((f) => ({ ...f, nurse: [...f.nurse, nurseInput.trim()] }));
                      setNurseInput("");
                    }
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${isGirl ? "bg-pink-400 hover:bg-pink-500" : "bg-[#3bbfbf] hover:bg-[#2ea8a8]"}`}
                >
                  Add
                </button>
              </div>
              {form.nurse.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.nurse.map((n, i) => (
                    <span key={i} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${isGirl ? "bg-pink-100 text-pink-500" : "bg-[#e8f7f7] text-[#3bbfbf]"}`}>
                      {n}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, nurse: f.nurse.filter((_, j) => j !== i) }))} className="ml-1 hover:opacity-70">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* First Moments */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>First Moments</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Baby's First Outfit" name="firstOutfit" value={form.firstOutfit} onChange={handleChange} placeholder="White and pink" ringColor={ringColor} />
              <Field label="Mother's Outfit" name="motherOutfit" value={form.motherOutfit} onChange={handleChange} placeholder="Cream gown with brown lines" ringColor={ringColor} />
            </div>
          </section>

          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handlePreview}
              className={`flex-1 text-center font-semibold rounded-lg py-2.5 transition-colors ${btnPrimary} disabled:opacity-60`}
            >
              {loading ? "Saving Story..." : "Preview Story"}
            </button>

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveDraft}
                  className={`flex-1 font-semibold rounded-lg py-2.5 transition-colors ${btnSecondary} disabled:opacity-60`}
                >
                  {loading ? "Saving Draft..." : (draftSaved ? "✓ Draft Saved!" : "Save Draft")}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitApproval}
                  className="flex-1 font-semibold rounded-lg py-2.5 text-white transition-colors bg-amber-500 hover:bg-amber-600 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>
              </>
            )}
          </div>
        </form>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function CreateStoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading details...</p>
        </div>
      </div>
    }>
      <CreateStoryContent />
    </Suspense>
  );
}
