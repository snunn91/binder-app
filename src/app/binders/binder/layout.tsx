"use client";

export default function BinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full max-w-none px-4">{children}</div>;
}
