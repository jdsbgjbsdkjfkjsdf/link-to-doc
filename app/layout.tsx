import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reading Inbox",
  description: "Save links, track read/unread, and manage your reading list.",
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
