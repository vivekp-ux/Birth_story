"use client";
import Link from "next/link";
import Image from "next/image";
import { useStory, StoryForm } from "@/context/StoryContext";

export default function PdfPreviewPage() {
  const { form, babyImage } = useStory();
  const accentHex = form.gender === "female" ? "#f472b6" : "#3bbfbf";
  const btnClass = form.gender === "female"
    ? "bg-pink-400 hover:bg-pink-500 text-white"
    : "bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white";

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between gap-4 print:hidden">
        <Link href="/verification" className="text-[#3bbfbf] text-sm hover:underline">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">PDF Preview</h1>
        <button onClick={() => window.print()} className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${btnClass}`}>
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
          <PagePhoto babyImage={babyImage} />
          <PageStory form={form} accentHex={accentHex} />
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
          background: "linear-gradient(135deg, rgba(210,235,238,0.95) 0%, rgba(190,222,228,0.92) 100%)",
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

/* ─── Photo page ─── */
function PagePhoto({ babyImage }: { babyImage: string | null }) {
  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ width: "210mm", height: "297mm", maxWidth: "100%" }}
    >
      <Image src={babyImage || "/Frame 1.png"} alt="Baby" fill className="object-contain" />
    </div>
  );
}

/* ─── Story text page ─── */
function PageStory({ form, accentHex }: { form: StoryForm; accentHex: string }) {
  return (
    <div
      className="flex flex-col gap-4 text-sm leading-relaxed text-gray-800 p-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #e8f7f7 0%, #f0fafa 60%, #d6eeee 100%)",
        width: "210mm",
        height: "297mm",
        maxWidth: "100%",
      }}
    >
      <StorySection title="The First Cry">
        <p>
          Your mother,{" "}
          <span className="font-semibold" style={{ color: accentHex }}>{form.motherName || "your mother"}</span>,
          had tears of joy in her eyes when she heard your very first cry
          {form.birthDate && (
            <> on <span className="font-semibold" style={{ color: accentHex }}>{form.birthDate}{form.birthTime && " at " + form.birthTime}</span></>
          )}.
          That beautiful moment marked the beginning of your journey.
        </p>
      </StorySection>

      <StorySection title="Welcomed With Love">
        <p>
          You were delivered at Ovum Hospitals
          {form.hospital && <>, <span className="font-semibold" style={{ color: accentHex }}>{form.hospital}</span></>},
          surrounded by love and care.
        </p>
        {form.doctors.length > 0 && (
          <p className="mt-1">
            Your mother&apos;s trusted doctors,{" "}
            <span className="font-semibold" style={{ color: accentHex }}>{form.doctors.join(", ")}</span>, stood beside her
            {form.fatherName && <> along with your father, <span className="font-semibold" style={{ color: accentHex }}>{form.fatherName}</span></>}.
          </p>
        )}
        {form.nurse.length > 0 && (
          <p className="mt-1">
            <span className="font-semibold" style={{ color: accentHex }}>{form.nurse.join(", ")}</span> and the nursing team cared for you with warmth and devotion.
          </p>
        )}
      </StorySection>

      <StorySection title="A Father's First Hold">
        <p>Wrapped gently in soft cloth, you were placed into your father&apos;s arms for the very first time.</p>
      </StorySection>

      {form.roomType && (
        <StorySection title="A Room Filled With Happiness">
          <p>
            To celebrate your arrival, you were welcomed into the{" "}
            <span className="font-semibold" style={{ color: accentHex }}>{form.roomType}</span> chosen lovingly by your mother.
          </p>
          {form.checkInDate && (
            <p className="mt-1">
              <span className="font-semibold" style={{ color: accentHex }}>
                On {form.checkInDate}{form.checkInTime && " at " + form.checkInTime}
              </span>, your family settled in for a beautiful stay.
            </p>
          )}
        </StorySection>
      )}

      <StorySection title="With Love, From Ovum">
        <p>Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals.</p>
        <p className="mt-1">May your life always shine as brightly as the happiness you brought on your very first day.</p>
      </StorySection>
    </div>
  );
}

function StorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      {children}
    </div>
  );
}
