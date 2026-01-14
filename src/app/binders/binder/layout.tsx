"use client";

export default function BinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-[calc(100vw-0px)] max-w-none -mx-[calc((100vw-100%)/2)] px-4">
      {children}
    </div>
  );
}
