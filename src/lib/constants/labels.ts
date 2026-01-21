import { Ethnicity, PickupLocation, BagColor } from '@/types/database'

export const ETHNICITY_LABELS: Record<Ethnicity, string> = {
  hispanic_latino: 'Hispanic or Latino',
  white: 'White',
  black_african_american: 'Black or African American',
  asian: 'Asian',
  native_american: 'Native American or Alaska Native',
  pacific_islander: 'Native Hawaiian or Pacific Islander',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
}

export const PICKUP_LOCATION_LABELS: Record<PickupLocation, string> = {
  main_office: 'Main Office',
  community_center: 'Community Center',
  church: 'Church',
  home_delivery: 'Home Delivery',
  other: 'Other',
}

export const BAG_COLOR_LABELS: Record<BagColor, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  pink: 'Pink',
  purple: 'Purple',
  orange: 'Orange',
  black: 'Black',
  white: 'White',
  multicolor: 'Multicolor',
}
