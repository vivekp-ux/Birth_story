"use client";
import Link from "next/link";
import Image from "next/image";
import { useStory, StoryForm } from "@/context/StoryContext";

export default function PdfPreviewPage() {
  const { form, babyImage, clearDraft } = useStory();
  const accentHex = form.gender === "female" ? "#e01a8b" : "#0da1b8";
  const btnClass = form.gender === "female"
    ? "bg-pink-500 hover:bg-pink-600 text-white"
    : "bg-[#0da1b8] hover:bg-[#0b8ea3] text-white";

  const handlePrint = () => {
    window.print();
    clearDraft();
  };

  return (
    <div className="min-h-screen print-root">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between gap-4 print:hidden">
        <Link href="/verification" className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">PDF Preview</h1>
        <button onClick={handlePrint} className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${btnClass}`}>
          Print / Save PDF
        </button>
      </header>

      <div className="py-8 px-4 print:p-0 print:py-0 flex flex-col gap-8 print:gap-0 print-container">
        {/* Spread 1 */}
        <div className="pdf-scale-wrapper">
          <div className="pdf-page-landscape rounded-2xl overflow-hidden shadow-lg print:shadow-none print:rounded-none print-page">
            <PageInside form={form} accentHex={accentHex} />
          </div>
        </div>

        {/* Spread 2 */}
        <div className="pdf-scale-wrapper">
          <div className="pdf-page-landscape rounded-2xl overflow-hidden shadow-lg print:shadow-none print:rounded-none print-page">
            <PageStory form={form} accentHex={accentHex} storyImage={babyImage} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page 1: Inside cover spread — matching reference design ─── */
function PageInside({ form, accentHex }: { form: StoryForm; accentHex: string }) {
  const isFemale = form.gender === "female";
  
  return (
    <div
      className="relative overflow-hidden flex select-none"
      style={{
        width: "297mm",
        height: "210mm",
      }}
    >
      {/* LEFT COLUMN */}
      <div
        className="relative w-1/2 h-full flex flex-col items-center select-none"
        style={{
          backgroundImage: isFemale ? "url('/pink bk.png')" : "url('/birth Dev bk-1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Moments Card */}
        <div
  className="mt-0 w-[44%] min-h-[420px] rounded-[16px] border border-white/80 px-6 py-7"
          style={{
            background: isFemale
              ? "rgba(252,222,236,0.88)"
              : "rgba(196,228,235,0.88)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <p className="text-[15px] font-semibold text-[#111] mb-5">
            Your{" "}
            <span
              className="italic font-normal"
              style={{
                color: accentHex,
                fontFamily: "'Brush Script MT', cursive",
                fontSize: "22px",
              }}
            >
              First
            </span>{" "}
            Moments
          </p>

          <div className="space-y-4">
            <div>
              <p className="font-semibold text-[13px] text-[#111]">First Feed:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.firstCryTime || "—"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[13px] text-[#111]">Birth Weight:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.birthWeight ? `${form.birthWeight} kg` : "—"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[13px] text-[#111]">Height:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.height ? `${form.height} cm` : "—"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[13px] text-[#111]">Latitude:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.latitude || "—"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[13px] text-[#111]">Longitude:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.longitude || "—"}
              </p>
            </div>

            <div className="pt-2">
              <p className="text-[13px] leading-[1.3] text-[#111]">
                Your first outfit was {form.firstOutfit || "white and pink"}, while your mother wore a{" "}
                {form.motherOutfit || "cream gown with brown lines"} during delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Logo Below Card */}
        <div className="mt-12 flex flex-col items-center">
          <div className="relative w-[190px] h-[60px]">
            <Image src="/logo.png" alt="Ovum" fill className="object-contain" />
          </div>

          

          
        </div>

        {/* Bottom Strip */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[50px]"
          style={{ backgroundColor: accentHex ,
            bottom: "80px"
          }}
        />
      </div>

      {/* RIGHT COLUMN: Cover Page (Title and Artwork) */}
      <div 
        className="w-1/2 h-full relative"
        style={{
          backgroundImage: isFemale ? "url('/pink Right side.png')" : "url('/right reference (1).png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}

function PageStory({ form, accentHex, storyImage }: { form: StoryForm; accentHex: string; storyImage: string | null }) {
  const isFemale = form.gender === "female";
  const headingColor = isFemale ? "#c0266b" : "#1f2937";

  return (
    <div
      className="relative overflow-hidden flex"
      style={{
        width: "297mm",
        height: "210mm",
        background: isFemale ? "#fdf2f8" : "#d7eef0"
      }}
    >
      {/* Left image section */}
      <div className="relative" style={{ width: "50%", height: "100%" }}>
        {storyImage ? (
          <Image src={storyImage} alt="Birth Story" fill priority className="object-cover" sizes="50vw" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: isFemale ? "#fce7f3" : "#d9f2f4" }}>
            <Image src="/icon.png" alt="No image" width={72} height={72} className="object-contain opacity-30" />
            <p className="text-sm text-gray-400 mt-2">No photo uploaded</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1.5px] z-10" style={{ background: isFemale ? "#e8a8c6" : "#9bcfd5" }} />

      {/* Right story section */}
      <div className="flex-1 px-8 py-6 overflow-hidden flex flex-col justify-center" style={{ background: isFemale ? "#f8d9ea" : "#c7e4e7" }}>
        <div className="space-y-4 text-[12.5px] leading-[1.35] text-[#111]">

          <div>
            <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: headingColor }}>The First Cry</h3>
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
            <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: headingColor }}>Welcomed With Love</h3>
            <p>
              You were delivered at Ovum Hospitals,{" "}
              {form.hospital && <span className="font-semibold" style={{ color: accentHex }}>{form.hospital}</span>},
              surrounded by love and care.
            </p>
            {form.doctors.length > 0 && (
              <p className="mt-1">
                Your mother&apos;s trusted doctors,{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.doctors.join(", ")}</span>,
                stood beside her along with your father,{" "}
                {form.fatherName && <span className="font-semibold" style={{ color: accentHex }}>{form.fatherName}</span>}.
              </p>
            )}
            {form.nurse.length > 0 && (
              <p className="mt-1">
                Sister{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.nurse.join(", ")}</span>{" "}
                and her nursing team cared for you with warmth and devotion.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: headingColor }}>A Father&apos;s First Hold</h3>
            <p>Wrapped gently in soft cloth, you were placed into your father&apos;s arms for the very first time.</p>
            {(form.grandmother || form.grandfather) && (
              <p className="mt-1">
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
              <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: headingColor }}>A Room Filled With Happiness</h3>
              <p>
                To celebrate your arrival, you were welcomed into the{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.roomType}</span>{" "}
                chosen lovingly by your mother, decorated with balloons and colorful ribbons.
              </p>
              {form.checkInDate && (
                <p className="mt-1">
                  <span className="font-semibold" style={{ color: accentHex }}>
                    On {form.checkInDate}{form.checkInTime && ` at ${form.checkInTime}`}
                  </span>, your family settled in for a beautiful stay filled with unforgettable memories.
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: headingColor }}>With Love, From Ovum</h3>
            <p>Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals.</p>
            <p className="mt-1">This keepsake is a celebration of the love, joy, and hope you brought into the world.</p>
            <p className="mt-1 font-semibold italic text-[12px] opacity-80">May your life always shine as brightly as the happiness you brought on your very first day.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
