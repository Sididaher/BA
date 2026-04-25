import BottomNav from './BottomNav'

export default function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto pb-24 md:pb-8 md:px-4 lg:px-8">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
