'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FulfillmentTabs } from '@/components/fulfillment/FulfillmentTabs'
import { PickListChecklist } from '@/components/fulfillment/PickListChecklist'
import { ArrowLeft, Plus } from 'lucide-react'

function FulfillmentContent() {
  const searchParams = useSearchParams()
  const bagId = searchParams.get('bag')

  // If a bag ID is provided, show the simplified pick list checklist
  if (bagId) {
    return <PickListChecklist />
  }

  // Otherwise show the fulfillment tabs
  return <FulfillmentTabs />
}

export default function FulfillmentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fulfillment</h1>
            <p className="text-muted-foreground">
              Manage the pick, pack, and ship workflow
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/request">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        }
      >
        <FulfillmentContent />
      </Suspense>
    </div>
  )
}
