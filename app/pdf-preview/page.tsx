"use client";
import Link from "next/link";
import Image from "next/image";

interface StoryData {
  motherName: string; fatherName: string; birthDate: string; birthTime: string;
  hospital: string; doctors: string; nurse: string; roomType: string;
  checkInDate: string; checkInTime: string; family: string;
  firstFeed: string; birthWeight: string; height: string;
  latitude: string; longitude: string; firstOutfit: string; motherOutfit: string;
}

// Sample data — wire up from context/store/API
const story: StoryData = {
  motherName: "Minitha Rosey",
  fatherName: "Yesu Dass",
  birthDate: "9th May 2019",
  birthTime: "4:22 PM",
  hospital: "Kalyan Nagar",
  doctors: "Dr. Sandhya Shivakumar and Dr. Narendra",
  nurse: "Sister Susan",
  roomType: "Deluxe Suite",
  checkInDate: "10th May 2019",
  checkInTime: "10:00 AM",
  family: "Grandmother Ninu, Aunt Therasa, and dear friends",
  firstFeed: "7:45 PM",
  birthWeight: "2.8 kg",
  height: "49 cm",
  latitude: "13.0216° N",
  longitude: "77.6423° E",
  firstOutfit: "white and pink",
  motherOutfit: "cream gown with brown lines",
};

export default function PdfPreviewPage() {
  return (
    <div className="min-h-screen">
      {/* Toolbar */}
      <header className="bg-white shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between gap-4 print:hidden">
        <Link href="/verification" className="text-[#3bbfbf] text-sm hover:underline">← Back</Link>
        <h1 className="text-lg font-semibold text-gray-800">PDF Preview</h1>
        <button
          onClick={() => window.print()}
          className="bg-[#3bbfbf] hover:bg-[#2ea8a8] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Print / Save PDF
        </button>
      </header>

      {/* Preview container */}
      <div className="py-8 px-4 print:p-0 print:py-0">
        <div className="preview-spread print:shadow-none">
          {/* ── PAGE 1 LEFT: Inside page ── */}
          <PageInside />
          {/* ── PAGE 1 RIGHT: Cover ── */}
          <PageCover />
        </div>

        {/* Page 2 spread */}
        <div className="preview-spread mt-6 print:mt-0 print:page-break-before-always">
          {/* ── PAGE 2 LEFT: Photo ── */}
          <PagePhoto />
          {/* ── PAGE 2 RIGHT: Story text ── */}
          <PageStory story={story} />
        </div>
      </div>
    </div>
  );
}

/* ─── Inside page (left of spread 1) ─── */
function PageInside() {
  return (
    <div
      className="relative flex flex-col justify-between p-6 sm:p-8 min-h-[480px]"
      style={{ background: "linear-gradient(160deg, #e8f7f7 0%, #f0fafa 60%, #d6eeee 100%)" }}
    >
      {/* Decorative blob */}
      <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-[#c8e8e8] opacity-40 blur-2xl" />

      <div className="relative z-10">
        <div className="inline-block bg-white/70 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Your First Moments</p>

          <dl className="flex flex-col gap-2 text-sm">
            {[
              ["First Feed", "7:45 PM"],
              ["Birth Weight", "2.8 kg"],
              ["Height", "49 cm"],
              ["Latitude", "13.0216° N"],
              ["Longitude", "77.6423° E"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold text-gray-700">{label}:</dt>
                <dd className="text-[#3bbfbf] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-xs text-gray-600 leading-relaxed max-w-[200px]">
            Your first outfit was white and pink, while your mother wore a cream gown with brown lines during delivery.
          </p>
        </div>
      </div>

      {/* Bottom logo */}
      <div className="relative z-10 mt-6">
        <Image src="/logo.png" alt="Ovum Hospital" width={100} height={36} className="object-contain" />
      </div>

      {/* Teal bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#3bbfbf]" />
    </div>
  );
}

/* ─── Cover page (right of spread 1) ─── */
function PageCover() {
  return (
    <div
      className="relative flex flex-col justify-between p-6 sm:p-8 min-h-[480px] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e0f5f5 40%, #c8e8e8 100%)" }}
    >
      {/* Top logo */}
      <div className="relative z-10">
        <Image src="/logo.png" alt="Ovum Hospital" width={100} height={36} className="object-contain" />
      </div>

      {/* Title */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <p className="text-4xl sm:text-5xl font-black text-gray-900 leading-none uppercase tracking-tight">YOUR</p>
        <p
          className="text-5xl sm:text-6xl font-black leading-none"
          style={{ color: "#3bbfbf", fontStyle: "italic", fontFamily: "Georgia, serif" }}
        >
          Birth
        </p>
        <p className="text-4xl sm:text-5xl font-black text-gray-900 leading-none uppercase tracking-tight">STORY</p>
      </div>

      {/* Baby feet placeholder */}
      <div className="relative z-10 flex justify-end">
        <div className="w-32 h-32 rounded-full bg-[#d6eeee] flex items-center justify-center text-4xl opacity-60">
          👣
        </div>
      </div>
    </div>
  );
}

/* ─── Photo page (left of spread 2) ─── */
function PagePhoto() {
  return (
    <div
      className="relative min-h-[480px] bg-gray-200 flex items-center justify-center overflow-hidden"
    >
      {/* Placeholder — replace with actual uploaded photo */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Family Photo</span>
      </div>
    </div>
  );
}

/* ─── Story text page (right of spread 2) ─── */
function PageStory({ story }: { story: StoryData }) {
  return (
    <div className="bg-[#e8f7f7] p-6 sm:p-8 min-h-[480px] flex flex-col gap-4 text-sm leading-relaxed text-gray-800">

      <StorySection title="The First Cry">
        <p>
          Your mother, <span className="text-[#3bbfbf] font-semibold">{story.motherName}</span>, had tears of joy in her eyes when she heard your very first cry on{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.birthDate} at {story.birthTime}</span>.
          That beautiful moment marked the beginning of your journey.
        </p>
      </StorySection>

      <StorySection title="Welcomed With Love">
        <p>
          You were delivered at Ovum Hospitals,{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.hospital}</span>, surrounded by love and care.
        </p>
        <p className="mt-1">
          Your mother&apos;s trusted doctors,{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.doctors}</span>, stood beside her along with your father,{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.fatherName}</span>.
        </p>
        <p className="mt-1">
          <span className="text-[#3bbfbf] font-semibold">{story.nurse}</span> and her nursing team cared for you with warmth and devotion.
        </p>
      </StorySection>

      <StorySection title="A Father's First Hold">
        <p>Wrapped gently in soft cloth, you were placed into your father&apos;s arms for the very first time.</p>
        <p className="mt-1">
          His joy was immeasurable as he introduced you to your loving family —{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.family}</span> waiting excitedly to meet you.
        </p>
      </StorySection>

      <StorySection title="A Room Filled With Happiness">
        <p>
          To celebrate your arrival, you were welcomed into the{" "}
          <span className="text-[#3bbfbf] font-semibold">{story.roomType}</span> chosen lovingly by your mother, decorated with balloons and colorful ribbons.
        </p>
        <p className="mt-1">
          <span className="text-[#3bbfbf] font-semibold">On {story.checkInDate} at {story.checkInTime}</span>, your family settled in for a beautiful stay filled with unforgettable memories.
        </p>
      </StorySection>

      <StorySection title="With Love, From Ovum">
        <p>Your birth brought immense happiness not only to your family, but to all of us at Ovum Hospitals.</p>
        <p className="mt-1">This keepsake is a celebration of the love, joy, and hope you brought into the world.</p>
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
