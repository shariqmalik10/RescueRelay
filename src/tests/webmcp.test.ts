import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RescueActions } from '../lib/actions'
import {
  HUMAN_ONLY_TOOL_NAMES,
  registerRoleTools,
  ROLE_TOOL_NAMES,
} from '../lib/webmcp'

const actions = {
  createOffer: vi.fn(),
  findMatches: vi.fn(() => ({ eligible: [], excluded: [] })),
  prepareReservation: vi.fn(),
  sendReservation: vi.fn(),
  getPendingOffer: vi.fn(() => null),
  prepareResponse: vi.fn(),
  confirmResponse: vi.fn(),
  reset: vi.fn(),
} as unknown as RescueActions

function installModelContext(registerTool: ModelContext['registerTool']) {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { modelContext: { registerTool } },
  })
}

afterEach(() => {
  vi.clearAllMocks()
  Reflect.deleteProperty(globalThis, 'document')
})

describe('WebMCP capability proof', () => {
  it('registers exactly the donor tools and excludes final commitment actions', async () => {
    const registered: WebMcpTool[] = []
    const registerTool = vi.fn(async (tool: WebMcpTool, _options?: { signal?: AbortSignal }) => { registered.push(tool) })
    const controller = new AbortController()
    installModelContext(registerTool)

    const report = await registerRoleTools('donor', actions, controller.signal)

    expect(report.status).toBe('supported')
    expect(report.apiDetected).toBe(true)
    expect(report.registeredTools).toEqual(ROLE_TOOL_NAMES.donor)
    expect(report.humanOnlyActionsExcluded).toBe(true)
    expect(registered.map((tool) => tool.name)).toEqual(ROLE_TOOL_NAMES.donor)
    expect(registered.some((tool) => HUMAN_ONLY_TOOL_NAMES.includes(tool.name as never))).toBe(false)
    expect(registerTool).toHaveBeenCalledTimes(3)
    expect(registerTool.mock.calls.every(([, options]) => options?.signal === controller.signal)).toBe(true)

    await registered.find((tool) => tool.name === 'find_eligible_partners')!.execute({ offerId: 'offer_test' })
    expect(actions.findMatches).toHaveBeenCalledWith('agent')
  })

  it('switches to the exact recipient tool set', async () => {
    const registered: WebMcpTool[] = []
    installModelContext(vi.fn(async (tool) => { registered.push(tool) }))

    const report = await registerRoleTools('recipient', actions, new AbortController().signal)

    expect(report.status).toBe('supported')
    expect(report.registeredTools).toEqual(ROLE_TOOL_NAMES.recipient)
    expect(registered.map((tool) => tool.name)).toEqual(ROLE_TOOL_NAMES.recipient)
  })

  it('reports unsupported browsers without claiming registration', async () => {
    Object.defineProperty(globalThis, 'document', { configurable: true, value: {} })

    const report = await registerRoleTools('donor', actions, new AbortController().signal)

    expect(report).toMatchObject({
      status: 'unsupported',
      apiDetected: false,
      registeredTools: [],
      humanOnlyActionsExcluded: true,
    })
  })

  it('reports a registration error instead of showing a false live state', async () => {
    installModelContext(vi.fn(async () => { throw new Error('registration failed') }))

    const report = await registerRoleTools('donor', actions, new AbortController().signal)

    expect(report.status).toBe('error')
    expect(report.apiDetected).toBe(true)
    expect(report.registeredTools).toEqual([])
    expect(report.error).toContain('could not be registered')
  })
})
