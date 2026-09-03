import { useMemo, useSyncExternalStore } from 'react'
import { useConvex, useQuery } from 'convex/react'
import { makeFunctionReference } from 'convex/server'
import type { ConvexReactClient } from 'convex/react'
import type {
  DemoState,
  EligibilityResult,
  Offer,
  OfferInput,
  Reservation,
  ResponseDraft,
} from '../domain/types'
import type { RescueActions } from './actions'
import {
  clearToolActivity,
  getToolActivity,
  recordToolActivity,
  subscribeToToolActivity,
} from './activityStore'
import { AppError, EMPTY_DEMO_STATE } from './demoStore'

const sessionStateQuery = makeFunctionReference<
  'query',
  { demoSessionId: string },
  Omit<DemoState, 'latestActivity'>
>('offers:getSessionState')

const createOfferMutation = makeFunctionReference<
  'mutation',
  { demoSessionId: string; input: OfferInput },
  Offer
>('offers:create')

const resetMutation = makeFunctionReference<'mutation', { demoSessionId: string }, null>('offers:reset')
const findMatchesMutation = makeFunctionReference<
  'mutation',
  { demoSessionId: string },
  EligibilityResult
>('reservations:findMatches')
const prepareReservationMutation = makeFunctionReference<
  'mutation',
  { demoSessionId: string; partnerId: string; actor: 'donor' | 'agent' },
  Reservation
>('reservations:prepare')
const sendReservationMutation = makeFunctionReference<
  'mutation',
  { demoSessionId: string },
  Reservation
>('reservations:send')
const pendingOfferQuery = makeFunctionReference<
  'query',
  { demoSessionId: string },
  Reservation | null
>('reservations:getPending')
const prepareResponseMutation = makeFunctionReference<
  'mutation',
  {
    demoSessionId: string
    reservationId: string
    response: ResponseDraft
    actor: 'recipient' | 'agent'
  },
  Reservation
>('reservations:prepareResponse')
const confirmResponseMutation = makeFunctionReference<
  'mutation',
  { demoSessionId: string },
  Reservation
>('reservations:confirmResponse')

function asAppError(error: unknown): AppError {
  const data = (error as { data?: unknown })?.data
  if (data && typeof data === 'object') {
    const shape = data as { code?: unknown; message?: unknown; recovery?: unknown }
    if (
      (shape.code === 'VALIDATION_ERROR' || shape.code === 'STALE_STATE' || shape.code === 'INVALID_STATE') &&
      typeof shape.message === 'string' &&
      typeof shape.recovery === 'string'
    ) {
      return new AppError(shape.code, shape.message, shape.recovery)
    }
  }
  return new AppError(
    'INVALID_STATE',
    'The shared session could not complete that action.',
    'Check the connection and reload the current session.',
  )
}

async function remote<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation
  } catch (error) {
    throw asAppError(error)
  }
}

function createConvexActions(
  client: ConvexReactClient,
  demoSessionId: string,
): RescueActions {
  return {
    async createOffer(input, actor = 'donor') {
      const offer = await remote(client.mutation(createOfferMutation, { demoSessionId, input }))
      if (actor === 'agent') {
        recordToolActivity(demoSessionId, {
          toolName: 'create_surplus_offer',
          inputSummary: `${offer.quantity} sealed chilled vegetarian meals`,
          resultSummary: 'Offer prepared in the shared workspace',
          timestamp: Date.now(),
        })
      }
      return offer
    },

    async findMatches(actor = 'donor') {
      const result = await remote(client.mutation(findMatchesMutation, { demoSessionId }))
      if (actor === 'agent') {
        recordToolActivity(demoSessionId, {
          toolName: 'find_eligible_partners',
          inputSummary: 'Current session offer',
          resultSummary: `${result.eligible.length} eligible, ${result.excluded.length} excluded`,
          timestamp: Date.now(),
        })
      }
      return result
    },

    async prepareReservation(partnerId, actor = 'donor') {
      const reservation = await remote(
        client.mutation(prepareReservationMutation, { demoSessionId, partnerId, actor }),
      )
      if (actor === 'agent') {
        recordToolActivity(demoSessionId, {
          toolName: 'prepare_reservation',
          inputSummary: `Eligible recipient ${partnerId}`,
          resultSummary: 'Prepared only — donor confirmation still required',
          timestamp: Date.now(),
        })
      }
      return reservation
    },

    sendReservation() {
      return remote(client.mutation(sendReservationMutation, { demoSessionId }))
    },

    async getPendingOffer(actor = 'recipient') {
      const reservation = await remote(client.query(pendingOfferQuery, { demoSessionId }))
      if (actor === 'agent') {
        recordToolActivity(demoSessionId, {
          toolName: 'get_pending_offer',
          inputSummary: 'Current demo session',
          resultSummary: reservation ? 'One sent reservation is ready to review' : 'No sent reservation',
          timestamp: Date.now(),
        })
      }
      return reservation
    },

    async prepareResponse(reservationId, response, actor = 'recipient') {
      const reservation = await remote(
        client.mutation(prepareResponseMutation, {
          demoSessionId,
          reservationId,
          response,
          actor,
        }),
      )
      if (actor === 'agent') {
        recordToolActivity(demoSessionId, {
          toolName: 'prepare_response',
          inputSummary: `${response} ${reservationId}`,
          resultSummary: 'Response drafted — recipient confirmation still required',
          timestamp: Date.now(),
        })
      }
      return reservation
    },

    confirmResponse() {
      return remote(client.mutation(confirmResponseMutation, { demoSessionId }))
    },

    async reset() {
      await remote(client.mutation(resetMutation, { demoSessionId }))
      clearToolActivity(demoSessionId)
    },
  }
}

export function useConvexBackend(sessionId: string) {
  const client = useConvex()
  const remoteState = useQuery(sessionStateQuery, { demoSessionId: sessionId })
  const activity = useSyncExternalStore(
    (listener) => subscribeToToolActivity(sessionId, listener),
    () => getToolActivity(sessionId),
  )
  const actions = useMemo(() => createConvexActions(client, sessionId), [client, sessionId])
  const state = useMemo<DemoState>(
    () => ({ ...(remoteState ?? EMPTY_DEMO_STATE), latestActivity: activity }),
    [activity, remoteState],
  )

  return { state, actions, loading: remoteState === undefined }
}
