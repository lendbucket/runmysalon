export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06080d] flex items-center justify-center px-4">
      {children}
    </div>
  )
}
