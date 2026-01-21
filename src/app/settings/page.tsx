'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FolderOpen, Users, Settings2, ChevronRight } from 'lucide-react'

const settingsSections = [
  {
    title: 'Categories',
    description: 'Manage inventory categories, values, and reorder points',
    href: '/settings/categories',
    icon: FolderOpen,
  },
  {
    title: 'User Management',
    description: 'Manage staff profiles and permissions',
    href: '/settings/users',
    icon: Users,
    disabled: true,
  },
  {
    title: 'System Settings',
    description: 'Configure default values and preferences',
    href: '/settings/system',
    icon: Settings2,
    disabled: true,
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configuration
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Card
            key={section.title}
            className={section.disabled ? 'opacity-50' : 'hover:bg-accent/50 transition-colors'}
          >
            {section.disabled ? (
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <section.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </CardHeader>
            ) : (
              <Link href={section.href}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>About LOTC Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This inventory management system helps Least of These Carolinas track
            donations, purchases, and Bags of Hope distribution.
          </p>
          <p>
            For support or questions, contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
