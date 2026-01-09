"use client";

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div>{children}</div>
    </div>
  );
}
