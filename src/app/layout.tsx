import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { ServiceWorkerRegistration } from "@/components/shell/service-worker";
import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TOEIC Xanh", template: "%s · TOEIC Xanh" },
  description: "Tự học TOEIC Nghe + Đọc mỗi ngày 15 phút, từ con số 0.",
  applicationName: "TOEIC Xanh",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "TOEIC Xanh", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2f8f4e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="font-sans">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
