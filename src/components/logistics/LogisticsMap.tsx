'use client'

import { useEffect, useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import { MapPin, Package, Truck, Heart, Navigation } from 'lucide-react'
import { LogisticsLocation, geocodeAddress } from '@/lib/supabase/logistics'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BAG_STATUS_LABELS, BATCH_STATUS_LABELS } from '@/types/database'
import 'mapbox-gl/dist/mapbox-gl.css'

interface LocationWithCoords extends LogisticsLocation {
  lat: number
  lng: number
}

interface LogisticsMapProps {
  locations: LogisticsLocation[]
}

export function LogisticsMap({ locations }: LogisticsMapProps) {
  const [mappedLocations, setMappedLocations] = useState<LocationWithCoords[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationWithCoords | null>(null)
  const [viewport, setViewport] = useState({
    latitude: 35.2271, // North Carolina center
    longitude: -80.8431,
    zoom: 7,
  })

  useEffect(() => {
    async function geocodeLocations() {
      const locationsWithCoords: LocationWithCoords[] = []

      for (const location of locations) {
        if (location.address) {
          const coords = await geocodeAddress(location.address)
          if (coords) {
            locationsWithCoords.push({
              ...location,
              lat: coords.lat,
              lng: coords.lng,
            })
          }
        }
      }

      setMappedLocations(locationsWithCoords)

      // Center map on first location if available
      if (locationsWithCoords.length > 0) {
        setViewport({
          latitude: locationsWithCoords[0].lat,
          longitude: locationsWithCoords[0].lng,
          zoom: 10,
        })
      }
    }

    geocodeLocations()
  }, [locations])

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'ready_to_ship':
      case 'pending':
        return '#F59E0B' // Amber
      case 'in_transit':
        return '#0F5DAB' // LOTC Blue
      case 'ready_for_pickup':
        return '#10B981' // Green
      case 'delivered':
        return '#9CA3AF' // Light Gray
      default:
        return '#DC2626' // LOTC Red
    }
  }

  const getMarkerBackground = (status: string) => {
    switch (status) {
      case 'ready_to_ship':
      case 'pending':
        return 'bg-amber-500'
      case 'in_transit':
        return 'bg-lotc-blue'
      case 'ready_for_pickup':
        return 'bg-green-500'
      case 'delivered':
        return 'bg-gray-400'
      default:
        return 'bg-lotc-red'
    }
  }

  const getStatusLabel = (location: LocationWithCoords) => {
    if (location.type === 'bag') {
      return BAG_STATUS_LABELS[location.status as keyof typeof BAG_STATUS_LABELS] || location.status
    }
    return BATCH_STATUS_LABELS[location.status as keyof typeof BATCH_STATUS_LABELS] || location.status
  }

  return (
    <div className="h-full w-full relative">
      <style jsx global>{`
        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 24px !important;
          color: white !important;
          padding: 8px 12px !important;
          line-height: 1 !important;
          background: rgba(0, 0, 0, 0.2) !important;
          border-radius: 0 12px 0 8px !important;
          transition: all 0.2s !important;
        }
        .mapboxgl-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.4) !important;
          color: white !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: white !important;
        }
      `}</style>
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => setSelectedLocation(null)}
      >
        {mappedLocations.map((location) => (
          <Marker
            key={location.id}
            latitude={location.lat}
            longitude={location.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedLocation(location)
            }}
          >
            <div
              className={`cursor-pointer transition-all duration-200 hover:scale-125 hover:-translate-y-1 ${
                selectedLocation?.id === location.id ? 'scale-125 -translate-y-1' : ''
              }`}
            >
              {/* Custom LOTC Marker */}
              <div className="relative">
                {/* Marker Pin */}
                <div
                  className={`${getMarkerBackground(
                    location.status
                  )} w-10 h-10 rounded-full shadow-lg flex items-center justify-center border-3 border-white`}
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Heart className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                {/* Pin Point */}
                <div
                  className={`${getMarkerBackground(
                    location.status
                  )} w-3 h-3 absolute left-1/2 -translate-x-1/2 -bottom-1 rotate-45 border-r-2 border-b-2 border-white`}
                  style={{
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
                {/* Pulse animation for in-transit */}
                {location.status === 'in_transit' && (
                  <div
                    className="absolute inset-0 w-10 h-10 rounded-full bg-lotc-blue animate-ping opacity-30"
                    style={{ animationDuration: '2s' }}
                  />
                )}
              </div>
            </div>
          </Marker>
        ))}

        {selectedLocation && (
          <Popup
            latitude={selectedLocation.lat}
            longitude={selectedLocation.lng}
            anchor="top"
            onClose={() => setSelectedLocation(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="320px"
          >
            <div className="bg-white overflow-hidden w-[300px]">
              {/* Header with status color */}
              <div
                className={`${getMarkerBackground(
                  selectedLocation.status
                )} px-5 py-4 text-white relative`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Heart className="h-6 w-6 drop-shadow-md" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base leading-tight">
                      {selectedLocation.type === 'bag' ? 'Bag of Hope' : 'Delivery Batch'}
                    </h3>
                    <p className="text-sm opacity-95 mt-1">{getStatusLabel(selectedLocation)}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
                {/* Recipient Info */}
                {selectedLocation.recipient_name && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-lotc-blue/10 flex items-center justify-center">
                        <Navigation className="h-4 w-4 text-lotc-blue" />
                      </div>
                      <span className="text-xs font-semibold text-lotc-grey uppercase tracking-wide">
                        Recipient
                      </span>
                    </div>
                    <p className="text-base font-semibold text-lotc-black ml-10">
                      {selectedLocation.recipient_name}
                    </p>
                  </div>
                )}

                {/* Address */}
                {selectedLocation.address && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-lotc-red/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-lotc-red" />
                      </div>
                      <span className="text-xs font-semibold text-lotc-grey uppercase tracking-wide">
                        Destination
                      </span>
                    </div>
                    <p className="text-sm text-lotc-black leading-relaxed ml-10">
                      {selectedLocation.address}
                    </p>
                  </div>
                )}

                {/* Batch Details */}
                {selectedLocation.type === 'batch' && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {selectedLocation.batch_number && (
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-lotc-blue">
                            #{selectedLocation.batch_number}
                          </div>
                          <div className="text-xs text-lotc-grey mt-1">Batch</div>
                        </div>
                      )}
                      {selectedLocation.bag_count !== undefined && (
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-lotc-red">
                            {selectedLocation.bag_count}
                          </div>
                          <div className="text-xs text-lotc-grey mt-1">Bags</div>
                        </div>
                      )}
                    </div>
                    {selectedLocation.courier_name && (
                      <div className="mt-3 text-sm">
                        <span className="text-lotc-grey">Courier: </span>
                        <span className="font-semibold text-lotc-black">
                          {selectedLocation.courier_name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white/98 backdrop-blur-sm rounded-xl shadow-2xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-4 w-4 text-lotc-red" fill="currentColor" />
          <p className="text-sm font-bold text-lotc-black">Delivery Status</p>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md border-2 border-white" />
            <span className="text-lotc-black">Ready to Ship</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-lotc-blue shadow-md border-2 border-white relative">
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-lotc-blue animate-ping opacity-30" />
            </div>
            <span className="text-lotc-black">In Transit</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-green-500 shadow-md border-2 border-white" />
            <span className="text-lotc-black">Ready for Pickup</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-gray-400 shadow-md border-2 border-white" />
            <span className="text-lotc-black">Delivered</span>
          </div>
        </div>
      </div>
    </div>
  )
}
