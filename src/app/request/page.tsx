import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateBagForm } from '@/components/forms/CreateBagForm'
import { ArrowLeft } from 'lucide-react'

function FormLoading() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function RequestPage() {
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
          <h1 className="text-3xl font-bold">New Request</h1>
          <p className="text-muted-foreground">
            Create a new Bag of Hope request
          </p>
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<FormLoading />}>
        <CreateBagForm />
      </Suspense>
    </div>
  )
}
