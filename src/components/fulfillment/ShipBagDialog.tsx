'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Truck, Check } from 'lucide-react'
import { shipBag } from '@/lib/supabase/bags-of-hope'
import { toast } from 'sonner'

const shipBagSchema = z.object({
  delivery_address: z.string().min(1, 'Delivery address is required'),
  recipient_name: z.string().optional(),
  recipient_phone: z.string().optional(),
  delivery_notes: z.string().optional(),
})

type ShipBagFormData = z.infer<typeof shipBagSchema>

interface ShipBagDialogProps {
  bagId: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ShipBagDialog({ bagId, onSuccess, trigger }: ShipBagDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<ShipBagFormData>({
    resolver: zodResolver(shipBagSchema),
    defaultValues: {
      delivery_address: '',
      recipient_name: '',
      recipient_phone: '',
      delivery_notes: '',
    },
  })

  const onSubmit = async (data: ShipBagFormData) => {
    setLoading(true)
    try {
      await shipBag(bagId, {
        delivery_address: data.delivery_address,
        recipient_name: data.recipient_name || undefined,
        recipient_phone: data.recipient_phone || undefined,
        delivery_notes: data.delivery_notes || undefined,
      })

      toast.success('Bag marked as in transit')
      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error shipping bag:', error)
      toast.error('Failed to mark bag as in transit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Check className="h-4 w-4 mr-1" />
            Mark In Transit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Ship Bag of Hope
          </DialogTitle>
          <DialogDescription>
            Enter shipping details to mark this bag as in transit
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="delivery_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St, City, State ZIP"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipient_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="delivery_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special delivery instructions..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Truck className="h-4 w-4 mr-2" />
                {loading ? 'Shipping...' : 'Mark In Transit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
