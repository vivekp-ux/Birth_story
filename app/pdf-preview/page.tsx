"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useStory, StoryForm } from "@/context/StoryContext";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import { uploadPdf, getCurrentUserProfile } from "@/services/stories";

// Formats "2026-05-09" → "9th May 2026"
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const suffix = ["th","st","nd","rd"][((day % 100) - 20) % 10] ?? ["th","st","nd","rd"][day % 100] ?? "th";
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function PdfPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { form, babyImage, loadStoryFromDb, loading, clearDraft } = useStory();
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push("/login");
        return;
      }
      if (idParam && (!form.id || form.id !== idParam)) {
        loadStoryFromDb(idParam);
      }
    };
    checkAuth();
  }, [idParam]);

  // Set up react-to-print for browser printing
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${form.babyName || "Baby"}_Birth_Keepsake`,
  });

  const accentHex = form.gender === "female" ? "#e01a8b" : "#0da1b8";
  const btnClass = form.gender === "female"
    ? "bg-pink-500 hover:bg-pink-600 text-white"
    : "bg-[#0da1b8] hover:bg-[#0b8ea3] text-white";

  // Programmatic Vector PDF generator for sharp downloads and Supabase Storage upload
  const handleDownloadPdf = async () => {
    if (!form.id) {
      alert("Story must be saved before downloading PDF.");
      return;
    }

    setDownloading(true);
    setStatusMessage("Generating crisp vector PDF...");

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const isFemale = form.gender === "female";
      const primaryColor = isFemale ? [224, 26, 139] : [13, 161, 184];

      // Helper to load image as base64
      const loadImage = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } else {
              reject(new Error("Could not get canvas context"));
            }
          };
          img.onerror = () => reject(new Error("Failed to load image: " + src));
          img.src = src;
        });
      };

      // ─── PAGE 1 ───
      // Left Column Background Artwork
      const leftBgSrc = isFemale ? "/pink bk.png" : "/birth Dev bk-1.png";
      try {
        const leftBgData = await loadImage(leftBgSrc);
        doc.addImage(leftBgData, "PNG", 0, 0, 148.5, 210);
      } catch (e) {
        // Fallback color
        doc.setFillColor(isFemale ? 253 : 215, isFemale ? 242 : 238, isFemale ? 248 : 240);
        doc.rect(0, 0, 148.5, 210, "F");
      }

      // Draw Left Column Card
      const cardX = 34;
      const cardY = 15;
      const cardW = 80;
      const cardH = 135;

      if (isFemale) doc.setFillColor(252, 222, 236);
      else doc.setFillColor(196, 228, 235);
      doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "F");

      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.8);
      doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "S");

      // Card Header
      doc.setTextColor(17, 17, 17);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Your First Moments", cardX + 10, cardY + 12);

      const drawMomentsField = (label: string, val: string, yPos: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        doc.text(label, cardX + 10, yPos);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(val, cardX + 10, yPos + 5);
      };

      drawMomentsField("First Feed:", form.firstCryTime || "—", cardY + 22);
      drawMomentsField("Birth Weight:", form.birthWeight ? `${form.birthWeight} kg` : "—", cardY + 36);
      drawMomentsField("Height:", form.height ? `${form.height} cm` : "—", cardY + 50);
      drawMomentsField("Latitude:", form.latitude ? `${form.latitude}° N` : "—", cardY + 64);
      drawMomentsField("Longitude:", form.longitude ? `${form.longitude}° E` : "—", cardY + 78);

      // Outfit narrative
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const narrativeText = `Your first outfit was ${form.firstOutfit || "white and pink"}, while your mother wore a ${form.motherOutfit || "cream gown with brown lines"} during delivery.`;
      const splitNarrative = doc.splitTextToSize(narrativeText, cardW - 20);
      doc.text(splitNarrative, cardX + 10, cardY + 95);

      // Logo Below Card
      try {
        const logoData = await loadImage("/logo.png");
        doc.addImage(logoData, "PNG", 148.5 / 2 - 25, 160, 50, 16);
      } catch (e) {}

      // Bottom colored strip
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 190, 148.5, 10, "F");

      // Right Column Background Cover
      const rightBgSrc = isFemale ? "/pink Right side.png" : "/right reference (1).png";
      try {
        const rightBgData = await loadImage(rightBgSrc);
        doc.addImage(rightBgData, "PNG", 148.5, 0, 148.5, 210);
      } catch (e) {
        doc.setFillColor(isFemale ? 250 : 230, isFemale ? 230 : 246, isFemale ? 240 : 248);
        doc.rect(148.5, 0, 148.5, 210, "F");
        doc.setTextColor(17, 17, 17);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Our Birth Story", 148.5 + 40, 100);
      }

      // ─── PAGE 2 ───
      doc.addPage();

      // Left Column: Baby Photo
      if (babyImage) {
        try {
          const babyImgData = await loadImage(babyImage);
          doc.addImage(babyImgData, "JPEG", 0, 0, 148.5, 210);
        } catch (e) {
          doc.setFillColor(isFemale ? 252 : 217, isFemale ? 231 : 242, isFemale ? 243 : 244);
          doc.rect(0, 0, 148.5, 210, "F");
          doc.setTextColor(100, 100, 100);
          doc.setFont("helvetica", "bold");
          doc.text("Keepsake Photo", 50, 105);
        }
      } else {
        doc.setFillColor(isFemale ? 252 : 217, isFemale ? 231 : 242, isFemale ? 243 : 244);
        doc.rect(0, 0, 148.5, 210, "F");
      }

      // Middle Divider
      doc.setDrawColor(isFemale ? 232 : 155, isFemale ? 168 : 207, isFemale ? 198 : 213);
      doc.setLineWidth(0.4);
      doc.line(148.5, 0, 148.5, 210);

      // Right Column Background
      if (isFemale) doc.setFillColor(248, 217, 234);
      else doc.setFillColor(199, 228, 231);
      doc.rect(148.5, 0, 148.5, 210, "F");

      // Story contents
      const textX = 148.5 + 16;
      const textW = 148.5 - 32;
      let textY = 20;

      const drawStoryBlock = (title: string, content: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(17, 17, 17);
        doc.text(title, textX, textY);
        textY += 4.5;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);
        const splitText = doc.splitTextToSize(content, textW);
        doc.text(splitText, textX, textY);
        textY += (splitText.length * 3.8) + 4.5;
      };

      // 1. Cry
      const dateFormatted = form.birthDate ? formatDate(form.birthDate) : "";
      const timeStr = form.birthTime ? ` at ${form.birthTime}` : "";
      const p1 = `Your mother, ${form.motherName || "your mother"}, had tears of joy in her eyes when she heard your very first cry on ${dateFormatted}${timeStr}. That beautiful moment marked the beginning of your journey.`;
      drawStoryBlock("The First Cry", p1);

      // 2. Love
      let p2 = `You were delivered at Ovum Hospitals, ${form.hospital || "our branch"}, surrounded by love and care.`;
      if (form.doctors.length > 0) {
        p2 += ` Your mother's trusted doctors, ${form.doctors.join(", ")}, stood beside her along with your father, ${form.fatherName || "your father"}.`;
      }
      if (form.nurse.length > 0) {
        p2 += ` Sister ${form.nurse.join(", ")} and her nursing team cared for you with warmth and devotion.`;
      }
      drawStoryBlock("Welcomed With Love", p2);

      // 3. Father
      let p3 = `Wrapped gently in soft cloth, you were placed into your father's arms for the very first time.`;
      const relatives = [form.maternalGrandmother, form.maternalGrandfather, form.paternalGrandmother, form.paternalGrandfather].filter(Boolean);
      if (relatives.length > 0) {
        p3 += ` His joy was immeasurable as he introduced you to your loving family — ${relatives.join(", ")} waiting excitedly to meet you.`;
      }
      drawStoryBlock("A Father's First Hold", p3);

      // 4. Room
      if (form.roomType) {
        const checkinDateFormatted = form.checkInDate ? formatDate(form.checkInDate) : "";
        const checkinTimeStr = form.checkInTime ? ` at ${form.checkInTime}` : "";
        const p4 = `To celebrate your arrival, you were welcomed into the ${form.roomType} chosen lovingly by your mother, decorated with balloons and colorful ribbons. On ${checkinDateFormatted}${checkinTimeStr}, your family settled in for a beautiful stay filled with memories.`;
        drawStoryBlock("A Room Filled With Happiness", p4);
      }

      // 5. Keepsake close
      const p5 = `Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals. This keepsake is a celebration of the love, joy, and hope you brought into the world. May your life always shine as brightly as the happiness you brought.`;
      drawStoryBlock("With Love, From Ovum", p5);

      // Save PDF output as Blob
      const pdfBlob = doc.output("blob");

      setStatusMessage("Uploading PDF version to Supabase...");
      // Upload PDF to Supabase Storage and register the version
      const publicUrl = await uploadPdf(form.id, pdfBlob);

      setStatusMessage("Downloading file...");
      // Trigger download on client
      doc.save(`${form.babyName || "Baby"}_Birth_Keepsake.pdf`);

      setStatusMessage("");
      clearDraft();
      
      // Notify success and redirect back to Dashboard
      alert("PDF Kept and backed up successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("PDF download/upload error:", err);
      alert("Error generating PDF: " + (err?.message || "Internal error"));
      setStatusMessage("");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading booklet preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen print-root">
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between gap-4 print:hidden">
        <Link href={form.id ? `/verification?id=${form.id}` : "/verification"} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#3bbfbf] text-[#3bbfbf] text-sm font-medium hover:bg-[#e8f7f7] transition-colors">← Back</Link>
        
        {statusMessage && (
          <span className="text-xs text-[#0da1b8] font-semibold animate-pulse">{statusMessage}</span>
        )}

        <div className="flex gap-2">
          <button onClick={handlePrint} className={`text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors`}>
            Print Booklet
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${btnClass} disabled:opacity-60`}
          >
            {downloading ? "Saving PDF..." : "Download & Save PDF"}
          </button>
        </div>
      </header>

      <div ref={componentRef} className="py-8 px-4 print:p-0 print:py-0 flex flex-col gap-8 print:gap-0 print-container">
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

/* ─── Page 1: Inside cover spread ─── */
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
                {form.latitude ? `${form.latitude}° N` : "—"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[13px] text-[#111]">Longitude:</p>
              <p className="font-bold text-[15px]" style={{ color: accentHex }}>
                {form.longitude ? `${form.longitude}° E` : "—"}
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
          style={{ backgroundColor: accentHex, bottom: "80px" }}
        />
      </div>

      {/* RIGHT COLUMN: Cover Page */}
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
          <Image src={storyImage} alt="Birth Story" fill priority className="object-cover" sizes="50vw" unoptimized />
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
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          background: isFemale ? "#f8d9ea" : "#c7e4e7",
          fontFamily: "var(--font-dm-sans), 'Museo Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            paddingTop: "12px",
            paddingBottom: "28px",
            paddingLeft: "65px",
            paddingRight: "60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            className="space-y-3"
            style={{ fontSize: "14px", lineHeight: "1.28", color: "hsla(0, 0%, 0%, 1.00)" }}
          >

            <div>
              <h3 className="font-bold " style={{ fontSize: "13px", lineHeight: "1.1" }}>The First Cry</h3>
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                Your mother,{" "}
                <span className="font-semibold" style={{ color: accentHex }}>{form.motherName || "your mother"}</span>,
                had tears of joy in her eyes when she heard your very first cry on{" "}
                {form.birthDate && (
                  <span className="font-semibold" style={{ color: accentHex }}>
                    {formatDate(form.birthDate)}{form.birthTime && ` at ${form.birthTime}`}
                  </span>
                )}.
              </p>
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>That beautiful moment marked the beginning of your journey.</p>
            </div>

            <div>
              <h3 className="font-bold " style={{ fontSize: "13px", lineHeight: "1.1" }}>Welcomed With Love</h3>
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                You were delivered at Ovum Hospitals,{" "}
                {form.hospital && <span className="font-semibold" style={{ color: accentHex }}>{form.hospital}</span>},
                surrounded by love and care.
              </p>

              <br />
              {form.doctors.length > 0 && (
                <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                  Your mother&apos;s trusted doctors,{" "}
                  <span className="font-semibold" style={{ color: accentHex }}>{form.doctors.join(", ")}</span>,
                  stood beside her along with your father,{" "}
                  {form.fatherName && <span className="font-semibold" style={{ color: accentHex }}>{form.fatherName}</span>}.
                </p>
              )}

              <br />
              {form.nurse.length > 0 && (
                <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                  Sister{" "}
                  <span className="font-semibold" style={{ color: accentHex }}>{form.nurse.join(", ")}</span>{" "}
                  and her nursing team cared for you with warmth and devotion.
                </p>
              )}
            </div>

            <div>
              <h3 className="font-bold " style={{ fontSize: "13px", lineHeight: "1.1" }}>A Father&apos;s First Hold</h3>
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>Wrapped gently in soft cloth, you were placed into your father&apos;s arms for the very first time.</p><br />
              {(form.maternalGrandmother || form.maternalGrandfather || form.paternalGrandmother || form.paternalGrandfather) && (
                <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                  His joy was immeasurable as he introduced you to your loving family —{" "}
                  <span className="font-semibold" style={{ color: accentHex }}>
                    {[form.maternalGrandmother, form.maternalGrandfather, form.paternalGrandmother, form.paternalGrandfather].filter(Boolean).join(", ")}
                  </span>{" "}
                  waiting excitedly to meet you.
                </p>
              )}
            </div>

            {form.roomType && (
              <div>
                <h3 className="font-bold " style={{ fontSize: "13px", lineHeight: "1.1" }}>A Room Filled With Happiness</h3>
                <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                  To celebrate your arrival, you were welcomed into the{" "}
                  <span className="font-semibold" style={{ color: accentHex }}>{form.roomType}</span>{" "}
                  chosen lovingly by your mother, decorated with balloons and colorful ribbons.
                </p>

                <br />
                {form.checkInDate && (
                  <p style={{ marginTop: "1px", marginBottom: "1px" }}>
                    <span className="font-semibold" style={{ color: accentHex }}>
                      On {formatDate(form.checkInDate)}{form.checkInTime && ` at ${form.checkInTime}`}
                    </span>, your family settled in for a beautiful stay filled with memories.
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="font-bold " style={{ fontSize: "13px", lineHeight: "1.1" }}>With Love, From Ovum</h3>
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals.</p><br />
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>This keepsake is a celebration of the love, joy, and hope you brought into the world.</p><br />
              <p style={{ marginTop: "1px", marginBottom: "1px" }}>May your life always shine as brightly as the happiness you brought.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function PdfPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3bbfbf] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-500">Loading booklet details...</p>
        </div>
      </div>
    }>
      <PdfPreviewPageContent />
    </Suspense>
  );
}
