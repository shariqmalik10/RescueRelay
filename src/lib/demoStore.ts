import { findEligiblePartners, PARTNERS } from '../domain/eligibility'
import type {
  AppErrorShape,
  DemoState,
  Offer,
  OfferInput,
  Reservation,
  ResponseDraft,
  ToolActivityRecord,
} from '../domain/types'

export const EMPTY_DEMO_STATE: DemoState = {
  offer: null,
  reservation: null,
  latestActivity: null,
  matchEvaluatedAt: undefined,
}

const eventName = (sessionId: string) => `rescuerelay:${sessionId}:change`
const storageKey = (sessionId: string) => `rescuerelay:${sessionId}`
const cache = new Map<string, { raw: string | null; state: DemoState }>()

export class AppError extends Error implements AppErrorShape {
  code: AppErrorShape['code']
  recovery: string

  constructor(code: AppErrorShape['code'], message: string, recovery: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.recovery = recovery
  }
}

function read(sessionId: string): DemoState {
  const raw = localStorage.getItem(storageKey(sessionId))
  const cached = cache.get(sessionId)
  if (cached?.raw === raw) return cached.state

  const state = raw ? (JSON.parse(raw) as DemoState) : EMPTY_DEMO_STATE
  cache.set(sessionId, { raw, state })
  return state
}

function write(sessionId: string, state: DemoState) {
  const raw = JSON.stringify(state)
  localStorage.setItem(storageKey(sessionId), raw)
  cache.set(sessionId, { raw, state })
  window.dispatchEvent(new Event(eventName(sessionId)))
}

function now() {
  return Date.now()
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

export const DEFAULT_OFFER: OfferInput = {
  mealCategory: 'vegetarian-prepared-meals',
  quantity: 36,
  sealed: true,
  allergenInformationPresent: true,
  allergens: ['dairy'],
  storageMode: 'chilled',
  pickupStart: '19:00',
  pickupEnd: '20:00',
  handlingDeclarationAccepted: true,
}

export function validateOffer(input: OfferInput) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 500) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Quantity must be a whole number between 1 and 500.',
      'Correct the quantity and try again.',
    )
  }
  if (input.pickupStart >= input.pickupEnd) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Pickup end must be later than pickup start.',
      'Correct the pickup window and try again.',
    )
  }
  if (!input.handlingDeclarationAccepted) {
    throw new AppError(
      'VALIDATION_ERROR',
      'The declared handling information must be acknowledged.',
      'Review and acknowledge the handling declaration.',
    )
  }
  if (input.allergenInformationPresent && input.allergens.length === 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'List at least one allergen when allergen information is present.',
      'Add the declared allergen or change the information selection.',
    )
  }
}

function sameOffer(offer: Offer, input: OfferInput) {
  return (
    offer.mealCategory === input.mealCategory &&
    offer.quantity === input.quantity &&
    offer.sealed === input.sealed &&
    offer.allergenInformationPresent === input.allergenInformationPresent &&
    JSON.stringify(offer.allergens) === JSON.stringify(input.allergens) &&
    offer.storageMode === input.storageMode &&
    offer.pickupStart === input.pickupStart &&
    offer.pickupEnd === input.pickupEnd &&
    offer.handlingDeclarationAccepted === input.handlingDeclarationAccepted
  )
}

export function subscribeToDemo(sessionId: string, listener: () => void) {
  const localEvent = eventName(sessionId)
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(sessionId)) listener()
  }
  window.addEventListener(localEvent, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(localEvent, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function getDemoSnapshot(sessionId: string) {
  return read(sessionId)
}

export function createDemoActions(sessionId: string) {
  const recordActivity = (activity: ToolActivityRecord) => {
    write(sessionId, { ...read(sessionId), latestActivity: activity })
  }

  return {
    createOffer(input: OfferInput, actor: 'donor' | 'agent' = 'donor') {
      validateOffer(input)
      const current = read(sessionId)
      if (current.offer) {
        if (sameOffer(current.offer, input)) return current.offer
        throw new AppError(
          'INVALID_STATE',
          'This demo session already has a different offer.',
          'Reset this session before creating another offer.',
        )
      }
      const offer: Offer = {
        ...input,
        id: id('offer'),
        donorName: 'Cedar Events',
        createdAt: now(),
      }
      write(sessionId, { ...current, offer })
      if (actor === 'agent') {
        recordActivity({
          toolName: 'create_surplus_offer',
          inputSummary: `${offer.quantity} sealed chilled vegetarian meals`,
          resultSummary: 'Offer prepared in the shared workspace',
          timestamp: now(),
        })
      }
      return offer
    },

    findMatches(actor: 'donor' | 'agent' = 'donor') {
      const current = read(sessionId)
      if (!current.offer) {
        throw new AppError('INVALID_STATE', 'There is no offer to match.', 'Create the offer first.')
      }
      const result = findEligiblePartners(current.offer)
      write(sessionId, { ...current, matchEvaluatedAt: now() })
      if (actor === 'agent') {
        recordActivity({
          toolName: 'find_eligible_partners',
          inputSummary: `Offer ${current.offer.id}`,
          resultSummary: `${result.eligible.length} eligible, ${result.excluded.length} excluded`,
          timestamp: now(),
        })
      }
      return result
    },

    prepareReservation(partnerId: string, actor: 'donor' | 'agent' = 'donor') {
      const current = read(sessionId)
      if (!current.offer) {
        throw new AppError('INVALID_STATE', 'There is no offer to reserve.', 'Create the offer first.')
      }
      const result = findEligiblePartners(current.offer)
      if (!result.eligible.some((match) => match.partner.id === partnerId)) {
        throw new AppError(
          'STALE_STATE',
          'The selected recipient is not eligible for this offer.',
          'Run matching again and select the eligible recipient.',
        )
      }
      if (current.reservation) {
        if (current.reservation.partnerId === partnerId) return current.reservation
        throw new AppError(
          'INVALID_STATE',
          'This offer already has a reservation.',
          'Continue with the current reservation or reset the demo.',
        )
      }
      const timestamp = now()
      const reservation: Reservation = {
        id: id('reservation'),
        offerId: current.offer.id,
        partnerId,
        status: 'prepared',
        events: [
          {
            type: 'prepared',
            actor,
            summary: 'Reservation prepared for human donor review.',
            timestamp,
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      write(sessionId, { ...current, reservation })
      if (actor === 'agent') {
        const partner = PARTNERS.find((item) => item.id === partnerId)!
        recordActivity({
          toolName: 'prepare_reservation',
          inputSummary: `${current.offer.quantity} meals for ${partner.name}`,
          resultSummary: 'Prepared only — donor confirmation still required',
          timestamp,
        })
      }
      return reservation
    },

    sendReservation() {
      const current = read(sessionId)
      if (!current.offer || !current.reservation || current.reservation.status !== 'prepared') {
        throw new AppError(
          'INVALID_STATE',
          'Only a prepared reservation can be sent.',
          'Prepare a reservation, then review it before sending.',
        )
      }
      const currentEligibility = findEligiblePartners(current.offer)
      if (!currentEligibility.eligible.some((match) => match.partner.id === current.reservation!.partnerId)) {
        throw new AppError(
          'STALE_STATE',
          'Eligibility changed before the reservation was sent.',
          'Run matching and prepare the reservation again.',
        )
      }
      const timestamp = now()
      const reservation: Reservation = {
        ...current.reservation,
        status: 'sent',
        updatedAt: timestamp,
        events: [
          ...current.reservation.events,
          { type: 'sent', actor: 'donor', summary: 'Donor confirmed and sent the reservation.', timestamp },
        ],
      }
      write(sessionId, { ...current, reservation })
      return reservation
    },

    getPendingOffer(actor: 'recipient' | 'agent' = 'recipient') {
      const current = read(sessionId)
      const pending = current.reservation?.status === 'sent' ? current.reservation : null
      if (actor === 'agent') {
        recordActivity({
          toolName: 'get_pending_offer',
          inputSummary: 'Current demo session',
          resultSummary: pending ? 'One sent reservation is ready to review' : 'No sent reservation',
          timestamp: now(),
        })
      }
      return pending
    },

    prepareResponse(reservationId: string, response: ResponseDraft, actor: 'recipient' | 'agent' = 'recipient') {
      const current = read(sessionId)
      if (!current.reservation || current.reservation.id !== reservationId || current.reservation.status !== 'sent') {
        throw new AppError(
          'INVALID_STATE',
          'Only the current sent reservation can receive a response draft.',
          'Reload the current session and review the sent reservation.',
        )
      }
      const timestamp = now()
      const reservation: Reservation = {
        ...current.reservation,
        responseDraft: response,
        updatedAt: timestamp,
        events: [
          ...current.reservation.events,
          {
            type: 'response_prepared',
            actor,
            summary: `${response === 'accept' ? 'Acceptance' : 'Decline'} prepared for human review.`,
            timestamp,
          },
        ],
      }
      write(sessionId, { ...current, reservation })
      if (actor === 'agent') {
        recordActivity({
          toolName: 'prepare_response',
          inputSummary: `${response} ${reservationId}`,
          resultSummary: 'Response drafted — recipient confirmation still required',
          timestamp,
        })
      }
      return reservation
    },

    confirmResponse() {
      const current = read(sessionId)
      if (!current.reservation || current.reservation.status !== 'sent' || !current.reservation.responseDraft) {
        throw new AppError(
          'INVALID_STATE',
          'A response must be prepared before it can be confirmed.',
          'Choose accept or decline, then review the exact outcome.',
        )
      }
      const timestamp = now()
      const status = current.reservation.responseDraft === 'accept' ? 'accepted' : 'declined'
      const reservation: Reservation = {
        ...current.reservation,
        status,
        updatedAt: timestamp,
        events: [
          ...current.reservation.events,
          {
            type: status,
            actor: 'recipient',
            summary: `Recipient confirmed the reservation as ${status}.`,
            timestamp,
          },
        ],
      }
      write(sessionId, { ...current, reservation })
      return reservation
    },

    reset() {
      localStorage.removeItem(storageKey(sessionId))
      cache.delete(sessionId)
      window.dispatchEvent(new Event(eventName(sessionId)))
    },
  }
}
