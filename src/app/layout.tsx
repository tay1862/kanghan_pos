import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanghan POS",
  description: "ລະບົບ POS ສຳລັບຮ້ານກັງຫັນວັນເລ່",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo">
      <body className="antialiased bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}
