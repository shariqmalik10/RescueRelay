export type Role = 'donor' | 'recipient'
export type StorageMode = 'chilled' | 'hot' | 'ambient'
export type ReservationStatus = 'prepared' | 'sent' | 'accepted' | 'declined'
export type ResponseDraft = 'accept' | 'decline'

export interface OfferInput {
  mealCategory: string
  quantity: number
  sealed: boolean
  allergenInformationPresent: boolean
  allergens: string[]
  storageMode: StorageMode
  pickupStart: string
  pickupEnd: string
  handlingDeclarationAccepted: boolean
}

export interface Offer extends OfferInput {
  id: string
  donorName: string
  createdAt: number
}

export interface Partner {
  id: string
  slug: string
  name: string
  active: boolean
  acceptedCategories: string[]
  requiresSealedPackaging: boolean
  requiresAllergenInformation: boolean
  acceptedStorageModes: StorageMode[]
  pickupStart: string
  pickupEnd: string
  /** A declared capacity is optional because public profiles rarely publish live intake capacity. */
  capacityMeals?: number
  address?: string
  city?: string
  state?: string
  postalCode?: string
  ein?: string
  websiteUrl?: string
  policyUrl?: string
  registryUrl?: string
  sourceLabel?: string
  sourceNote?: string
  snapshotDate?: string
  verificationStatus?: 'public-profile' | 'partner-confirmed'
}

export type EligibilityReasonCode =
  | 'PARTNER_INACTIVE'
  | 'CATEGORY_NOT_ACCEPTED'
  | 'SEALED_PACKAGING_REQUIRED'
  | 'ALLERGEN_INFORMATION_REQUIRED'
  | 'STORAGE_UNSUPPORTED'
  | 'PICKUP_WINDOW_MISMATCH'
  | 'CAPACITY_EXCEEDED'

export interface PartnerMatch {
  partner: Partner
  reasons: EligibilityReasonCode[]
  explanations: string[]
}

export interface EligibilityResult {
  eligible: PartnerMatch[]
  excluded: PartnerMatch[]
}

export interface ReservationEvent {
  type: 'prepared' | 'sent' | 'response_prepared' | 'accepted' | 'declined'
  actor: 'donor' | 'recipient' | 'agent' | 'system'
  summary: string
  timestamp: number
}

export interface Reservation {
  id: string
  offerId: string
  partnerId: string
  status: ReservationStatus
  responseDraft?: ResponseDraft
  events: ReservationEvent[]
  createdAt: number
  updatedAt: number
}

export interface ToolActivityRecord {
  toolName: string
  inputSummary: string
  resultSummary: string
  timestamp: number
}

export interface DemoState {
  offer: Offer | null
  reservation: Reservation | null
  latestActivity: ToolActivityRecord | null
  matchEvaluatedAt?: number
}

export interface AppErrorShape {
  code: 'VALIDATION_ERROR' | 'STALE_STATE' | 'INVALID_STATE'
  message: string
  recovery: string
}
