'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateBagForm } from '@/components/forms/CreateBagForm'
import { ProcessSubmissionForm } from '@/components/forms/ProcessSubmissionForm'
import { RequestQueue } from '@/components/fulfillment/RequestQueue'
import { ArrowLeft, Plus, Inbox } from 'lucide-react'
import { Submission } from '@/types/database'

export default function RequestPage() {
  const [activeTab, setActiveTab] = useState('queue')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  function handleProcessSubmission(submission: Submission) {
    setSelectedSubmission(submission)
  }

  function handleCancelProcessing() {
    setSelectedSubmission(null)
  }

  function handleCompleteProcessing() {
    setSelectedSubmission(null)
    setActiveTab('queue') // Return to queue to see updated list
  }

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
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-muted-foreground">
            Process submissions or create manual requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Submission Queue
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* Submission Queue Tab */}
        <TabsContent value="queue" className="mt-6">
          {selectedSubmission ? (
            <ProcessSubmissionForm
              submission={selectedSubmission}
              onCancel={handleCancelProcessing}
              onComplete={handleCompleteProcessing}
            />
          ) : (
            <RequestQueue onProcessSubmission={handleProcessSubmission} />
          )}
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-6">
          <CreateBagForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
