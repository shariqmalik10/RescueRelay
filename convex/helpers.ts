import { ConvexError } from 'convex/values'

export const PARTNER_FIXTURES = [
  {
    slug: 'bowery-mission',
    name: 'The Bowery Mission',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'] as const,
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
    verificationStatus: 'public-profile' as const,
  },
  {
    slug: 'city-harvest',
    name: 'City Harvest',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'] as const,
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
    verificationStatus: 'public-profile' as const,
  },
  {
    slug: 'new-york-common-pantry',
    name: 'New York Common Pantry',
    active: true,
    acceptedCategories: ['vegetarian-prepared-meals'],
    requiresSealedPackaging: true,
    requiresAllergenInformation: false,
    acceptedStorageModes: ['chilled'] as const,
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
    verificationStatus: 'public-profile' as const,
  },
] as const

export const REASON_EXPLANATIONS = {
  PARTNER_INACTIVE: 'This partner is not currently active in the rescue network.',
  CATEGORY_NOT_ACCEPTED: 'This partner does not accept this meal category.',
  SEALED_PACKAGING_REQUIRED: 'This partner requires sealed meal packaging.',
  ALLERGEN_INFORMATION_REQUIRED: 'This partner requires allergen information to be present.',
  STORAGE_UNSUPPORTED: 'This partner cannot support the declared storage condition.',
  PICKUP_WINDOW_MISMATCH: 'The proposed pickup window does not overlap this partner’s hours.',
  CAPACITY_EXCEEDED: 'The meal quantity exceeds this partner’s declared demo capacity.',
} as const

type ErrorCode = 'VALIDATION_ERROR' | 'STALE_STATE' | 'INVALID_STATE'
type StorageMode = 'chilled' | 'hot' | 'ambient'
type ReasonCode = keyof typeof REASON_EXPLANATIONS

interface EligibilityRow {
  partner: any
  publicPartner: ReturnType<typeof publicPartner>
  reasons: ReasonCode[]
  explanations: string[]
}

export function fail(code: ErrorCode, message: string, recovery: string): never {
  throw new ConvexError({ code, message, recovery })
}

export function stablePartnerId(slug: string) {
  return `partner_${slug.replaceAll('-', '_')}`
}

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

export function validateOffer(input: {
  quantity: number
  pickupStart: string
  pickupEnd: string
  handlingDeclarationAccepted: boolean
  allergenInformationPresent: boolean
  allergens: string[]
}) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 500) {
    fail('VALIDATION_ERROR', 'Quantity must be a whole number between 1 and 500.', 'Correct the quantity and try again.')
  }
  if (input.pickupStart >= input.pickupEnd) {
    fail('VALIDATION_ERROR', 'Pickup end must be later than pickup start.', 'Correct the pickup window and try again.')
  }
  if (!input.handlingDeclarationAccepted) {
    fail('VALIDATION_ERROR', 'The declared handling information must be acknowledged.', 'Review and acknowledge the handling declaration.')
  }
  if (input.allergenInformationPresent && input.allergens.length === 0) {
    fail('VALIDATION_ERROR', 'List at least one allergen when allergen information is present.', 'Add the declared allergen or change the information selection.')
  }
}

export function evaluatePartner(
  offer: {
    mealCategory: string
    quantity: number
    sealed: boolean
    allergenInformationPresent: boolean
    storageMode: StorageMode
    pickupStart: string
    pickupEnd: string
  },
  partner: {
    active: boolean
    acceptedCategories: string[]
    requiresSealedPackaging: boolean
    requiresAllergenInformation: boolean
    acceptedStorageModes: StorageMode[]
    pickupStart: string
    pickupEnd: string
    capacityMeals?: number
  },
): ReasonCode[] {
  const reasons: ReasonCode[] = []
  if (!partner.active) reasons.push('PARTNER_INACTIVE')
  if (!partner.acceptedCategories.includes(offer.mealCategory)) reasons.push('CATEGORY_NOT_ACCEPTED')
  if (partner.requiresSealedPackaging && !offer.sealed) reasons.push('SEALED_PACKAGING_REQUIRED')
  if (partner.requiresAllergenInformation && !offer.allergenInformationPresent) reasons.push('ALLERGEN_INFORMATION_REQUIRED')
  if (!partner.acceptedStorageModes.includes(offer.storageMode)) reasons.push('STORAGE_UNSUPPORTED')
  if (!(minutes(offer.pickupStart) < minutes(partner.pickupEnd) && minutes(offer.pickupEnd) > minutes(partner.pickupStart))) {
    reasons.push('PICKUP_WINDOW_MISMATCH')
  }
  if (typeof partner.capacityMeals === 'number' && offer.quantity > partner.capacityMeals) {
    reasons.push('CAPACITY_EXCEEDED')
  }
  return reasons
}

export function publicPartner(partner: any) {
  return {
    id: stablePartnerId(partner.slug),
    slug: partner.slug,
    name: partner.name,
    active: partner.active,
    acceptedCategories: partner.acceptedCategories,
    requiresSealedPackaging: partner.requiresSealedPackaging,
    requiresAllergenInformation: partner.requiresAllergenInformation,
    acceptedStorageModes: partner.acceptedStorageModes,
    pickupStart: partner.pickupStart,
    pickupEnd: partner.pickupEnd,
    capacityMeals: partner.capacityMeals,
    address: partner.address,
    city: partner.city,
    state: partner.state,
    postalCode: partner.postalCode,
    ein: partner.ein,
    websiteUrl: partner.websiteUrl,
    policyUrl: partner.policyUrl,
    registryUrl: partner.registryUrl,
    sourceLabel: partner.sourceLabel,
    sourceNote: partner.sourceNote,
    snapshotDate: partner.snapshotDate,
    verificationStatus: partner.verificationStatus,
  }
}

export function publicOffer(offer: any) {
  return {
    id: String(offer._id),
    donorName: 'Cedar Events',
    mealCategory: offer.mealCategory,
    quantity: offer.quantity,
    sealed: offer.sealed,
    allergenInformationPresent: offer.allergenInformationPresent,
    allergens: offer.allergens,
    storageMode: offer.storageMode,
    pickupStart: offer.pickupStart,
    pickupEnd: offer.pickupEnd,
    handlingDeclarationAccepted: offer.handlingDeclarationAccepted,
    createdAt: offer.createdAt,
  }
}

export function publicReservation(reservation: any, partner?: any) {
  return {
    id: String(reservation._id),
    offerId: String(reservation.offerId),
    partnerId: partner ? stablePartnerId(partner.slug) : String(reservation.partnerId),
    status: reservation.status,
    responseDraft: reservation.responseDraft,
    events: reservation.events,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  }
}

export async function ensurePartners(ctx: any) {
  for (const fixture of PARTNER_FIXTURES) {
    const current = await ctx.db
      .query('partners')
      .withIndex('by_slug', (query: any) => query.eq('slug', fixture.slug))
      .first()
    const document = { ...fixture, acceptedStorageModes: [...fixture.acceptedStorageModes] }
    if (current) await ctx.db.patch(current._id, document)
    else await ctx.db.insert('partners', document)
  }
}

export async function offerForSession(ctx: any, demoSessionId: string) {
  return ctx.db
    .query('offers')
    .withIndex('by_demo_session', (query: any) => query.eq('demoSessionId', demoSessionId))
    .first()
}

export async function reservationForSession(ctx: any, demoSessionId: string) {
  return ctx.db
    .query('reservations')
    .withIndex('by_demo_session', (query: any) => query.eq('demoSessionId', demoSessionId))
    .first()
}

export async function allEligibility(ctx: any, offer: any): Promise<EligibilityRow[]> {
  const partners = (await ctx.db.query('partners').collect()) as any[]
  return partners.map((partner: any) => {
    const reasons = evaluatePartner(offer, partner)
    return {
      partner,
      publicPartner: publicPartner(partner),
      reasons,
      explanations: reasons.map((reason) => REASON_EXPLANATIONS[reason]),
    }
  })
}
