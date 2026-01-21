'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Inbox, Phone, UserPlus, Calendar, MapPin } from 'lucide-react'
import { Submission } from '@/types/database'
import { getAllSubmissions } from '@/lib/supabase/submissions'
import { toast } from 'sonner'

interface RequestQueueProps {
  onProcessSubmission: (submission: any) => void
}

export function RequestQueue({ onProcessSubmission }: RequestQueueProps) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      console.log('Loading submissions...')
      const data = await getAllSubmissions()
      console.log('Submissions loaded:', data)
      setSubmissions(data)
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submission queue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Submissions</h3>
          <p className="text-muted-foreground">
            All caught up! New submissions will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {submissions.length} pending {submissions.length === 1 ? 'request' : 'requests'}
        </p>
        <Button variant="outline" size="sm" onClick={loadSubmissions}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission) => {
          // Handle different possible field names
          const firstName = submission.child_first_name || submission.first_name || submission.name || 'Unknown'
          const lastName = submission.child_last_name || submission.last_name || ''
          const birthday = submission.birthday || submission.date_of_birth || submission.dob
          const age = birthday ? calculateAge(birthday) : null
          const gender = submission.child_gender || submission.gender || 'unknown'
          const pickupLocation = submission.pickup_location || submission.location || 'Not specified'
          const phone = submission.caregiver_phone || submission.phone || submission.contact_phone
          const notes = submission.special_notes || submission.notes

          return (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">
                    {firstName} {lastName}
                  </span>
                  {age && (
                    <Badge variant="secondary" className="ml-2">
                      {age} yr{age !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Birthday */}
                {birthday && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {new Date(birthday).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Gender */}
                {gender && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground capitalize">
                      {gender}
                    </span>
                  </div>
                )}

                {/* Pickup Location */}
                {pickupLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground capitalize truncate">
                      {pickupLocation.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}

                {/* Caregiver Contact */}
                {phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {phone}
                    </span>
                  </div>
                )}

                {/* Special Notes Preview */}
                {notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notes}
                    </p>
                  </div>
                )}

                {/* Submitted Date */}
                {submission.created_at && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatRelativeTime(submission.created_at)}
                    </p>
                  </div>
                )}

                {/* Debug info - remove after testing */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Status: {submission.status || 'unknown'}
                  </p>
                </div>

                {/* Process Button */}
                <Button
                  onClick={() => onProcessSubmission(submission)}
                  className="w-full mt-2"
                >
                  Process Request
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to calculate age from birthday
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}
