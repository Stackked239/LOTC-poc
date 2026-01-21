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
import { Badge } from '@/components/ui/badge'
import { Heart, X } from 'lucide-react'
import { toast } from 'sonner'
import { Submission } from '@/types/database'
import { BagColor, Gender, AgeGroup } from '@/types/database'
import { createBagOfHope } from '@/lib/supabase/bags-of-hope'
import { linkSubmissionToBag, updateSubmission } from '@/lib/supabase/submissions'
import { BAG_COLOR_LABELS } from '@/lib/constants/labels'
import { BagQRCodeDialog } from './BagQRCodeDialog'

interface ProcessSubmissionFormProps {
  submission: Submission
  onCancel: () => void
  onComplete: () => void
}

export function ProcessSubmissionForm({ submission, onCancel, onComplete }: ProcessSubmissionFormProps) {
  const router = useRouter()

  // Auto-populated from submission - using actual schema fields (all editable except IDs)
  const [childFirstName, setChildFirstName] = useState(submission.child_first_name)
  const [childLastInitial, setChildLastInitial] = useState(submission.child_last_initial)
  const [birthday, setBirthday] = useState(submission.child_dob)
  const [gender, setGender] = useState<Gender>(submission.child_gender as Gender)
  const [ethnicity, setEthnicity] = useState(submission.child_ethnicity || '')
  const [pickupLocation, setPickupLocation] = useState(submission.pickup_location)
  const [caregiverFirstName, setCaregiverFirstName] = useState(submission.caregiver_first_name)
  const [caregiverLastName, setCaregiverLastName] = useState(submission.caregiver_last_name)
  const [caregiverPhone, setCaregiverPhone] = useState(submission.caregiver_phone || '')
  const [caregiverEmail, setCaregiverEmail] = useState(submission.caregiver_email || '')
  const [caregiverAddress, setCaregiverAddress] = useState(
    `${submission.caregiver_street}, ${submission.caregiver_city}, ${submission.caregiver_state} ${submission.caregiver_zip}`
  )
  const [placementType, setPlacementType] = useState(submission.child_placement_type)
  const [socialWorkerFirstName, setSocialWorkerFirstName] = useState(submission.social_worker_first_name)
  const [socialWorkerLastName, setSocialWorkerLastName] = useState(submission.social_worker_last_name)
  const [socialWorkerEmail, setSocialWorkerEmail] = useState(submission.social_worker_email)
  const [socialWorkerPhone, setSocialWorkerPhone] = useState(submission.social_worker_phone || '')
  const [submissionId] = useState(submission.submission_id)
  const [neonServiceId] = useState(submission.neon_service_id || '')

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
  const [recipientEmail, setRecipientEmail] = useState(caregiverEmail) // Auto-fill and allow editing
  const [deliveryAddress, setDeliveryAddress] = useState(caregiverAddress) // Auto-fill from submission
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const [childAge, setChildAge] = useState<number>(0)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('neutral')
  const [submitting, setSubmitting] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [createdBagId, setCreatedBagId] = useState<string>('')

  // Calculate age and age group when birthday changes
  useEffect(() => {
    if (birthday) {
      const age = calculateAge(birthday)
      setChildAge(age)
      const calculatedAgeGroup = getAgeGroupFromAge(age)
      setAgeGroup(calculatedAgeGroup)
    }
  }, [birthday])

  // Sync recipient contact info with caregiver info when caregiver fields change
  useEffect(() => {
    setRecipientName(`${caregiverFirstName} ${caregiverLastName}`)
  }, [caregiverFirstName, caregiverLastName])

  useEffect(() => {
    setRecipientPhone(caregiverPhone)
  }, [caregiverPhone])

  useEffect(() => {
    setRecipientEmail(caregiverEmail)
  }, [caregiverEmail])

  useEffect(() => {
    setDeliveryAddress(caregiverAddress)
  }, [caregiverAddress])

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
      // First, update the submission record with edited values
      await updateSubmission(submission.id, {
        child_first_name: childFirstName,
        child_last_initial: childLastInitial,
        child_dob: birthday,
        child_gender: gender,
        child_ethnicity: ethnicity,
        child_placement_type: placementType,
        pickup_location: pickupLocation,
        caregiver_first_name: caregiverFirstName,
        caregiver_last_name: caregiverLastName,
        caregiver_phone: caregiverPhone,
        caregiver_email: caregiverEmail,
        // Note: Not updating address components since caregiverAddress is a concatenated string
        // and we can't reliably parse it back into street/city/state/zip
        social_worker_first_name: socialWorkerFirstName,
        social_worker_last_name: socialWorkerLastName,
        social_worker_email: socialWorkerEmail,
        social_worker_phone: socialWorkerPhone,
      })

      // Then create the bag of hope with the form data
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
          neonServiceId ? `Neon Service ID: ${neonServiceId}` : '',
          `Placement Type: ${placementType}`,
          `Caregiver: ${caregiverFirstName} ${caregiverLastName} (${caregiverPhone})`,
          `Social Worker: ${socialWorkerFirstName} ${socialWorkerLastName} (${socialWorkerEmail})`,
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

        {/* Submission Information (Editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Submission Information
            </CardTitle>
            <CardDescription>
              Information from submission #{submissionId} - verify and update as needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Child Information */}
            <div>
              <h3 className="font-semibold mb-3">Child Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="childFirstName" className="text-sm">First Name</Label>
                  <Input
                    id="childFirstName"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childLastInitial" className="text-sm">Last Initial</Label>
                  <Input
                    id="childLastInitial"
                    value={childLastInitial}
                    onChange={(e) => setChildLastInitial(e.target.value)}
                    className="h-10"
                    maxLength={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="text-sm">Date of Birth</Label>
                  <Input
                    id="birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    type="date"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Age</Label>
                  <Input value={`${childAge} years old (${ageGroup})`} disabled className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm">Gender</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as Gender)}>
                    <SelectTrigger id="gender" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boy">Boy</SelectItem>
                      <SelectItem value="girl">Girl</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ethnicity" className="text-sm">Ethnicity</Label>
                  <Input
                    id="ethnicity"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="h-10 capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placementType" className="text-sm">Placement Type</Label>
                  <Input
                    id="placementType"
                    value={placementType}
                    onChange={(e) => setPlacementType(e.target.value)}
                    className="h-10 capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation" className="text-sm">Pickup Location</Label>
                  <Input
                    id="pickupLocation"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="h-10 capitalize"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Caregiver Information */}
            <div>
              <h3 className="font-semibold mb-3">Caregiver Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="caregiverFirstName" className="text-sm">First Name</Label>
                  <Input
                    id="caregiverFirstName"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caregiverLastName" className="text-sm">Last Name</Label>
                  <Input
                    id="caregiverLastName"
                    value={caregiverLastName}
                    onChange={(e) => setCaregiverLastName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caregiverPhoneTop" className="text-sm">Phone</Label>
                  <Input
                    id="caregiverPhoneTop"
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caregiverEmailTop" className="text-sm">Email</Label>
                  <Input
                    id="caregiverEmailTop"
                    value={caregiverEmail}
                    onChange={(e) => setCaregiverEmail(e.target.value)}
                    type="email"
                    className="h-10"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="caregiverAddressTop" className="text-sm">Address</Label>
                  <Input
                    id="caregiverAddressTop"
                    value={caregiverAddress}
                    onChange={(e) => setCaregiverAddress(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Worker Information */}
            <div>
              <h3 className="font-semibold mb-3">Social Worker Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="socialWorkerFirstName" className="text-sm">First Name</Label>
                  <Input
                    id="socialWorkerFirstName"
                    value={socialWorkerFirstName}
                    onChange={(e) => setSocialWorkerFirstName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialWorkerLastName" className="text-sm">Last Name</Label>
                  <Input
                    id="socialWorkerLastName"
                    value={socialWorkerLastName}
                    onChange={(e) => setSocialWorkerLastName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialWorkerEmail" className="text-sm">Email</Label>
                  <Input
                    id="socialWorkerEmail"
                    value={socialWorkerEmail}
                    onChange={(e) => setSocialWorkerEmail(e.target.value)}
                    type="email"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialWorkerPhone" className="text-sm">Phone</Label>
                  <Input
                    id="socialWorkerPhone"
                    value={socialWorkerPhone}
                    onChange={(e) => setSocialWorkerPhone(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Reference IDs */}
            <div>
              <h3 className="font-semibold mb-3">Reference Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Submission ID</Label>
                  <Input value={submissionId} disabled className="font-mono text-sm" />
                </div>
                {neonServiceId && (
                  <div>
                    <Label>Neon Service ID</Label>
                    <Input value={neonServiceId} disabled className="font-mono text-sm" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Information to Gather from Caregiver */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-lg">Call Caregiver - Collect Required Information</CardTitle>
            <CardDescription>
              Fields marked with <span className="text-destructive">*</span> are required
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-destructive" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Required Information</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="childFullLastName" className="text-sm font-medium">
                    Child's Full Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="childFullLastName"
                    value={childFullLastName}
                    onChange={(e) => setChildFullLastName(e.target.value)}
                    placeholder={`Starts with ${childLastInitial}...`}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bagEmbroideryColor" className="text-sm font-medium">
                    Child's Favorite Color <span className="text-destructive">*</span>
                  </Label>
                  <Select value={bagEmbroideryColor} onValueChange={(value) => setBagEmbroideryColor(value as BagColor)}>
                    <SelectTrigger id="bagEmbroideryColor" className="h-10">
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
              </div>
            </div>

            <Separator />

            {/* Recipient Contact (Auto-synced) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Recipient Contact</h3>
                </div>
                <Badge variant="outline" className="text-xs">Auto-synced from above</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="text-sm">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhone" className="text-sm">Phone Number</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientEmail" className="text-sm">Email Address</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Delivery Information</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress" className="text-sm">Delivery Address</Label>
                  <Input
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground italic">
                    Edit if different from: {caregiverAddress}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes" className="text-sm">Delivery Notes</Label>
                  <Textarea
                    id="deliveryNotes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Special instructions, gate codes, etc."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bag Details */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Bag Details</CardTitle>
            <CardDescription>Optional embroidery and toiletry bag information</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Embroidery Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Embroidery Information</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bagEmbroideryCompany" className="text-sm">Embroidery Company</Label>
                  <Input
                    id="bagEmbroideryCompany"
                    value={bagEmbroideryCompany}
                    onChange={(e) => setBagEmbroideryCompany(e.target.value)}
                    placeholder="Company name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bagOrderNumber" className="text-sm">Order Number</Label>
                  <Input
                    id="bagOrderNumber"
                    value={bagOrderNumber}
                    onChange={(e) => setBagOrderNumber(e.target.value)}
                    placeholder="Order #"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Toiletry Bag Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Toiletry Bag</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="toiletryBagColor" className="text-sm">Color</Label>
                  <Select value={toiletryBagColor} onValueChange={(value) => setToiletryBagColor(value as BagColor)}>
                    <SelectTrigger id="toiletryBagColor" className="h-10">
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

                <div className="space-y-2">
                  <Label htmlFor="toiletryBagLabeled" className="text-sm">Label Text</Label>
                  <Input
                    id="toiletryBagLabeled"
                    value={toiletryBagLabeled}
                    onChange={(e) => setToiletryBagLabeled(e.target.value)}
                    placeholder="Label information"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Non-Clothing Items */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Non-Clothing Items</CardTitle>
            <CardDescription>Toy and activity preferences for the child</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-2">
            <Label htmlFor="toyActivity" className="text-sm">Toy/Activity Preferences</Label>
            <Textarea
              id="toyActivity"
              value={toyActivity}
              onChange={(e) => setToyActivity(e.target.value)}
              placeholder="Describe any specific toy or activity preferences (e.g., dolls, sports equipment, art supplies, books)"
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Clothing Items */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Clothing Needs</CardTitle>
            <CardDescription>
              Specify clothing items needed with sizes, quantities, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Basic Clothing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Basic Clothing</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tops" className="text-sm">Tops</Label>
                  <Textarea
                    id="tops"
                    value={tops}
                    onChange={(e) => setTops(e.target.value)}
                    placeholder="e.g., 2 t-shirts size 4T, 1 hoodie"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bottoms" className="text-sm">Bottoms</Label>
                  <Textarea
                    id="bottoms"
                    value={bottoms}
                    onChange={(e) => setBottoms(e.target.value)}
                    placeholder="e.g., 2 pants size 4T, 1 shorts"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pajamas" className="text-sm">Pajamas/Sleepwear</Label>
                  <Textarea
                    id="pajamas"
                    value={pajamas}
                    onChange={(e) => setPajamas(e.target.value)}
                    placeholder="e.g., 1 pajama set size 4T"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="underwear" className="text-sm">Underwear</Label>
                  <Textarea
                    id="underwear"
                    value={underwear}
                    onChange={(e) => setUnderwear(e.target.value)}
                    placeholder="e.g., 5 pairs size 4T"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Special Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Special Items</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="diaperPullup" className="text-sm">Diaper/Pullup/Overnight</Label>
                  <Textarea
                    id="diaperPullup"
                    value={diaperPullup}
                    onChange={(e) => setDiaperPullup(e.target.value)}
                    placeholder="e.g., Size 4 diapers"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shoes" className="text-sm">Shoes</Label>
                  <Textarea
                    id="shoes"
                    value={shoes}
                    onChange={(e) => setShoes(e.target.value)}
                    placeholder="e.g., Sneakers size 9"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coat" className="text-sm">Coat/Outerwear</Label>
                  <Textarea
                    id="coat"
                    value={coat}
                    onChange={(e) => setCoat(e.target.value)}
                    placeholder="e.g., Winter coat size 4T"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Additional Notes</CardTitle>
            <CardDescription>Any other information or special considerations</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-2">
            <Label htmlFor="notes" className="text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes, special requests, allergies, or other important information"
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-end items-center">
              <p className="text-sm text-muted-foreground mr-auto">
                Ready to create the Bag of Hope?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                size="lg"
                className="min-w-[120px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="min-w-[180px]"
              >
                <Heart className="h-4 w-4 mr-2" />
                {submitting ? 'Creating...' : 'Create Bag of Hope'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
            // Child Information
            child_first_name: childFirstName,
            child_last_name: childFullLastName,
            birthday,
            gender,
            ethnicity,
            child_age: childAge.toString(),
            child_age_group: ageGroup,
            pickup_location: pickupLocation,
            child_placement_type: placementType,

            // Caregiver Information
            caregiver_first_name: caregiverFirstName,
            caregiver_last_name: caregiverLastName,
            caregiver_phone: caregiverPhone,
            caregiver_email: caregiverEmail,
            caregiver_address: caregiverAddress,

            // Social Worker Information
            social_worker_first_name: socialWorkerFirstName,
            social_worker_last_name: socialWorkerLastName,
            social_worker_email: socialWorkerEmail,
            social_worker_phone: socialWorkerPhone,

            // Recipient/Delivery Information
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_email: recipientEmail,
            delivery_address: deliveryAddress,
            delivery_notes: deliveryNotes,

            // Bag Details
            bag_embroidery_company: bagEmbroideryCompany,
            bag_order_number: bagOrderNumber,
            bag_embroidery_color: bagEmbroideryColor,
            toiletry_bag_color: toiletryBagColor,
            toiletry_bag_labeled: toiletryBagLabeled,

            // Items
            toy_activity: toyActivity,
            tops,
            bottoms,
            pajamas,
            underwear,
            diaper_pullup: diaperPullup,
            shoes,
            coat,
            notes,

            // Reference IDs
            submission_id: submissionId,
            neon_service_id: neonServiceId,
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
