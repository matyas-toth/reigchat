import { Inter, Geist_Mono, Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";

import localFont from "next/font/local"

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
});

const fontVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-vietnam",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const generalSans = localFont({
  src: "../public/gsans-var.woff2",
  variable: "--font-general-sans",
  weight: "100 200 300 400 500 600 700 800 900"
})

export const metadata = {
  title: "Reig Chat - Beszélgess a mesterséges intelligenciával",
  description:
    "Beszélgess a mesterséges intelligenciával. Azonnali válaszok, intelligens asszisztens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", inter.variable, fontMono.variable, fontSans.variable, fontVietnam.variable, generalSans.variable)}
    >
      <body className="font-sans font-medium">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
