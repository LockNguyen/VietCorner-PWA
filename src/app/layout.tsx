import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "VietCorner",
  // iOS reads these instead of manifest.ts when the app is added to the Home Screen.
  appleWebApp: { capable: true, title: "VietCorner", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#2196f3",
  viewportFit: "cover", // lets content use the full screen on notched phones
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <main className="pb-20">{children}</main>
        <TabBar />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
