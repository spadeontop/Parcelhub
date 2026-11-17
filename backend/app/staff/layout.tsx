import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ParcelHub - Staff Portal",
  description: "ParcelHub Staff Web Terminal for Hub Operations, Package Processing & Claim Handover",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center [color-scheme:light]">
      {children}
    </div>
  );
}
