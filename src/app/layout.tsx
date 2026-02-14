import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PokeBinder",
  description: "A virtual Pokemon card binder application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-zinc-800">
        <Providers>
          <Toaster position="top-center" />
          <Header />
          <main className="min-h-[calc(100vh-var(--header-h))] pt-[var(--header-h)]">
            <div className="container h-full mx-auto">{children}</div>
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  );
}
