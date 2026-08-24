export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <div className="h-dvh bg-transparent">{children}</div>
    </>
  );
}
