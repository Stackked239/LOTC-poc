'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PackagePlus,
  ClipboardList,
  Package,
  FileSpreadsheet,
  Settings,
  Menu,
  FileInput,
  Map
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LOTC_LOGO_BASE64 } from '@/lib/constants/logo'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Intake', href: '/intake', icon: PackagePlus },
  { name: 'Request', href: '/request', icon: FileInput },
  { name: 'Fulfillment', href: '/pick', icon: ClipboardList },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Logistics Map', href: '/logistics', icon: Map },
  { name: 'Accounting', href: '/accounting', icon: FileSpreadsheet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200',
              isActive
                ? 'bg-lotc-red text-white shadow-lotc'
                : 'text-lotc-black/80 hover:bg-white/70 hover:text-lotc-red'
            )}
          >
            <item.icon
              className={cn(
                'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-lotc-grey group-hover:text-lotc-red'
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-lotc-blue-light">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 px-4 border-b border-white/40 bg-white/50">
        <Image
          src={LOTC_LOGO_BASE64}
          alt="LOTC Logo"
          width={48}
          height={48}
          className="flex-shrink-0"
        />
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight tracking-tight text-lotc-black">LOTC</span>
          <span className="text-xs text-lotc-grey leading-tight">Inventory System</span>
        </div>
      </div>

      {/* Navigation */}
      <NavLinks onNavigate={onNavigate} />

      {/* Footer */}
      <div className="border-t border-white/40 p-4 bg-white/30">
        <p className="text-xs text-lotc-black/70 text-center font-medium">
          Least of These Carolinas
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col shadow-lotc-lg">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto">
        <SidebarContent />
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
