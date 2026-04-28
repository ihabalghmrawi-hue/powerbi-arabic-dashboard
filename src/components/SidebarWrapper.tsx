'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

export default function SidebarWrapper() {
  const [collapsed, setCollapsed] = useState(false)

  function handleCollapse(v: boolean) {
    setCollapsed(v)
    const main = document.getElementById('main-content')
    if (main) main.className = `main-content${v ? ' collapsed' : ''}`
  }

  return <Sidebar onCollapse={handleCollapse} />
}
