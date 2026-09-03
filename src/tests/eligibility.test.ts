import { describe, expect, it } from 'vitest'
import { evaluatePartner, findEligiblePartners, PARTNERS, REASON_EXPLANATIONS } from '../domain/eligibility'
import { DEFAULT_OFFER } from '../lib/demoStore'
import type { EligibilityReasonCode, OfferInput, Partner } from '../domain/types'

const eligiblePartner = PARTNERS[0]

function expectOnlyReason(offer: OfferInput, partner: Partner, reason: EligibilityReasonCode) {
  expect(evaluatePartner(offer, partner)).toEqual([reason])
  expect(REASON_EXPLANATIONS[reason]).toBeTruthy()
}

describe('deterministic eligibility', () => {
  it('returns exactly one eligible partner and two explained exclusions for the fixed offer', () => {
    const result = findEligiblePartners(DEFAULT_OFFER)

    expect(result.eligible.map(({ partner }) => partner.slug)).toEqual(['bowery-mission'])
    expect(result.eligible[0].partner.verificationStatus).toBe('public-profile')
    expect(result.eligible[0].partner.ein).toBe('13-1617086')
    expect(result.eligible[0].partner.capacityMeals).toBeUndefined()
    expect(result.excluded).toHaveLength(2)
    expect(result.excluded[0].reasons).toEqual(['PICKUP_WINDOW_MISMATCH'])
    expect(result.excluded[1].reasons).toEqual(['PICKUP_WINDOW_MISMATCH'])
    expect(result.excluded.every(({ explanations }) => explanations.length > 0)).toBe(true)
  })

  it('checks partner activity', () => {
    expectOnlyReason(DEFAULT_OFFER, { ...eligiblePartner, active: false }, 'PARTNER_INACTIVE')
  })

  it('checks accepted category', () => {
    expectOnlyReason(DEFAULT_OFFER, { ...eligiblePartner, acceptedCategories: ['bakery'] }, 'CATEGORY_NOT_ACCEPTED')
  })

  it('checks sealed packaging', () => {
    expectOnlyReason({ ...DEFAULT_OFFER, sealed: false }, eligiblePartner, 'SEALED_PACKAGING_REQUIRED')
  })

  it('checks allergen information', () => {
    expectOnlyReason(
      { ...DEFAULT_OFFER, allergenInformationPresent: false },
      { ...eligiblePartner, requiresAllergenInformation: true },
      'ALLERGEN_INFORMATION_REQUIRED',
    )
  })

  it('checks storage support', () => {
    expectOnlyReason({ ...DEFAULT_OFFER, storageMode: 'hot' }, eligiblePartner, 'STORAGE_UNSUPPORTED')
  })

  it('checks pickup overlap', () => {
    expectOnlyReason(
      { ...DEFAULT_OFFER, pickupStart: '20:00', pickupEnd: '21:00' },
      eligiblePartner,
      'PICKUP_WINDOW_MISMATCH',
    )
  })

  it('checks capacity', () => {
    expectOnlyReason({ ...DEFAULT_OFFER, quantity: 61 }, { ...eligiblePartner, capacityMeals: 60 }, 'CAPACITY_EXCEEDED')
  })
})
