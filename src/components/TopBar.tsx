export default function TopBar({ title }: { title: string }) {
  return (
    <header style={{
      height: 64,
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 12px', borderRadius: 99,
        fontSize: 12, fontWeight: 600,
        background: '#F1F5F9', color: '#475569',
        border: '1px solid #E2E8F0',
      }}>
        📅 {new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </header>
  )
}
