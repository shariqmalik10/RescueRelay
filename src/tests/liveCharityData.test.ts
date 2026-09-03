import { describe, expect, it } from 'vitest'
import { parseNonprofitResponse } from '../lib/liveCharityData'

describe('live nonprofit data', () => {
  it('parses the current ProPublica organization response shape', () => {
    const profile = parseNonprofitResponse('partner_city_harvest', 'City Harvest', {
      organization: {
        ein: 133170676,
        name: 'City Harvest Inc',
        address: '150 52ND ST',
        city: 'Brooklyn',
        state: 'NY',
        zipcode: '11232',
        subsection_code: 3,
        ntee_code: 'K30',
        updated_at: '2026-08-19T00:00:00Z',
      },
      filings_with_data: [{ tax_prd: 202406, tax_prd_yr: 2024, totrevenue: 210031724 }],
      filings_without_data: [{ tax_prd: 202506, tax_prd_yr: 2025 }],
      api_version: 2,
    }, 123)

    expect(profile.ein).toBe('13-3170676')
    expect(profile.taxStatus).toBe('501(c)(3)')
    expect(profile.latestFilingYear).toBe(2025)
    expect(profile.latestRevenue).toBe(210031724)
    expect(profile.fetchedAt).toBe(123)
  })

  it('rejects an incomplete live response instead of presenting it as verified', () => {
    expect(() => parseNonprofitResponse('partner', 'Partner', { organization: { name: 'Partner' } })).toThrow(
      'incomplete organization record',
    )
  })
})
