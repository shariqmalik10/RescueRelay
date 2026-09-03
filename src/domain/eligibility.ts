import type {
  EligibilityReasonCode,
  EligibilityResult,
  OfferInput,
  Partner,
} from './types'

export const REASON_EXPLANATIONS: Record<EligibilityReasonCode, string> = {
  PARTNER_INACTIVE: 'This partner is not currently active in the rescue network.',
  CATEGORY_NOT_ACCEPTED: 'This partner does not accept this meal category.',
  SEALED_PACKAGING_REQUIRED: 'This partner requires sealed meal packaging.',
  ALLERGEN_INFORMATION_REQUIRED: 'This partner requires allergen information to be present.',
  STORAGE_UNSUPPORTED: 'This partner cannot support the declared storage condition.',
  PICKUP_WINDOW_MISMATCH: 'The proposed pickup window does not overlap this partner’s hours.',
  CAPACITY_EXCEEDED: 'The meal quantity exceeds this partner’s declared demo capacity.',
}

/**
 * Public-profile snapshot captured on 2026-09-03 for the first U.S. pilot slice.
 * Operational fields come from each organization's published food-donation guidance;
 * registry links point to public IRS-derived records. This is not a live availability feed.
 */
export const PARTNERS: Partner[] = [
  {
    id: 'partner_bowery_mission',
    slug: 'bowery-mission',
    name: 'The Bowery Mission',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'],
    pickupStart: '19:00',
    pickupEnd: '20:00',
    address: '227 Bowery',
    city: 'New York',
    state: 'NY',
    postalCode: '10002',
    ein: '13-1617086',
    websiteUrl: 'https://www.bowery.org/',
    policyUrl: 'https://www.bowery.org/donate/donate-goods/',
    registryUrl: 'https://projects.propublica.org/nonprofits/organizations/131617086',
    sourceLabel: 'The Bowery Mission · food donation guidance',
    sourceNote: 'Published guidance accepts professionally catered prepared food that is fresh and sealed; Bowery food drop-off is listed as 7–8 pm daily. Category and chilled-storage mapping are pilot assumptions—confirm directly before a real handoff.',
    snapshotDate: '2026-09-03',
    verificationStatus: 'public-profile',
  },
  {
    id: 'partner_city_harvest',
    slug: 'city-harvest',
    name: 'City Harvest',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'],
    pickupStart: '09:00',
    pickupEnd: '17:00',
    address: '150 52nd Street',
    city: 'Brooklyn',
    state: 'NY',
    postalCode: '11232',
    ein: '13-3170676',
    websiteUrl: 'https://www.cityharvest.org/',
    policyUrl: 'https://www.cityharvest.org/wp-content/uploads/2023/08/FY24-City-Harvest-Donor-Packet.pdf',
    registryUrl: 'https://projects.propublica.org/nonprofits/organizations/133170676',
    sourceLabel: 'City Harvest · food donor packet',
    sourceNote: 'Published guidance accepts prepared food from licensed food businesses. Pickups are generally Monday–Friday, 9 am–5 pm; a truck pickup requires at least 100 pounds. Category, packaging, and chilled-storage mapping are pilot assumptions—confirm directly before a real handoff.',
    snapshotDate: '2026-09-03',
    verificationStatus: 'public-profile',
  },
  {
    id: 'partner_new_york_common_pantry',
    slug: 'new-york-common-pantry',
    name: 'New York Common Pantry',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'],
    pickupStart: '08:00',
    pickupEnd: '17:00',
    address: '8 East 109 Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10029',
    ein: '13-3127972',
    websiteUrl: 'https://nycommonpantry.org/',
    policyUrl: 'https://nycommonpantry.org/wp-content/uploads/2025/11/Food-Donation-Q-and-A-updated-October-2025.pdf',
    registryUrl: 'https://projects.propublica.org/nonprofits/organizations/133127972',
    sourceLabel: 'New York Common Pantry · food donation Q&A',
    sourceNote: 'Published guidance accepts prepared and perishable food. Food-rescue pickups are listed as Monday–Friday, 8 am–5 pm; donations under 75 pounds are drop-off only. Category, packaging, and chilled-storage mapping are pilot assumptions—confirm directly before a real handoff.',
    snapshotDate: '2026-09-03',
    verificationStatus: 'public-profile',
  },
]

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

export function evaluatePartner(offer: OfferInput, partner: Partner): EligibilityReasonCode[] {
  const reasons: EligibilityReasonCode[] = []

  if (!partner.active) reasons.push('PARTNER_INACTIVE')
  if (!partner.acceptedCategories.includes(offer.mealCategory)) reasons.push('CATEGORY_NOT_ACCEPTED')
  if (partner.requiresSealedPackaging && !offer.sealed) reasons.push('SEALED_PACKAGING_REQUIRED')
  if (partner.requiresAllergenInformation && !offer.allergenInformationPresent) {
    reasons.push('ALLERGEN_INFORMATION_REQUIRED')
  }
  if (!partner.acceptedStorageModes.includes(offer.storageMode)) reasons.push('STORAGE_UNSUPPORTED')

  const windowsOverlap =
    minutes(offer.pickupStart) < minutes(partner.pickupEnd) &&
    minutes(offer.pickupEnd) > minutes(partner.pickupStart)
  if (!windowsOverlap) reasons.push('PICKUP_WINDOW_MISMATCH')

  if (typeof partner.capacityMeals === 'number' && offer.quantity > partner.capacityMeals) {
    reasons.push('CAPACITY_EXCEEDED')
  }

  return reasons
}

export function findEligiblePartners(
  offer: OfferInput,
  partners: Partner[] = PARTNERS,
): EligibilityResult {
  const results = partners.map((partner) => {
    const reasons = evaluatePartner(offer, partner)
    return {
      partner,
      reasons,
      explanations: reasons.map((reason) => REASON_EXPLANATIONS[reason]),
    }
  })

  return {
    eligible: results.filter((result) => result.reasons.length === 0),
    excluded: results.filter((result) => result.reasons.length > 0),
  }
}
