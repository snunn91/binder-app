"use client";

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-var(--header-h)-169px)] flex items-center justify-center">
      {children}
    </div>
  );
}
