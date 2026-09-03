import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'
import {
  ensurePartners,
  fail,
  offerForSession,
  publicOffer,
  publicReservation,
  reservationForSession,
  validateOffer,
} from './helpers'
import { offerInputValidator } from './validators'

function sameOffer(offer: any, input: any) {
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

export const create = mutationGeneric({
  args: {
    demoSessionId: v.string(),
    input: offerInputValidator,
  },
  returns: v.any(),
  handler: async (ctx, { demoSessionId, input }) => {
    validateOffer(input)
    await ensurePartners(ctx)
    const current = await offerForSession(ctx, demoSessionId)
    if (current) {
      if (sameOffer(current, input)) return publicOffer(current)
      fail(
        'INVALID_STATE',
        'This demo session already has a different offer.',
        'Reset this session before creating another offer.',
      )
    }

    const createdAt = Date.now()
    const offerId = await ctx.db.insert('offers', {
      demoSessionId,
      ...input,
      createdAt,
    })
    const offer = await ctx.db.get(offerId)
    return publicOffer(offer)
  },
})

export const getSessionState = queryGeneric({
  args: { demoSessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, { demoSessionId }) => {
    const offer = await offerForSession(ctx, demoSessionId)
    const reservation = await reservationForSession(ctx, demoSessionId)
    const partner = reservation ? await ctx.db.get(reservation.partnerId) : null
    return {
      offer: offer ? publicOffer(offer) : null,
      reservation: reservation ? publicReservation(reservation, partner) : null,
      matchEvaluatedAt: offer?.matchEvaluatedAt,
    }
  },
})

export const reset = mutationGeneric({
  args: { demoSessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, { demoSessionId }) => {
    const reservations = await ctx.db
      .query('reservations')
      .withIndex('by_demo_session', (query) => query.eq('demoSessionId', demoSessionId))
      .collect()
    for (const reservation of reservations) await ctx.db.delete(reservation._id)

    const offers = await ctx.db
      .query('offers')
      .withIndex('by_demo_session', (query) => query.eq('demoSessionId', demoSessionId))
      .collect()
    for (const offer of offers) await ctx.db.delete(offer._id)
    return null
  },
})
