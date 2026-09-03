import type {
  EligibilityResult,
  Offer,
  OfferInput,
  Reservation,
  ResponseDraft,
} from '../domain/types'

export type ActionResult<T> = T | Promise<T>

export interface RescueActions {
  createOffer(input: OfferInput, actor?: 'donor' | 'agent'): ActionResult<Offer>
  findMatches(actor?: 'donor' | 'agent'): ActionResult<EligibilityResult>
  prepareReservation(partnerId: string, actor?: 'donor' | 'agent'): ActionResult<Reservation>
  sendReservation(): ActionResult<Reservation>
  getPendingOffer(actor?: 'recipient' | 'agent'): ActionResult<Reservation | null>
  prepareResponse(
    reservationId: string,
    response: ResponseDraft,
    actor?: 'recipient' | 'agent',
  ): ActionResult<Reservation>
  confirmResponse(): ActionResult<Reservation>
  reset(): ActionResult<void>
}
