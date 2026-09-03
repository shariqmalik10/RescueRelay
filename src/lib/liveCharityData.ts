import { useCallback, useEffect, useState } from 'react'
import { PARTNERS } from '../domain/eligibility'

const API_ROOT = 'https://projects.propublica.org/nonprofits/api/v2/organizations'
const REQUEST_TIMEOUT_MS = 12_000

function liveProxyUrl() {
  const configured = import.meta.env.VITE_LIVE_DATA_PROXY_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim()
  if (convexUrl?.endsWith('.convex.cloud')) {
    return `${convexUrl.replace('.convex.cloud', '.convex.site')}/api/nonprofits`
  }
  return '/api/nonprofits'
}

interface NonprofitOrganization {
  ein?: number
  name?: string
  address?: string
  city?: string
  state?: string
  zipcode?: string
  strein?: string
  subseccd?: number
  subsection_code?: number
  ntee_code?: string
  updated?: string
  updated_at?: string
  tax_period?: string
}

interface NonprofitFiling {
  tax_prd?: number
  tax_prd_yr?: number
  totrevenue?: number
  totfuncexpns?: number
  updated?: string
}

export interface NonprofitApiResponse {
  organization?: NonprofitOrganization
  filings_with_data?: NonprofitFiling[]
  filings_without_data?: NonprofitFiling[]
  data_source?: string
  api_version?: number
}

export interface LiveCharityProfile {
  partnerId: string
  displayName: string
  legalName: string
  ein: string
  address: string
  city: string
  state: string
  postalCode: string
  taxStatus: string
  nteeCode: string
  registryUpdatedAt?: string
  latestFilingYear?: number
  latestRevenue?: number
  filingUpdatedAt?: string
  fetchedAt: number
  sourceUrl: string
  apiVersion?: number
}

export type LiveDataStatus = 'loading' | 'live' | 'partial' | 'error'

export interface LiveCharityData {
  status: LiveDataStatus
  profiles: Record<string, LiveCharityProfile>
  fetchedAt?: number
  error?: string
  refresh: () => void
}

function latestFiling(filings: NonprofitFiling[] = []) {
  return filings.reduce<NonprofitFiling | undefined>((latest, filing) => {
    const period = filing.tax_prd ?? filing.tax_prd_yr ?? 0
    const latestPeriod = latest?.tax_prd ?? latest?.tax_prd_yr ?? 0
    return period > latestPeriod ? filing : latest
  }, undefined)
}

export function parseNonprofitResponse(
  partnerId: string,
  displayName: string,
  response: NonprofitApiResponse,
  fetchedAt = Date.now(),
): LiveCharityProfile {
  const organization = response.organization
  const rawEin = organization?.strein ?? (organization?.ein ? String(organization.ein).padStart(9, '0') : '')
  if (!organization?.name || !rawEin) {
    throw new Error('The nonprofit registry returned an incomplete organization record.')
  }

  const formattedEin = rawEin.includes('-') ? rawEin : `${rawEin.slice(0, 2)}-${rawEin.slice(2)}`
  const filing = latestFiling(response.filings_with_data)
  const latestReportedFiling = latestFiling([
    ...(response.filings_with_data ?? []),
    ...(response.filings_without_data ?? []),
  ])
  const subsection = organization.subsection_code ?? organization.subseccd
  return {
    partnerId,
    displayName,
    legalName: organization.name,
    ein: formattedEin,
    address: organization.address ?? 'Address not listed',
    city: organization.city ?? 'City not listed',
    state: organization.state ?? '',
    postalCode: organization.zipcode ?? '',
    taxStatus: subsection ? `501(c)(${subsection})` : 'Tax-exempt organization',
    nteeCode: organization.ntee_code ?? 'Not classified',
    registryUpdatedAt: organization.updated_at ?? organization.updated,
    latestFilingYear: Math.max(
      latestReportedFiling?.tax_prd_yr ?? (latestReportedFiling?.tax_prd ? Math.floor(latestReportedFiling.tax_prd / 100) : 0),
      organization.tax_period ? Number(organization.tax_period.slice(0, 4)) : 0,
    ) || undefined,
    latestRevenue: filing?.totrevenue,
    filingUpdatedAt: filing?.updated,
    fetchedAt,
    sourceUrl: `${API_ROOT}/${formattedEin.replace('-', '')}.json`,
    apiVersion: response.api_version,
  }
}

async function loadLiveRecord(ein: string): Promise<NonprofitApiResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${liveProxyUrl()}?ein=${encodeURIComponent(ein)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`The live nonprofit registry returned ${response.status}.`)
    return await response.json() as NonprofitApiResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The live nonprofit registry took too long to respond.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

async function fetchLiveProfiles() {
  const requests = PARTNERS.map(async (partner) => {
    const ein = partner.ein?.replace('-', '')
    if (!ein) throw new Error(`${partner.name} is missing an EIN.`)
    const response = await loadLiveRecord(ein)
    return parseNonprofitResponse(partner.id, partner.name, response)
  })

  const results = await Promise.allSettled(requests)
  const profiles: Record<string, LiveCharityProfile> = {}
  const errors: string[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') profiles[result.value.partnerId] = result.value
    else errors.push(result.reason instanceof Error ? result.reason.message : 'A live source failed.')
  }

  return { profiles, errors, fetchedAt: Date.now() }
}

export function useLiveCharityData(): LiveCharityData {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<Omit<LiveCharityData, 'refresh'>>({
    status: 'loading',
    profiles: {},
  })

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setResult((current) => ({ ...current, status: 'loading', error: undefined }))
    void fetchLiveProfiles().then(({ profiles, errors, fetchedAt }) => {
      if (!active) return
      const count = Object.keys(profiles).length
      setResult({
        status: count === PARTNERS.length ? 'live' : count > 0 ? 'partial' : 'error',
        profiles,
        fetchedAt,
        error: errors.length ? 'Some live records did not load. Refresh the source or use the linked registry records.' : undefined,
      })
    })
    return () => {
      active = false
    }
  }, [revision])

  return { ...result, refresh }
}
