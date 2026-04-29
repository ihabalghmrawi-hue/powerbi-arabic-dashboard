'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

type Props = {
  companyName: string
  userEmail:   string
}

export default function SidebarWrapper({ companyName, userEmail }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  function handleCollapse(v: boolean) {
    setCollapsed(v)
    const main = document.getElementById('main-content')
    if (main) main.className = `main-content${v ? ' collapsed' : ''}`
  }

  return <Sidebar onCollapse={handleCollapse} companyName={companyName} userEmail={userEmail} />
}
