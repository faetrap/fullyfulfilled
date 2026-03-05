import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "FullyFulfilled — RPG Habit Tracker",
  description: "Level up your life. One habit at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@300;400;600&family=Press+Start+2P&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased">
          <div className="relative z-1 max-w-[720px] mx-auto px-4 py-8">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
