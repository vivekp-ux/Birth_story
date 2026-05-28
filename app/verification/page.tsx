"use client";
import Link from "next/link";
import Image from "next/image";
import { useStory } from "@/context/StoryContext";

export default function VerificationPage() {
  const { form, babyImage } = useStory();
  const accent = form.gender === "female" ? "text-pink-400" : "text-[#3bbfbf]";
  const accentHex = form.gender === "female" ? "#f472b6" : "#3bbfbf";
  const btnPrimary = form.gender === "female" ? "bg-pink-400 hover:bg-pink-500 text-white" : "bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white";
  const btnSecondary = form.gender === "female" ? "border border-pink-400 text-pink-400 hover:bg-pink-50" : "border border-[#3bbfbf] text-[#3bbfbf] hover:bg-[#e8f7f7]";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center gap-4">
        <Link href="/create-story" className="text-[#3bbfbf] text-sm hover:underline">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">Verify Details</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">

          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg min-h-[300px] relative bg-white">
            <Image
              src={babyImage || "/Frame 1.png"}
              alt="Baby"
              width={600}
              height={800}
              className="w-full h-full object-contain"
              priority
            />
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
                  ["Latitude", form.latitude || "—"],
                  ["Longitude", form.longitude || "—"],
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

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/pdf-preview" className={`flex-1 text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnPrimary}`}>
                Looks Good → Preview PDF
              </Link>
              <Link href="/create-story" className={`flex-1 text-center font-semibold rounded-lg py-2.5 text-sm transition-colors ${btnSecondary}`}>
                Edit Details
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
