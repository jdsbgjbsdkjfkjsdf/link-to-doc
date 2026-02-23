import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "link-to-doc",
  description: "Paste a link and it appends to your Google Doc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
