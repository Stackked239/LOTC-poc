'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { AgeGroup, Gender, Ethnicity, PickupLocation, BagColor } from '@/types/database'
import { CreateBagOfHopeData } from '@/types/forms'
import { createBagOfHope } from '@/lib/supabase/bags-of-hope'
import { AGE_GROUP_LABELS } from '@/lib/supabase/categories'
import { ETHNICITY_LABELS, PICKUP_LOCATION_LABELS, BAG_COLOR_LABELS } from '@/lib/constants/labels'
import { BagQRCodeDialog } from './BagQRCodeDialog'

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

function getAgeGroupFromAge(age: number): AgeGroup {
  if (age < 2) return 'baby'
  if (age < 5) return 'toddler'
  if (age < 13) return 'school_age'
  if (age < 18) return 'teen'
  return 'neutral'
}

export function CreateBagForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [createdBagId, setCreatedBagId] = useState<string | null>(null)

  // Child Information
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [childAge, setChildAge] = useState<number | null>(null)
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [ethnicity, setEthnicity] = useState<Ethnicity | ''>('')

  // Pickup/Delivery
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | ''>('')

  // Bag Details
  const [bagEmbroideryCompany, setBagEmbroideryCompany] = useState('')
  const [bagOrderNumber, setBagOrderNumber] = useState('')
  const [bagEmbroideryColor, setBagEmbroideryColor] = useState<BagColor | ''>('')
  const [toiletryBagColor, setToiletryBagColor] = useState<BagColor | ''>('')
  const [toiletryBagLabeled, setToiletryBagLabeled] = useState('')

  // Non-Clothing Items
  const [toyActivity, setToyActivity] = useState('')

  // Clothing Items
  const [tops, setTops] = useState('')
  const [bottoms, setBottoms] = useState('')
  const [pajamas, setPajamas] = useState('')
  const [underwear, setUnderwear] = useState('')
  const [diaperPullup, setDiaperPullup] = useState('')
  const [shoes, setShoes] = useState('')
  const [coat, setCoat] = useState('')

  // Additional
  const [requestId, setRequestId] = useState('')
  const [notes, setNotes] = useState('')
  const [autoSubmit, setAutoSubmit] = useState(false)

  // Auto-calculate age when birthday changes
  useEffect(() => {
    if (birthday) {
      const age = calculateAge(birthday)
      setChildAge(age)
      const calculatedAgeGroup = getAgeGroupFromAge(age)
      setAgeGroup(calculatedAgeGroup)
    } else {
      setChildAge(null)
      setAgeGroup('')
    }
  }, [birthday])

  // Pre-fill from URL parameters
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())

    if (params.child_first_name) setChildFirstName(params.child_first_name)
    if (params.child_last_name) setChildLastName(params.child_last_name)
    if (params.birthday) setBirthday(params.birthday)
    if (params.gender && ['boy', 'girl'].includes(params.gender)) {
      setGender(params.gender as Gender)
    }
    if (params.ethnicity) setEthnicity(params.ethnicity as Ethnicity)
    if (params.pickup_location) setPickupLocation(params.pickup_location as PickupLocation)
    if (params.bag_embroidery_company) setBagEmbroideryCompany(params.bag_embroidery_company)
    if (params.bag_order_number) setBagOrderNumber(params.bag_order_number)
    if (params.bag_embroidery_color) setBagEmbroideryColor(params.bag_embroidery_color as BagColor)
    if (params.toiletry_bag_color) setToiletryBagColor(params.toiletry_bag_color as BagColor)
    if (params.toiletry_bag_labeled) setToiletryBagLabeled(params.toiletry_bag_labeled)
    if (params.toy_activity) setToyActivity(params.toy_activity)
    if (params.tops) setTops(params.tops)
    if (params.bottoms) setBottoms(params.bottoms)
    if (params.pajamas) setPajamas(params.pajamas)
    if (params.underwear) setUnderwear(params.underwear)
    if (params.diaper_pullup) setDiaperPullup(params.diaper_pullup)
    if (params.shoes) setShoes(params.shoes)
    if (params.coat) setCoat(params.coat)
    if (params.request_id) setRequestId(params.request_id)
    if (params.notes) setNotes(params.notes)
    if (params.auto === 'true') setAutoSubmit(true)
  }, [searchParams])

  // Auto-submit if all required fields are filled and auto=true
  useEffect(() => {
    if (autoSubmit && childFirstName && childLastName && birthday && gender && pickupLocation && !loading) {
      setAutoSubmit(false)
      handleAutoSubmit()
    }
  }, [autoSubmit, childFirstName, childLastName, birthday, gender, pickupLocation])

  const submitBag = async () => {
    if (!childFirstName || !childLastName || !birthday || !gender || !pickupLocation) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const data: CreateBagOfHopeData = {
        child_first_name: childFirstName,
        child_last_name: childLastName,
        birthday,
        child_age: childAge || undefined,
        child_age_group: ageGroup as AgeGroup,
        child_gender: gender,
        ethnicity: ethnicity || undefined,
        pickup_location: pickupLocation,
        bag_embroidery_company: bagEmbroideryCompany || undefined,
        bag_order_number: bagOrderNumber || undefined,
        bag_embroidery_color: bagEmbroideryColor || undefined,
        toiletry_bag_color: toiletryBagColor || undefined,
        toiletry_bag_labeled: toiletryBagLabeled || undefined,
        toy_activity: toyActivity || undefined,
        tops: tops || undefined,
        bottoms: bottoms || undefined,
        pajamas: pajamas || undefined,
        underwear: underwear || undefined,
        diaper_pullup: diaperPullup || undefined,
        shoes: shoes || undefined,
        coat: coat || undefined,
        request_id: requestId || undefined,
        notes: notes || undefined,
      }

      const bag = await createBagOfHope(data)

      toast.success('Bag of Hope created')

      setCreatedBagId(bag.id)
      setShowQRDialog(true)
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

  const handleContinueToPick = () => {
    if (createdBagId) {
      router.push(`/pick?bag=${createdBagId}`)
    }
  }

  // Prepare data for QR dialog
  const qrData = {
    child_first_name: childFirstName,
    child_last_name: childLastName,
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
    request_id: requestId,
    notes,
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            New Bag of Hope Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quick View Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Quick View Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Child&apos;s First Name *</Label>
                  <Input
                    id="first-name"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Child&apos;s Last Name *</Label>
                  <Input
                    id="last-name"
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday *</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter birthday first - age will auto-calculate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Child&apos;s Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={childAge || ''}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically calculated from birthday above
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as Gender)}>
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
                  <Label htmlFor="ethnicity">Ethnicity</Label>
                  <Select value={ethnicity} onValueChange={(value) => setEthnicity(value as Ethnicity)}>
                    <SelectTrigger id="ethnicity">
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ETHNICITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pickup-location">Pickup Location *</Label>
                  <Select value={pickupLocation} onValueChange={(value) => setPickupLocation(value as PickupLocation)}>
                    <SelectTrigger id="pickup-location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PICKUP_LOCATION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bag Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Bag Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="embroidery-company">Bag Embroidery Company</Label>
                  <Input
                    id="embroidery-company"
                    value={bagEmbroideryCompany}
                    onChange={(e) => setBagEmbroideryCompany(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order-number">Bag Order Number</Label>
                  <Input
                    id="order-number"
                    value={bagOrderNumber}
                    onChange={(e) => setBagOrderNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embroidery-color">Bag Embroidery Color (Child&apos;s Favorite Color)</Label>
                  <Select value={bagEmbroideryColor} onValueChange={(value) => setBagEmbroideryColor(value as BagColor)}>
                    <SelectTrigger id="embroidery-color">
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

                <div className="space-y-2">
                  <Label htmlFor="toiletry-color">Toiletry Bag Color</Label>
                  <Select value={toiletryBagColor} onValueChange={(value) => setToiletryBagColor(value as BagColor)}>
                    <SelectTrigger id="toiletry-color">
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="toiletry-labeled">Toiletry Bag Labeled</Label>
                  <Input
                    id="toiletry-labeled"
                    placeholder="Label information"
                    value={toiletryBagLabeled}
                    onChange={(e) => setToiletryBagLabeled(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Non-Clothing Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Non-Clothing Items</h3>

              <div className="space-y-2">
                <Label htmlFor="toy-activity">Toy/Activity</Label>
                <Textarea
                  id="toy-activity"
                  rows={2}
                  value={toyActivity}
                  onChange={(e) => setToyActivity(e.target.value)}
                />
              </div>
            </div>

            {/* Clothing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Clothing</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tops">Tops</Label>
                  <Textarea
                    id="tops"
                    rows={2}
                    value={tops}
                    onChange={(e) => setTops(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bottoms">Bottoms</Label>
                  <Textarea
                    id="bottoms"
                    rows={2}
                    value={bottoms}
                    onChange={(e) => setBottoms(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pajamas">Pajamas/Sleepwear</Label>
                  <Textarea
                    id="pajamas"
                    rows={2}
                    value={pajamas}
                    onChange={(e) => setPajamas(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="underwear">Underwear</Label>
                  <Textarea
                    id="underwear"
                    rows={2}
                    value={underwear}
                    onChange={(e) => setUnderwear(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diaper">Diaper/Pullup/Overnight</Label>
                  <Textarea
                    id="diaper"
                    rows={2}
                    value={diaperPullup}
                    onChange={(e) => setDiaperPullup(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shoes">Shoes (use only if needed)</Label>
                  <Textarea
                    id="shoes"
                    rows={2}
                    value={shoes}
                    onChange={(e) => setShoes(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="coat">Coat (use only if needed)</Label>
                  <Textarea
                    id="coat"
                    rows={2}
                    value={coat}
                    onChange={(e) => setCoat(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Notes</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Other BOH / Birthday Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating...' : 'Create Bag Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <BagQRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        formData={qrData}
        onContinueToPick={handleContinueToPick}
      />
    </>
  )
}
