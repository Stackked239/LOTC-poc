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
import { Copy, Download, ExternalLink } from 'lucide-react'
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
        const filename = formData.child_first_name && formData.child_last_name
          ? `${formData.child_first_name}-${formData.child_last_name}-qr.png`
          : `bag-request-qr.png`
        link.download = filename
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bag Request Created</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly recreate this bag request, or share it with the picker.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              id="bag-qr-code"
              value={qrUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Request Summary */}
          <div className="w-full space-y-2 text-sm max-h-40 overflow-y-auto">
            {formData.child_first_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Child:</span>
                <span className="font-medium">{formData.child_first_name} {formData.child_last_name}</span>
              </div>
            )}
            {formData.birthday && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birthday:</span>
                <span className="font-medium">{formData.birthday}</span>
              </div>
            )}
            {formData.gender && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium capitalize">{formData.gender}</span>
              </div>
            )}
            {formData.pickup_location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup:</span>
                <span className="font-medium">{formData.pickup_location.replace(/_/g, ' ')}</span>
              </div>
            )}
            {formData.request_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request ID:</span>
                <span className="font-medium">{formData.request_id}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2">
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
              Test URL
            </Button>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onContinueToPick}
            className="w-full"
            size="lg"
          >
            Continue to Pick List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
