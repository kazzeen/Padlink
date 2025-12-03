import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen scrollbar-hide">
        {children}
      </main>
    </div>
  );
}
