'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { AgeGroup, Gender } from '@/types/database'
import { CreateBagOfHopeData } from '@/types/forms'
import { createBagOfHope } from '@/lib/supabase/bags-of-hope'
import { AGE_GROUP_LABELS, GENDER_LABELS } from '@/lib/supabase/categories'

export function CreateBagForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [requestId, setRequestId] = useState('')
  const [notes, setNotes] = useState('')
  const [autoSubmit, setAutoSubmit] = useState(false)

  // Pre-fill from URL parameters
  useEffect(() => {
    const urlAgeGroup = searchParams.get('age_group') as AgeGroup | null
    const urlGender = searchParams.get('gender') as Gender | null
    const urlRequestId = searchParams.get('request_id')
    const urlNotes = searchParams.get('notes')
    const urlAuto = searchParams.get('auto') === 'true'

    if (urlAgeGroup && ['baby', 'toddler', 'school_age', 'teen'].includes(urlAgeGroup)) {
      setAgeGroup(urlAgeGroup)
    }
    if (urlGender && ['boy', 'girl'].includes(urlGender)) {
      setGender(urlGender)
    }
    if (urlRequestId) {
      setRequestId(urlRequestId)
    }
    if (urlNotes) {
      setNotes(urlNotes)
    }
    if (urlAuto) {
      setAutoSubmit(true)
    }
  }, [searchParams])

  // Auto-submit if all required fields are filled and auto=true
  useEffect(() => {
    if (autoSubmit && ageGroup && gender && !loading) {
      setAutoSubmit(false) // Prevent re-submission
      handleAutoSubmit()
    }
  }, [autoSubmit, ageGroup, gender])

  const submitBag = async () => {
    if (!ageGroup || !gender) {
      toast.error('Please select age group and gender')
      return
    }

    setLoading(true)

    try {
      const data: CreateBagOfHopeData = {
        child_age_group: ageGroup,
        child_gender: gender,
        request_id: requestId || undefined,
        notes: notes || undefined,
      }

      const bag = await createBagOfHope(data)

      toast.success('Bag of Hope created')
      router.push(`/pick?bag=${bag.id}`)
    } catch (error) {
      console.error('Error creating bag:', error)
      toast.error('Failed to create Bag of Hope')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitBag()
  }

  const handleAutoSubmit = async () => {
    await submitBag()
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          New Bag of Hope
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="age-group">Child&apos;s Age Group *</Label>
            <Select
              value={ageGroup}
              onValueChange={(value) => setAgeGroup(value as AgeGroup)}
            >
              <SelectTrigger id="age-group">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Child&apos;s Gender *</Label>
            <Select
              value={gender}
              onValueChange={(value) => setGender(value as Gender)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boy">Boy</SelectItem>
                <SelectItem value="girl">Girl</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-id">Request ID (optional)</Label>
            <Input
              id="request-id"
              placeholder="Neon/Apricot reference"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Reference number from your CRM if available
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any special notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Start Packing'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
