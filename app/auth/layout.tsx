export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#020617] min-h-screen">{children}</div>;
}
