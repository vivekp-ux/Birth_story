"use client";
import Link from "next/link";
import Image from "next/image";
import { useStory, StoryForm } from "@/context/StoryContext";

export default function PdfPreviewPage() {
  const { form, babyImage, clearDraft } = useStory();
  const accentHex = form.gender === "female" ? "#f472b6" : "#3bbfbf";
  const btnClass = form.gender === "female"
    ? "bg-pink-400 hover:bg-pink-500 text-white"
    : "bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white";

  const handlePrint = () => {
    window.print();
    clearDraft();
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between gap-4 print:hidden">
        <Link href="/verification" className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">PDF Preview</h1>
        <button onClick={handlePrint} className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${btnClass}`}>
          Print / Save PDF
        </button>
      </header>

      <div className="py-8 px-4 print:p-0 print:py-0">
        {/* Spread 1 — full-width single card matching the design */}
        <div className="w-full max-w-[900px] mx-auto rounded-2xl overflow-hidden shadow-lg print:shadow-none">
          <PageInside form={form} accentHex={accentHex} />
        </div>

        {/* Spread 2 */}
        <div className="flex flex-col sm:flex-row mt-6 print:mt-0 w-full max-w-[900px] mx-auto rounded-2xl overflow-hidden shadow-lg print:shadow-none print:page-break-before-always">
          <PageStory form={form} accentHex={accentHex} storyImage={babyImage} />
        </div>
      </div>
    </div>
  );
}

/* ─── Inside card — matching reference design ─── */
function PageInside({ form, accentHex }: { form: StoryForm; accentHex: string }) {
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center"
      style={{
        width: "210mm",
        height: "297mm",
        background: "linear-gradient(180deg, #f7fbfa 0%, #eef8f8 50%, #edf6f5 100%)",
      }}
    >
      {/* Water texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at top left, #cde8e5 0, transparent 30%), radial-gradient(circle at bottom right, #bde4e1 0, transparent 35%)" }}
      />

      {/* Top Title */}
      <div className="relative z-10 mt-10 text-center">
        <p className="text-[32px] font-light tracking-wide text-[#1f1f1f] leading-none">YOUR</p>
        <p className="text-[90px] leading-[0.8]" style={{ color: accentHex, fontFamily: "'Brush Script MT', cursive" }}>
          Birth
        </p>
        <div className="flex items-center gap-2">
          <p className="text-[34px] tracking-[0.2em] font-light text-[#1f1f1f] -mt-1">STORY</p>
          <span className="opacity-25 text-3xl select-none">👣</span>
        </div>
      </div>

      {/* Main Info Card */}
      <div
        className="relative z-10 mt-10 w-[72%] rounded-[20px] border border-white/70 px-8 py-7"
        style={{
          background: accentHex === "#f472b6"
            ? "linear-gradient(135deg, rgba(251,207,232,0.95) 0%, rgba(244,171,200,0.92) 100%)"
            : "linear-gradient(135deg, rgba(210,235,238,0.95) 0%, rgba(190,222,228,0.92) 100%)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        }}
      >
        <p className="text-[20px] font-semibold text-[#111] mb-6">
          Your{" "}
          <span style={{ color: accentHex, fontStyle: "italic", fontWeight: 400, fontFamily: "Georgia, serif" }}>First</span>
          {" "}Moments
        </p>

        <div className="space-y-5">
          <div>
            <p className="text-[18px] font-semibold text-[#111]">First Feed:</p>
            <p className="text-[18px] font-bold" style={{ color: accentHex }}>{form.firstCryTime || "—"}</p>
          </div>
          <div>
            <p className="text-[18px] font-semibold text-[#111]">Birth Weight:</p>
            <p className="text-[18px] font-bold" style={{ color: accentHex }}>{form.birthWeight ? `${form.birthWeight} kg` : "—"}</p>
          </div>
          <div>
            <p className="text-[18px] font-semibold text-[#111]">Height:</p>
            <p className="text-[18px] font-bold" style={{ color: accentHex }}>{form.height ? `${form.height} cm` : "—"}</p>
          </div>
          <div>
            <p className="text-[18px] font-semibold text-[#111]">Latitude:</p>
            <p className="text-[18px] font-bold leading-snug" style={{ color: accentHex }}>
              {form.latitude || "—"}
              {form.longitude && <><br />{form.longitude}</>}
            </p>
          </div>
          <div className="pt-4">
  <p className="text-[17px] leading-relaxed text-[#111]">
    Your first outfit was white and pink, while your mother wore a
    cream gown with brown lines during delivery.
  </p>
</div>
          {(form.firstOutfit || form.motherOutfit) && (
            <div className="pt-4">
              <p className="text-[17px] leading-relaxed text-[#111]">
                {form.firstOutfit && `Your first outfit was ${form.firstOutfit}`}
                {form.firstOutfit && form.motherOutfit && ", while your mother wore "}
                {form.motherOutfit && `${form.motherOutfit} during delivery.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Logo */}
      <div className="relative z-10 mt-auto mb-16 flex flex-col items-center">
        <div className="relative w-[180px] h-[55px]">
          <Image src="/logo.png" alt="Ovum" fill className="object-contain" />
        </div>
        <p className="text-[16px] mt-1" style={{ color: accentHex }}>Woman &amp; Child Speciality Hospital</p>
        <p className="text-[10px] text-gray-500">(A Unit of Neonatal Care &amp; Research Institute Pvt Ltd)</p>
      </div>

      {/* Bottom Accent Strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[22px]"
        style={{ background: `linear-gradient(90deg, ${accentHex}, #22c7df)` }}
      />
    </div>
  );
}

/* ─── Story text page — Full A4 portrait layout ─── */
function PageStory({ form, accentHex, storyImage }: { form: StoryForm; accentHex: string; storyImage: string | null }) {
  return (
    <div
      className="relative overflow-hidden flex"
      style={{ width: "210mm", height: "297mm", background: accentHex === "#f472b6" ? "#f5c6e0" : "#d7eef0" }}
    >
      {/* Left image section */}
      <div className="relative flex items-center justify-center bg-white/30" style={{ width: "52%", height: "100%" }}>
        {storyImage ? (
          <Image
            src={storyImage}
            alt="Birth Story"
            fill
            priority
            className="object-contain"
            sizes="100vw"
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Image src="/icon.png" alt="No image" width={72} height={72} className="object-contain opacity-30" />
            <p className="text-sm text-gray-400">No photo uploaded</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1px] bg-[#5e6b6b]" />

      {/* Right story section */}
      <div className="flex-1 px-10 py-8 overflow-hidden" style={{ background: accentHex === "#f472b6" ? "#f9d0e8" : "#c7e4e7" }}>
        <div className="space-y-8 text-[14px] leading-[1.4] text-[#111]">

          <div>
            <h3 className="font-bold mb-1">The First Cry</h3>
            <p>
              Your mother,{" "}
              <span className="font-semibold" style={{ color: accentHex }}>{form.motherName || "your mother"}</span>,
              had tears of joy in her eyes when she heard your very first cry on{" "}
              {form.birthDate && (
                <span className="font-semibold" style={{ color: accentHex }}>
                  {form.birthDate}{form.birthTime && ` at ${form.birthTime}`}
                </span>
              )}.
            </p>
            <p>That beautiful moment marked the beginning of your journey.</p>
          </div>

          <div>
            <h3 className="font-bold mb-1">Welcomed With Love</h3>
            <p>
              You were delivered at Ovum Hospitals,{" "}
              {form.hospital && <span className="font-semibold" style={{ color: accentHex }}>{form.hospital}</span>},
              surrounded by love and care.
            </p>
            {form.doctors.length > 0 && (
              <p className="mt-2">
                Your mother&apos;s trusted doctors,{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.doctors.join(", ")}</span>,
                stood beside her along with your father,{" "}
                {form.fatherName && <span className="font-semibold" style={{ color: accentHex }}>{form.fatherName}</span>}.
              </p>
            )}
            {form.nurse.length > 0 && (
              <p className="mt-2">
                Sister{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.nurse.join(", ")}</span>{" "}
                and her nursing team cared for you with warmth and devotion.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-1">A Father&apos;s First Hold</h3>
            <p>Wrapped gently in soft cloth, you were placed into your father&apos;s arms for the very first time.</p>
            {(form.grandmother || form.grandfather) && (
              <p className="mt-2">
                His joy was immeasurable as he introduced you to your loving family —{" "}
                <span className="font-semibold" style={{ color: accentHex }}>
                  {[form.grandmother, form.grandfather].filter(Boolean).join(", ")}
                </span>{" "}
                waiting excitedly to meet you.
              </p>
            )}
          </div>

          {form.roomType && (
            <div>
              <h3 className="font-bold mb-1">A Room Filled With Happiness</h3>
              <p>
                To celebrate your arrival, you were welcomed into the{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.roomType}</span>{" "}
                chosen lovingly by your mother, decorated with balloons and colorful ribbons.
              </p>
              {form.checkInDate && (
                <p className="mt-2">
                  <span className="font-semibold" style={{ color: accentHex }}>
                    On {form.checkInDate}{form.checkInTime && ` at ${form.checkInTime}`}
                  </span>, your family settled in for a beautiful stay filled with unforgettable memories.
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="font-bold mb-1">With Love, From Ovum</h3>
            <p>Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals.</p>
            <p className="mt-3">This keepsake is a celebration of the love, joy, and hope you brought into the world.</p>
            <p className="mt-3">May your life always shine as brightly as the happiness you brought on your very first day.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
