import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "./providers";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "School Management",
  description: "Manage all school data at one place",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${jakarta.variable}`}
    >
      <body className="bg-[#050810] antialiased font-manrope">
        <LocaleProvider>
          <QueryProvider>
            <TooltipProvider>
              <LayoutShell>{children}</LayoutShell>
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
