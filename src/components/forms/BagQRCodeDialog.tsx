'use client'

import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, ExternalLink, User, Package, Shirt, FileText, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface BagQRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Record<string, string>
  onContinueToPick: () => void
}

export function BagQRCodeDialog({
  open,
  onOpenChange,
  formData,
  onContinueToPick,
}: BagQRCodeDialogProps) {
  // Generate the URL with encoded parameters
  const generateQRUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams()

    // Add all form data to URL params, filtering out empty values
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value)
      }
    })

    // Add auto=true for auto-submit
    params.append('auto', 'true')

    return `${baseUrl}/request?${params.toString()}`
  }

  const qrUrl = generateQRUrl()

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      toast.success('URL copied to clipboard')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy URL')
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('bag-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        // Create a more detailed filename with child name and submission ID
        let filename = 'bag-qr'
        if (formData.child_first_name && formData.child_last_name) {
          filename = `${formData.child_first_name}-${formData.child_last_name}`
        }
        if (formData.submission_id) {
          filename += `-${formData.submission_id}`
        }
        link.download = `${filename}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('QR code downloaded')
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleOpenUrl = () => {
    window.open(qrUrl, '_blank')
  }

  // Helper to format field display
  const formatField = (value: string | undefined) => {
    if (!value || value === '') return '-'
    return value.replace(/_/g, ' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bag of Hope Created Successfully
          </DialogTitle>
          <DialogDescription>
            Review the bag details and scan the QR code for quick access
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Left Column: QR Code */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
                <QRCodeSVG
                  id="bag-qr-code"
                  value={qrUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan to view bag details
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenUrl}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>

          {/* Right Column: Bag Details */}
          <div className="space-y-4">
            {/* Child Information */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Child Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{formData.child_first_name} {formData.child_last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Birthday:</span>
                    <p className="font-medium">{formatField(formData.birthday)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium capitalize">{formatField(formData.gender)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ethnicity:</span>
                    <p className="font-medium capitalize">{formatField(formData.ethnicity)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bag Details */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Bag Configuration</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Favorite Color:</span>
                    <p className="font-medium">
                      <Badge variant="outline" className="capitalize">{formatField(formData.bag_embroidery_color)}</Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Toiletry Bag:</span>
                    <p className="font-medium capitalize">{formatField(formData.toiletry_bag_color)}</p>
                  </div>
                  {formData.bag_embroidery_company && (
                    <div>
                      <span className="text-muted-foreground">Embroidery:</span>
                      <p className="font-medium">{formData.bag_embroidery_company}</p>
                    </div>
                  )}
                  {formData.bag_order_number && (
                    <div>
                      <span className="text-muted-foreground">Order #:</span>
                      <p className="font-medium">{formData.bag_order_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Delivery Information</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {formData.recipient_name && (
                    <div>
                      <span className="text-muted-foreground">Recipient:</span>
                      <p className="font-medium">{formData.recipient_name}</p>
                    </div>
                  )}
                  {formData.recipient_phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{formData.recipient_phone}</p>
                    </div>
                  )}
                  {formData.delivery_address && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium">{formData.delivery_address}</p>
                    </div>
                  )}
                  {formData.pickup_location && (
                    <div>
                      <span className="text-muted-foreground">Pickup Location:</span>
                      <p className="font-medium capitalize">{formatField(formData.pickup_location)}</p>
                    </div>
                  )}
                  {formData.delivery_notes && (
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="text-xs">{formData.delivery_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Clothing Items */}
            {(formData.tops || formData.bottoms || formData.pajamas || formData.underwear ||
              formData.diaper_pullup || formData.shoes || formData.coat) && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shirt className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Clothing Needs</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    {formData.tops && (
                      <div>
                        <span className="text-muted-foreground">Tops:</span>
                        <p className="text-xs">{formData.tops}</p>
                      </div>
                    )}
                    {formData.bottoms && (
                      <div>
                        <span className="text-muted-foreground">Bottoms:</span>
                        <p className="text-xs">{formData.bottoms}</p>
                      </div>
                    )}
                    {formData.pajamas && (
                      <div>
                        <span className="text-muted-foreground">Pajamas:</span>
                        <p className="text-xs">{formData.pajamas}</p>
                      </div>
                    )}
                    {formData.underwear && (
                      <div>
                        <span className="text-muted-foreground">Underwear:</span>
                        <p className="text-xs">{formData.underwear}</p>
                      </div>
                    )}
                    {formData.diaper_pullup && (
                      <div>
                        <span className="text-muted-foreground">Diapers:</span>
                        <p className="text-xs">{formData.diaper_pullup}</p>
                      </div>
                    )}
                    {formData.shoes && (
                      <div>
                        <span className="text-muted-foreground">Shoes:</span>
                        <p className="text-xs">{formData.shoes}</p>
                      </div>
                    )}
                    {formData.coat && (
                      <div>
                        <span className="text-muted-foreground">Coat:</span>
                        <p className="text-xs">{formData.coat}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Toys & Notes */}
            {(formData.toy_activity || formData.notes) && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Additional Information</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {formData.toy_activity && (
                      <div>
                        <span className="text-muted-foreground">Toys/Activities:</span>
                        <p className="text-xs">{formData.toy_activity}</p>
                      </div>
                    )}
                    {formData.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-xs whitespace-pre-wrap">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reference Information */}
            {(formData.submission_id || formData.neon_service_id || formData.caregiver_first_name || formData.social_worker_first_name) && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-semibold text-xs text-muted-foreground uppercase">Reference Information</h3>
                  <div className="space-y-1 text-xs">
                    {formData.submission_id && (
                      <div>
                        <span className="text-muted-foreground">Submission ID:</span>
                        <p className="font-mono text-xs">{formData.submission_id}</p>
                      </div>
                    )}
                    {formData.neon_service_id && (
                      <div>
                        <span className="text-muted-foreground">Neon Service ID:</span>
                        <p className="font-mono text-xs">{formData.neon_service_id}</p>
                      </div>
                    )}
                    {formData.caregiver_first_name && (
                      <div>
                        <span className="text-muted-foreground">Caregiver:</span>
                        <p className="text-xs">{formData.caregiver_first_name} {formData.caregiver_last_name}</p>
                      </div>
                    )}
                    {formData.social_worker_first_name && (
                      <div>
                        <span className="text-muted-foreground">Social Worker:</span>
                        <p className="text-xs">{formData.social_worker_first_name} {formData.social_worker_last_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={onContinueToPick}
            size="lg"
          >
            Continue to Pick List →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
