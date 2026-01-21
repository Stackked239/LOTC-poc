'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Heart, X } from 'lucide-react'
import { toast } from 'sonner'
import { Submission } from '@/types/database'
import { BagColor, Gender, AgeGroup } from '@/types/database'
import { createBagOfHope } from '@/lib/supabase/bags-of-hope'
import { linkSubmissionToBag } from '@/lib/supabase/submissions'
import { BAG_COLOR_LABELS } from '@/lib/constants/labels'
import { BagQRCodeDialog } from './BagQRCodeDialog'

interface ProcessSubmissionFormProps {
  submission: Submission
  onCancel: () => void
  onComplete: () => void
}

export function ProcessSubmissionForm({ submission, onCancel, onComplete }: ProcessSubmissionFormProps) {
  const router = useRouter()

  // Auto-populated from submission - using actual schema fields
  const [childFirstName] = useState(submission.child_first_name)
  const [childLastInitial] = useState(submission.child_last_initial)
  const [birthday] = useState(submission.child_dob)
  const [gender] = useState<Gender>(submission.child_gender as Gender)
  const [ethnicity] = useState(submission.child_ethnicity || '')
  const [pickupLocation] = useState(submission.pickup_location)
  const [caregiverFirstName] = useState(submission.caregiver_first_name)
  const [caregiverLastName] = useState(submission.caregiver_last_name)
  const [caregiverPhone] = useState(submission.caregiver_phone || '')
  const [caregiverEmail] = useState(submission.caregiver_email || '')
  const [caregiverAddress] = useState(
    `${submission.caregiver_street}, ${submission.caregiver_city}, ${submission.caregiver_state} ${submission.caregiver_zip}`
  )
  const [placementType] = useState(submission.child_placement_type)
  const [socialWorker] = useState(
    `${submission.social_worker_first_name} ${submission.social_worker_last_name} (${submission.social_worker_email})`
  )
  const [submissionId] = useState(submission.submission_id)

  // Fields to be filled by employee (gathered from caregiver call)
  const [childFullLastName, setChildFullLastName] = useState('') // Need full last name
  const [bagEmbroideryCompany, setBagEmbroideryCompany] = useState('')
  const [bagOrderNumber, setBagOrderNumber] = useState('')
  const [bagEmbroideryColor, setBagEmbroideryColor] = useState<BagColor>('blue')
  const [toiletryBagColor, setToiletryBagColor] = useState<BagColor>('blue')
  const [toiletryBagLabeled, setToiletryBagLabeled] = useState('')
  const [toyActivity, setToyActivity] = useState('')
  const [tops, setTops] = useState('')
  const [bottoms, setBottoms] = useState('')
  const [pajamas, setPajamas] = useState('')
  const [underwear, setUnderwear] = useState('')
  const [diaperPullup, setDiaperPullup] = useState('')
  const [shoes, setShoes] = useState('')
  const [coat, setCoat] = useState('')
  const [notes, setNotes] = useState('')
  const [recipientName, setRecipientName] = useState(`${caregiverFirstName} ${caregiverLastName}`)
  const [recipientPhone, setRecipientPhone] = useState(caregiverPhone)
  const [deliveryAddress, setDeliveryAddress] = useState(caregiverAddress) // Auto-fill from submission
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [childAge, setChildAge] = useState<number>(0)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('neutral')
  const [submitting, setSubmitting] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [createdBagId, setCreatedBagId] = useState<string>('')

  // Calculate age and age group on mount
  useEffect(() => {
    if (birthday) {
      const age = calculateAge(birthday)
      setChildAge(age)
      const calculatedAgeGroup = getAgeGroupFromAge(age)
      setAgeGroup(calculatedAgeGroup)
    }
  }, [birthday])

  // Note: The actual submissions table doesn't have a "status" field for workflow tracking
  // It uses sync_status for Neon CRM synchronization status
  // So we don't mark submissions as "processing" - they're just displayed in the queue

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!childFullLastName) {
      toast.error("Please enter the child's full last name")
      return
    }

    if (!bagEmbroideryColor) {
      toast.error('Please select a favorite color')
      return
    }

    setSubmitting(true)

    try {
      const formData: any = {
        child_first_name: childFirstName,
        child_last_name: childFullLastName,
        birthday,
        child_age: childAge,
        child_age_group: ageGroup,
        child_gender: gender,
        ethnicity: ethnicity || undefined,
        pickup_location: pickupLocation,
        recipient_name: recipientName || undefined,
        recipient_phone: recipientPhone || undefined,
        delivery_address: deliveryAddress || undefined,
        delivery_notes: deliveryNotes || undefined,
        bag_embroidery_company: bagEmbroideryCompany || undefined,
        bag_order_number: bagOrderNumber || undefined,
        bag_embroidery_color: bagEmbroideryColor,
        toiletry_bag_color: toiletryBagColor,
        toiletry_bag_labeled: toiletryBagLabeled || undefined,
        toy_activity: toyActivity || undefined,
        tops: tops || undefined,
        bottoms: bottoms || undefined,
        pajamas: pajamas || undefined,
        underwear: underwear || undefined,
        diaper_pullup: diaperPullup || undefined,
        shoes: shoes || undefined,
        coat: coat || undefined,
        notes: [
          `Submission ID: ${submissionId}`,
          `Placement Type: ${placementType}`,
          `Caregiver: ${caregiverFirstName} ${caregiverLastName} (${caregiverPhone})`,
          `Social Worker: ${submission.social_worker_first_name} ${submission.social_worker_last_name}`,
          notes || '',
        ].filter(Boolean).join('\n'),
      }

      const bag = await createBagOfHope(formData)

      // Link submission to bag (note: this will fail if bag_of_hope_id column doesn't exist)
      try {
        await linkSubmissionToBag(submission.id, bag.id)
      } catch (linkError) {
        console.warn('Could not link submission to bag:', linkError)
        // Continue anyway - the bag was created successfully
      }

      setCreatedBagId(bag.id)
      setShowQRDialog(true)
      toast.success('Bag of Hope created successfully!')
    } catch (error) {
      console.error('Error creating bag:', error)
      toast.error('Failed to create Bag of Hope')
    } finally {
      setSubmitting(false)
    }
  }

  function handleQRDialogClose() {
    setShowQRDialog(false)
    onComplete()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Process Request</h2>
            <p className="text-muted-foreground">
              Complete the missing information by calling the caregiver
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Submission Information (Read-Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Submission Information (Auto-Filled)
            </CardTitle>
            <CardDescription>
              Information from submission #{submissionId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Child Information */}
            <div>
              <h3 className="font-semibold mb-3">Child Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input value={childFirstName} disabled />
                </div>
                <div>
                  <Label>Last Initial</Label>
                  <Input value={childLastInitial} disabled />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={birthday} type="date" disabled />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input value={`${childAge} years old (${ageGroup})`} disabled />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Input value={gender} className="capitalize" disabled />
                </div>
                <div>
                  <Label>Ethnicity</Label>
                  <Input value={ethnicity} className="capitalize" disabled />
                </div>
                <div>
                  <Label>Placement Type</Label>
                  <Input value={placementType.replace(/_/g, ' ')} className="capitalize" disabled />
                </div>
                <div>
                  <Label>Pickup Location</Label>
                  <Input value={pickupLocation} className="capitalize" disabled />
                </div>
              </div>
            </div>

            <Separator />

            {/* Caregiver Information */}
            <div>
              <h3 className="font-semibold mb-3">Caregiver Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={`${caregiverFirstName} ${caregiverLastName}`} disabled />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={caregiverPhone} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={caregiverEmail} disabled />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input value={caregiverAddress} disabled />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Worker Information */}
            <div>
              <h3 className="font-semibold mb-3">Social Worker</h3>
              <div>
                <Label>Contact</Label>
                <Input value={socialWorker} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Information to Gather from Caregiver */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information from Caregiver Call</CardTitle>
            <CardDescription>
              Recipient details auto-filled from submission - verify/update during caregiver call
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="childFullLastName">
                Child's Full Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="childFullLastName"
                value={childFullLastName}
                onChange={(e) => setChildFullLastName(e.target.value)}
                placeholder={`Starts with ${childLastInitial}...`}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bagEmbroideryColor">
                Child's Favorite Color <span className="text-destructive">*</span>
              </Label>
              <Select value={bagEmbroideryColor} onValueChange={(value) => setBagEmbroideryColor(value as BagColor)}>
                <SelectTrigger id="bagEmbroideryColor">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BAG_COLOR_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Person picking up the bag"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled from submission
              </p>
            </div>

            <div>
              <Label htmlFor="recipientPhone">Recipient Phone</Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Contact number"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled from submission
              </p>
            </div>

            <div>
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                value={caregiverEmail}
                disabled
                placeholder="No email provided"
              />
              <p className="text-xs text-muted-foreground mt-1">
                From submission (read-only)
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="deliveryAddress">Delivery Address (if needed)</Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street address, city, state, zip"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-filled from caregiver address (edit if delivery location is different)
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Special delivery instructions"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bag Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bag Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="bagEmbroideryCompany">Embroidery Company</Label>
              <Input
                id="bagEmbroideryCompany"
                value={bagEmbroideryCompany}
                onChange={(e) => setBagEmbroideryCompany(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bagOrderNumber">Bag Order Number</Label>
              <Input
                id="bagOrderNumber"
                value={bagOrderNumber}
                onChange={(e) => setBagOrderNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="toiletryBagColor">Toiletry Bag Color</Label>
              <Select value={toiletryBagColor} onValueChange={(value) => setToiletryBagColor(value as BagColor)}>
                <SelectTrigger id="toiletryBagColor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BAG_COLOR_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="toiletryBagLabeled">Toiletry Bag Labeled</Label>
              <Input
                id="toiletryBagLabeled"
                value={toiletryBagLabeled}
                onChange={(e) => setToiletryBagLabeled(e.target.value)}
                placeholder="Label information"
              />
            </div>
          </CardContent>
        </Card>

        {/* Non-Clothing Items */}
        <Card>
          <CardHeader>
            <CardTitle>Non-Clothing Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="toyActivity">Toy/Activity Preferences</Label>
            <Textarea
              id="toyActivity"
              value={toyActivity}
              onChange={(e) => setToyActivity(e.target.value)}
              placeholder="Describe any specific toy or activity preferences"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Clothing Items */}
        <Card>
          <CardHeader>
            <CardTitle>Clothing Needs</CardTitle>
            <CardDescription>
              Describe specific clothing items needed (sizes, quantities, preferences)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="tops">Tops</Label>
              <Textarea
                id="tops"
                value={tops}
                onChange={(e) => setTops(e.target.value)}
                placeholder="e.g., 2 t-shirts size 4T, 1 hoodie"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="bottoms">Bottoms</Label>
              <Textarea
                id="bottoms"
                value={bottoms}
                onChange={(e) => setBottoms(e.target.value)}
                placeholder="e.g., 2 pants size 4T, 1 shorts"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="pajamas">Pajamas/Sleepwear</Label>
              <Textarea
                id="pajamas"
                value={pajamas}
                onChange={(e) => setPajamas(e.target.value)}
                placeholder="e.g., 1 pajama set size 4T"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="underwear">Underwear</Label>
              <Textarea
                id="underwear"
                value={underwear}
                onChange={(e) => setUnderwear(e.target.value)}
                placeholder="e.g., 5 pairs size 4T"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="diaperPullup">Diaper/Pullup/Overnight</Label>
              <Textarea
                id="diaperPullup"
                value={diaperPullup}
                onChange={(e) => setDiaperPullup(e.target.value)}
                placeholder="e.g., Size 4 diapers"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="shoes">Shoes</Label>
              <Textarea
                id="shoes"
                value={shoes}
                onChange={(e) => setShoes(e.target.value)}
                placeholder="e.g., Sneakers size 9"
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="coat">Coat</Label>
              <Textarea
                id="coat"
                value={coat}
                onChange={(e) => setCoat(e.target.value)}
                placeholder="e.g., Winter coat size 4T"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or special considerations"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Bag of Hope'}
          </Button>
        </div>
      </form>

      {/* QR Code Dialog */}
      {showQRDialog && createdBagId && (
        <BagQRCodeDialog
          open={showQRDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleQRDialogClose()
            }
          }}
          formData={{
            child_first_name: childFirstName,
            child_last_name: childFullLastName,
            birthday,
            gender,
            ethnicity,
            pickup_location: pickupLocation,
            bag_embroidery_company: bagEmbroideryCompany,
            bag_order_number: bagOrderNumber,
            bag_embroidery_color: bagEmbroideryColor,
            toiletry_bag_color: toiletryBagColor,
            toiletry_bag_labeled: toiletryBagLabeled,
            toy_activity: toyActivity,
            tops,
            bottoms,
            pajamas,
            underwear,
            diaper_pullup: diaperPullup,
            shoes,
            coat,
            notes,
          }}
          onContinueToPick={() => {
            handleQRDialogClose()
          }}
        />
      )}
    </>
  )
}

// Helper function to calculate age
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

// Helper function to get age group
function getAgeGroupFromAge(age: number): AgeGroup {
  if (age < 2) return 'baby'
  if (age < 5) return 'toddler'
  if (age < 13) return 'school_age'
  if (age < 18) return 'teen'
  return 'neutral'
}
