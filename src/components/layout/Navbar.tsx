'use client'

import Image from 'next/image'
import { MobileSidebar } from './Sidebar'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
      <MobileSidebar />
      <div className="flex items-center gap-2">
        <Image
          src="/lotc-logo.svg"
          alt="LOTC Logo"
          width={36}
          height={36}
          className="flex-shrink-0"
        />
        <span className="font-bold">LOTC Inventory</span>
      </div>
    </header>
  )
}
