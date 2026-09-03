import { mutationGeneric, queryGeneric } from 'convex/server'
import { v } from 'convex/values'
import {
  allEligibility,
  ensurePartners,
  fail,
  offerForSession,
  publicReservation,
  reservationForSession,
  stablePartnerId,
} from './helpers'
import { responseDraftValidator } from './validators'

const donorActorValidator = v.union(v.literal('donor'), v.literal('agent'))
const recipientActorValidator = v.union(v.literal('recipient'), v.literal('agent'))

export const findMatches = mutationGeneric({
  args: { demoSessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, { demoSessionId }) => {
    const offer = await offerForSession(ctx, demoSessionId)
    if (!offer) fail('INVALID_STATE', 'There is no offer to match.', 'Create the offer first.')
    await ensurePartners(ctx)
    const results = await allEligibility(ctx, offer)
    await ctx.db.patch(offer._id, { matchEvaluatedAt: Date.now() })
    const publicResults = results.map(({ publicPartner, reasons, explanations }) => ({
      partner: publicPartner,
      reasons,
      explanations,
    }))
    return {
      eligible: publicResults.filter((result) => result.reasons.length === 0),
      excluded: publicResults.filter((result) => result.reasons.length > 0),
    }
  },
})

export const prepare = mutationGeneric({
  args: {
    demoSessionId: v.string(),
    partnerId: v.string(),
    actor: donorActorValidator,
  },
  returns: v.any(),
  handler: async (ctx, { demoSessionId, partnerId, actor }) => {
    const offer = await offerForSession(ctx, demoSessionId)
    if (!offer) fail('INVALID_STATE', 'There is no offer to reserve.', 'Create the offer first.')
    await ensurePartners(ctx)
    const results = await allEligibility(ctx, offer)
    const selected = results.find(
      (result) => stablePartnerId(result.partner.slug) === partnerId && result.reasons.length === 0,
    )
    if (!selected) {
      fail(
        'STALE_STATE',
        'The selected recipient is not eligible for this offer.',
        'Run matching again and select the eligible recipient.',
      )
    }

    const current = await reservationForSession(ctx, demoSessionId)
    if (current) {
      if (String(current.partnerId) === String(selected.partner._id)) {
        return publicReservation(current, selected.partner)
      }
      fail(
        'INVALID_STATE',
        'This offer already has a reservation.',
        'Continue with the current reservation or reset the demo.',
      )
    }

    const timestamp = Date.now()
    const reservationId = await ctx.db.insert('reservations', {
      demoSessionId,
      offerId: offer._id,
      partnerId: selected.partner._id,
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
    })
    const reservation = await ctx.db.get(reservationId)
    return publicReservation(reservation, selected.partner)
  },
})

export const send = mutationGeneric({
  args: { demoSessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, { demoSessionId }) => {
    const offer = await offerForSession(ctx, demoSessionId)
    const reservation = await reservationForSession(ctx, demoSessionId)
    if (!offer || !reservation || reservation.status !== 'prepared') {
      fail(
        'INVALID_STATE',
        'Only a prepared reservation can be sent.',
        'Prepare a reservation, then review it before sending.',
      )
    }

    const results = await allEligibility(ctx, offer)
    const selected = results.find(
      (result) => String(result.partner._id) === String(reservation.partnerId) && result.reasons.length === 0,
    )
    if (!selected) {
      fail(
        'STALE_STATE',
        'Eligibility changed before the reservation was sent.',
        'Run matching and prepare the reservation again.',
      )
    }

    const timestamp = Date.now()
    const events = [
      ...reservation.events,
      { type: 'sent' as const, actor: 'donor' as const, summary: 'Donor confirmed and sent the reservation.', timestamp },
    ]
    await ctx.db.patch(reservation._id, { status: 'sent', events, updatedAt: timestamp })
    return publicReservation({ ...reservation, status: 'sent', events, updatedAt: timestamp }, selected.partner)
  },
})

export const getPending = queryGeneric({
  args: { demoSessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, { demoSessionId }) => {
    const reservation = await reservationForSession(ctx, demoSessionId)
    if (!reservation || reservation.status !== 'sent') return null
    const partner = await ctx.db.get(reservation.partnerId)
    return publicReservation(reservation, partner)
  },
})

export const prepareResponse = mutationGeneric({
  args: {
    demoSessionId: v.string(),
    reservationId: v.string(),
    response: responseDraftValidator,
    actor: recipientActorValidator,
  },
  returns: v.any(),
  handler: async (ctx, { demoSessionId, reservationId, response, actor }) => {
    const reservation = await reservationForSession(ctx, demoSessionId)
    if (!reservation || String(reservation._id) !== reservationId || reservation.status !== 'sent') {
      fail(
        'INVALID_STATE',
        'Only the current sent reservation can receive a response draft.',
        'Reload the current session and review the sent reservation.',
      )
    }

    const timestamp = Date.now()
    const events = [
      ...reservation.events,
      {
        type: 'response_prepared' as const,
        actor,
        summary: `${response === 'accept' ? 'Acceptance' : 'Decline'} prepared for human review.`,
        timestamp,
      },
    ]
    await ctx.db.patch(reservation._id, { responseDraft: response, events, updatedAt: timestamp })
    const partner = await ctx.db.get(reservation.partnerId)
    return publicReservation({ ...reservation, responseDraft: response, events, updatedAt: timestamp }, partner)
  },
})

export const confirmResponse = mutationGeneric({
  args: { demoSessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, { demoSessionId }) => {
    const reservation = await reservationForSession(ctx, demoSessionId)
    if (!reservation || reservation.status !== 'sent' || !reservation.responseDraft) {
      fail(
        'INVALID_STATE',
        'A response must be prepared before it can be confirmed.',
        'Choose accept or decline, then review the exact outcome.',
      )
    }

    const timestamp = Date.now()
    const status = reservation.responseDraft === 'accept' ? 'accepted' : 'declined'
    const events = [
      ...reservation.events,
      {
        type: status,
        actor: 'recipient' as const,
        summary: `Recipient confirmed the reservation as ${status}.`,
        timestamp,
      },
    ]
    await ctx.db.patch(reservation._id, { status, events, updatedAt: timestamp })
    const partner = await ctx.db.get(reservation.partnerId)
    return publicReservation({ ...reservation, status, events, updatedAt: timestamp }, partner)
  },
})
