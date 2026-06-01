"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useStory } from "@/context/StoryContext";

const MapPreview = dynamic(() => import("@/components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

const BRANCHES = [
  { name: "Banashankari (Bangalore)",   lat: "12.9248", lng: "77.5401" },
  { name: "HSR Layout (Bangalore)",     lat: "12.9103", lng: "77.6432" },
  { name: "Kalyan Nagar (Bangalore)",   lat: "13.0221", lng: "77.6494" },
  { name: "Hennur Road (Bangalore)",    lat: "13.0538", lng: "77.6398" },
  { name: "Bhattarahalli (Bangalore)",  lat: "13.0242", lng: "77.7126" },
  { name: "Budigere Cross (Bangalore)", lat: "13.0505", lng: "77.7411" },
  { name: "Hoskote (Bangalore Rural)",  lat: "13.0691", lng: "77.7981" },
  { name: "Hosur (Tamil Nadu)",         lat: "12.7364", lng: "77.8322" },
];

function Field({ label, name, value, onChange, type = "text", placeholder = "", ringColor = "focus:ring-[#3bbfbf]" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; ringColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
      />
    </div>
  );
}

export default function CreateStoryPage() {
  const { form, setForm, babyImage, setBabyImage, saveDraft, draftSaved } = useStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [doctorInput, setDoctorInput] = useState("");
  const [nurseInput, setNurseInput] = useState("");

  const isBoy = form.gender === "male";
  const isGirl = form.gender === "female";

  const latitude = parseFloat(form.latitude);
  const longitude = parseFloat(form.longitude);

  const isValidLocation =
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  // Dynamic color classes based on gender
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
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBabyImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="Ovum Hospital" width={120} height={44} className="object-contain" />
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <form className="bg-white/90 backdrop-blur-sm rounded-2xl shadow p-6 sm:p-8 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
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
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleImageChange} />
                {babyImage ? (
                  <Image src={babyImage} alt="Baby" fill className="object-contain bg-white" />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${uploadBg} transition-colors p-4`}>
                    <Image src="/icon.png" alt="Upload" width={48} height={48} className="object-contain" />
                    <p className={`text-sm font-semibold ${uploadText} text-center`}>Upload Baby Photo</p>
                    <p className="text-xs text-gray-400 text-center">Supported formats: JPG, JPEG, PNG, WEBP</p>
                  </div>
                )}
                {babyImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-semibold">Change Photo</p>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Baby Name", name: "babyName", placeholder: "Baby's name" },
                  { label: "Birth Date", name: "birthDate", type: "date" },
                  { label: "Birth Time", name: "birthTime", type: "time" },
                  { label: "First Cry Time", name: "firstCryTime", type: "time" },
                  { label: "Birth Weight (kg)", name: "birthWeight", placeholder: "2.8" },
                  { label: "Height (cm)", name: "height", placeholder: "49" },
                  { label: "Latitude", name: "latitude", placeholder: "13.0216" },
                  { label: "Longitude", name: "longitude", placeholder: "77.6423" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">{label}</label>
                    <input
                      type={type || "text"}
                      name={name}
                      value={form[name as keyof typeof form] as string}
                      onChange={handleChange}
                      placeholder={placeholder || ""}
                      className={`border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
                    />
                  </div>
                ))}

                {/* Branch dropdown — auto-fills lat/lng */}
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
              <Field label="Mother's Name" name="motherName" value={form.motherName} onChange={handleChange} placeholder="Enter mother's full name" ringColor={ringColor} />
              <Field label="Father's Name" name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Enter father's full name" ringColor={ringColor} />
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
              <Field label="Check-in Time" name="checkInTime" value={form.checkInTime} onChange={handleChange} type="time" ringColor={ringColor} />
            </div>
          </section>

          {/* Doctors */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>Doctors</h2>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={doctorInput}
                  onChange={(e) => setDoctorInput(e.target.value)}
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
                  className={`flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
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
            <h2 className={`text-base font-semibold mb-4 ${accent}`}>Nurses / Sisters</h2>
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
                  className={`flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
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
          

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/verification" className={`flex-1 text-center font-semibold rounded-lg py-2.5 transition-colors ${btnPrimary}`}>
              Preview Story
            </Link>
            <button
              type="button"
              onClick={saveDraft}
              className={`flex-1 font-semibold rounded-lg py-2.5 transition-colors ${btnSecondary}`}
            >
              {draftSaved ? "✓ Draft Saved!" : "Save Draft"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
