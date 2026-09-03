import { beforeEach, describe, expect, it } from 'vitest'
import { AppError, createDemoActions, DEFAULT_OFFER, getDemoSnapshot } from '../lib/demoStore'
import { PARTNERS } from '../domain/eligibility'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const memoryStorage = new MemoryStorage()
const eventTarget = new EventTarget()

Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage })
Object.defineProperty(globalThis, 'window', { value: eventTarget })

describe('demo workflow invariants', () => {
  beforeEach(() => memoryStorage.clear())

  it('allows only one offer per session unless the retry is identical', () => {
    const actions = createDemoActions('one-offer')
    const first = actions.createOffer(DEFAULT_OFFER)
    expect(actions.createOffer(DEFAULT_OFFER).id).toBe(first.id)

    expect(() => actions.createOffer({ ...DEFAULT_OFFER, quantity: 40 })).toThrowError(AppError)
  })

  it('allows only prepared → sent → accepted and keeps preparation non-terminal', () => {
    const sessionId = 'accept-flow'
    const actions = createDemoActions(sessionId)
    actions.createOffer(DEFAULT_OFFER)
    actions.prepareReservation(PARTNERS[0].id)

    expect(getDemoSnapshot(sessionId).reservation?.status).toBe('prepared')
    actions.sendReservation()
    actions.prepareResponse(getDemoSnapshot(sessionId).reservation!.id, 'accept')
    expect(getDemoSnapshot(sessionId).reservation).toMatchObject({ status: 'sent', responseDraft: 'accept' })
    actions.confirmResponse()
    expect(getDemoSnapshot(sessionId).reservation?.status).toBe('accepted')
  })

  it('rejects recipient preparation before the donor sends', () => {
    const actions = createDemoActions('invalid-transition')
    actions.createOffer(DEFAULT_OFFER)
    const reservation = actions.prepareReservation(PARTNERS[0].id)

    expect(() => actions.prepareResponse(reservation.id, 'accept')).toThrowError(AppError)
  })

  it('resets only the selected session', () => {
    const first = createDemoActions('first-session')
    const second = createDemoActions('second-session')
    first.createOffer(DEFAULT_OFFER)
    second.createOffer(DEFAULT_OFFER)

    first.reset()
    expect(getDemoSnapshot('first-session').offer).toBeNull()
    expect(getDemoSnapshot('second-session').offer).not.toBeNull()
  })
})
