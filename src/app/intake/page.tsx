'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IntakeForm } from '@/components/forms/IntakeForm'
import { ArrowLeft } from 'lucide-react'

function IntakeFormWrapper() {
  return <IntakeForm />
}

export default function IntakePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button asChild variant="ghost" size="icon">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-headline text-lotc-red tracking-wide">Inventory Intake</h1>
          <p className="text-lotc-grey font-medium mt-1">
            Log incoming items - donations or purchases
          </p>
        </div>
      </div>

      {/* Form */}
      <Suspense
        fallback={
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        }
      >
        <IntakeFormWrapper />
      </Suspense>
    </div>
  )
}
