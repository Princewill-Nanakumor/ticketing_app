import Navbar from "@/components/navbar";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
