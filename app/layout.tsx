import type { Metadata } from "next";
import { Geist, Great_Vibes, DM_Sans } from "next/font/google";
import "./globals.css";
import { StoryProvider } from "@/context/StoryContext";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const greatVibes = Great_Vibes({
  weight: "400",
  variable: "--font-great-vibes",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ovum Birth Story",
  description: "Your Birth Story — Ovum Woman & Child Speciality Hospital",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${greatVibes.variable} ${dmSans.variable}`}>
      <body
        className="min-h-screen font-sans antialiased"
        style={{
          backgroundImage: "url('/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <StoryProvider>
          {children}
        </StoryProvider>
      </body>
    </html>
  );
}
