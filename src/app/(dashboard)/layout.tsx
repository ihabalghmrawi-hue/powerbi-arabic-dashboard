export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      {/* Sidebar imported client-side to keep layout a server component */}
      <SidebarWrapper />
      <div id="main-content" className="main-content">
        {children}
      </div>
    </div>
  )
}

// Thin client wrapper so sidebar collapse can update main-content margin
import SidebarWrapper from '@/components/SidebarWrapper'
