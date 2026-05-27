"use client";
import Link from "next/link";
import Image from "next/image";

// Sample data — replace with real data from context/store
const data = {
  firstFeed: "7:45 PM",
  birthWeight: "2.8 kg",
  height: "49 cm",
  latitude: "13.0216° N",
  longitude: "77.6423° E",
  firstOutfit: "white and pink",
  motherOutfit: "cream gown with brown lines",
};

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center gap-4">
        <Link href="/create-story" className="text-[#3bbfbf] text-sm hover:underline">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">Verify Details</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">

          {/* Image — full width on mobile, half on desktop */}
          <div className="w-full lg:w-1/2 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/Frame 1.png"
              alt="Birth story preview"
              width={600}
              height={800}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Details card */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <div className="mb-6">
                <Image src="/logo.png" alt="Ovum Hospital" width={130} height={48} className="object-contain" />
              </div>

              <h2 className="text-base font-semibold text-gray-700 uppercase tracking-widest mb-5">
                Your First Moments
              </h2>

              <dl className="flex flex-col gap-4 text-sm">
                {[
                  ["First Feed", data.firstFeed],
                  ["Birth Weight", data.birthWeight],
                  ["Height", data.height],
                  ["Latitude", data.latitude],
                  ["Longitude", data.longitude],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <dt className="font-semibold text-gray-600">{label}</dt>
                    <dd className="text-[#3bbfbf] font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-sm text-gray-500 leading-relaxed">
                Your first outfit was <span className="text-gray-700 font-medium">{data.firstOutfit}</span>, while your mother wore a{" "}
                <span className="text-gray-700 font-medium">{data.motherOutfit}</span> during delivery.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/pdf-preview"
                className="flex-1 text-center bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                Looks Good → Preview PDF
              </Link>
              <Link
                href="/create-story"
                className="flex-1 text-center border border-[#3bbfbf] text-[#3bbfbf] hover:bg-[#e8f7f7] font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                Edit Details
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
