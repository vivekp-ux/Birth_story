"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStory } from "@/context/StoryContext";

function Field({ label, name, value, onChange, type = "text", placeholder = "" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
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
        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf]"
      />
    </div>
  );
}

export default function CreateStoryPage() {
  const { form, setForm, babyImage, setBabyImage } = useStory();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <Link href="/dashboard" className="text-[#3bbfbf] text-sm hover:underline">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">Create Birth Story</h1>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <form className="bg-white/90 backdrop-blur-sm rounded-2xl shadow p-6 sm:p-8 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>

          {/* Baby Details */}
          <section>
            <h2 className="text-base font-semibold text-[#3bbfbf] mb-4">Baby Details</h2>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Image upload */}
              <div
                className="w-full lg:w-64 flex-shrink-0 rounded-xl overflow-hidden shadow border-2 border-dashed border-[#3bbfbf] cursor-pointer group relative"
                style={{ minHeight: "260px" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={handleImageChange} />
                {babyImage ? (
                  <Image src={babyImage} alt="Baby" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f0fafa] group-hover:bg-[#e0f5f5] transition-colors p-4">
                    <Image src="/icon.png" alt="Upload" width={48} height={48} className="object-contain" />
                    <p className="text-sm font-semibold text-[#3bbfbf] text-center">Upload Baby Photo</p>
                    <p className="text-xs text-gray-400 text-center">PNG only · Click to browse</p>
                  </div>
                )}
                {babyImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-semibold">Change Photo</p>
                  </div>
                )}
              </div>
              {/* Fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Baby Name" name="babyName" value={form.babyName} onChange={handleChange} placeholder="Baby's name" />
                <Field label="Birth Date" name="birthDate" value={form.birthDate} onChange={handleChange} type="date" />
                <Field label="Birth Time" name="birthTime" value={form.birthTime} onChange={handleChange} type="time" />
                <Field label="First Cry Time" name="firstCryTime" value={form.firstCryTime} onChange={handleChange} type="time" />
                <Field label="Birth Weight (kg)" name="birthWeight" value={form.birthWeight} onChange={handleChange} placeholder="2.8" />
                <Field label="Height (cm)" name="height" value={form.height} onChange={handleChange} placeholder="49" />
                <Field label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="13.0216° N" />
                <Field label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="77.6423° E" />
              </div>
            </div>
          </section>

          {/* Family */}
          <section>
            <h2 className="text-base font-semibold text-[#3bbfbf] mb-4">Family</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Mother's Name" name="motherName" value={form.motherName} onChange={handleChange} />
              <Field label="Father's Name" name="fatherName" value={form.fatherName} onChange={handleChange} />
            </div>
          </section>

          {/* Hospital */}
          <section>
            <h2 className="text-base font-semibold text-[#3bbfbf] mb-4">Hospital Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Hospital / Branch" name="hospital" value={form.hospital} onChange={handleChange} placeholder="Kalyan Nagar" />
              <Field label="Doctors" name="doctors" value={form.doctors} onChange={handleChange} placeholder="Dr. Name, Dr. Name" />
              <Field label="Nurse / Sister" name="nurse" value={form.nurse} onChange={handleChange} placeholder="Sister Susan" />
              <Field label="Room Type" name="roomType" value={form.roomType} onChange={handleChange} placeholder="Deluxe Suite" />
              <Field label="Check-in Date" name="checkInDate" value={form.checkInDate} onChange={handleChange} type="date" />
              <Field label="Check-in Time" name="checkInTime" value={form.checkInTime} onChange={handleChange} type="time" />
            </div>
          </section>

          {/* First Moments */}
          <section>
            <h2 className="text-base font-semibold text-[#3bbfbf] mb-4">First Moments</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Baby's First Outfit" name="firstOutfit" value={form.firstOutfit} onChange={handleChange} placeholder="White and pink" />
              <Field label="Mother's Outfit" name="motherOutfit" value={form.motherOutfit} onChange={handleChange} placeholder="Cream gown with brown lines" />
            </div>
          </section>

          {/* Birth Story */}
          <section>
            <h2 className="text-base font-semibold text-[#3bbfbf] mb-4">Birth Story</h2>
            <textarea
              name="story"
              value={form.story}
              onChange={handleChange}
              rows={5}
              placeholder="Write the birth story here..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3bbfbf] resize-none"
            />
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/verification" className="flex-1 text-center bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white font-semibold rounded-lg py-2.5 transition-colors">
              Preview Story
            </Link>
            <button type="submit" className="flex-1 border border-[#3bbfbf] text-[#3bbfbf] hover:bg-[#e8f7f7] font-semibold rounded-lg py-2.5 transition-colors">
              Save Draft
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
