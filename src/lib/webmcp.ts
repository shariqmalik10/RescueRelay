import type { OfferInput, ResponseDraft, Role } from '../domain/types'
import type { RescueActions } from './actions'
import { AppError } from './demoStore'

export type WebMcpStatus = 'checking' | 'supported' | 'unsupported' | 'error'

export const ROLE_TOOL_NAMES = {
  donor: ['create_surplus_offer', 'find_eligible_partners', 'prepare_reservation'],
  recipient: ['get_pending_offer', 'prepare_response'],
} as const satisfies Record<Role, readonly string[]>

export const HUMAN_ONLY_TOOL_NAMES = ['send_reservation', 'confirm_response'] as const

export interface WebMcpReport {
  status: WebMcpStatus
  role: Role
  apiDetected: boolean
  expectedTools: readonly string[]
  registeredTools: string[]
  humanOnlyActionsExcluded: boolean
  checkedAt?: number
  error?: string
}

export function checkingWebMcpReport(role: Role): WebMcpReport {
  return {
    status: 'checking',
    role,
    apiDetected: false,
    expectedTools: ROLE_TOOL_NAMES[role],
    registeredTools: [],
    humanOnlyActionsExcluded: true,
  }
}

const objectSchema = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})

const offerSchema = objectSchema(
  {
    mealCategory: { type: 'string', enum: ['vegetarian-prepared-meals'] },
    quantity: { type: 'integer', minimum: 1, maximum: 500 },
    sealed: { type: 'boolean' },
    allergenInformationPresent: { type: 'boolean' },
    allergens: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 10 },
    storageMode: { type: 'string', enum: ['chilled', 'hot', 'ambient'] },
    pickupStart: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
    pickupEnd: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
    handlingDeclarationAccepted: { type: 'boolean' },
  },
  [
    'mealCategory',
    'quantity',
    'sealed',
    'allergenInformationPresent',
    'allergens',
    'storageMode',
    'pickupStart',
    'pickupEnd',
    'handlingDeclarationAccepted',
  ],
)

async function safeToolResult(run: () => unknown | Promise<unknown>) {
  try {
    return { ok: true, result: await run() }
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ok: false,
        error: { code: error.code, message: error.message, recovery: error.recovery },
      }
    }
    return {
      ok: false,
      error: {
        code: 'INVALID_STATE',
        message: 'The requested action could not be completed.',
        recovery: 'Reload the current state and try again.',
      },
    }
  }
}

function donorTools(actions: RescueActions): WebMcpTool[] {
  return [
    {
      name: 'create_surplus_offer',
      title: 'Create surplus offer',
      description:
        'Create the current session’s structured surplus-meal offer from declared handling facts. This does not create a reservation.',
      inputSchema: offerSchema,
      execute: (input) => safeToolResult(() => actions.createOffer(input as unknown as OfferInput, 'agent')),
    },
    {
      name: 'find_eligible_partners',
      title: 'Find eligible partners',
      description:
        'Run the deterministic eligibility checks against three New York City public charity profiles and return every fit or constraint mismatch with reasons.',
      inputSchema: objectSchema({ offerId: { type: 'string', minLength: 1, maxLength: 80 } }, ['offerId']),
      annotations: { readOnlyHint: true },
      execute: () => safeToolResult(() => actions.findMatches('agent')),
    },
    {
      name: 'prepare_reservation',
      title: 'Prepare reservation',
      description:
        'Prepare an exact simulated reservation for an eligible public charity profile. This does not contact or send anything to the charity; donor confirmation remains required in the page.',
      inputSchema: objectSchema(
        {
          offerId: { type: 'string', minLength: 1, maxLength: 80 },
          partnerId: { type: 'string', minLength: 1, maxLength: 80 },
        },
        ['offerId', 'partnerId'],
      ),
      execute: (input) => safeToolResult(() => actions.prepareReservation(String(input.partnerId), 'agent')),
    },
  ]
}

function recipientTools(actions: RescueActions): WebMcpTool[] {
  return [
    {
      name: 'get_pending_offer',
      title: 'Get pending offer',
      description: 'Return the current session’s sent reservation and declared handling facts, or an empty result.',
      inputSchema: objectSchema({}),
      annotations: { readOnlyHint: true },
      execute: () => safeToolResult(() => actions.getPendingOffer('agent')),
    },
    {
      name: 'prepare_response',
      title: 'Prepare response',
      description:
        'Store an accept or decline response draft for human recipient review. This never finalizes the response.',
      inputSchema: objectSchema(
        {
          reservationId: { type: 'string', minLength: 1, maxLength: 80 },
          response: { type: 'string', enum: ['accept', 'decline'] },
        },
        ['reservationId', 'response'],
      ),
      execute: (input) =>
        safeToolResult(() =>
          actions.prepareResponse(
            String(input.reservationId),
            String(input.response) as ResponseDraft,
            'agent',
          ),
        ),
    },
  ]
}

export async function registerRoleTools(
  role: Role,
  actions: RescueActions,
  signal: AbortSignal,
): Promise<WebMcpReport> {
  const report = checkingWebMcpReport(role)
  const modelContext = typeof document === 'undefined' ? undefined : document.modelContext
  if (!modelContext) {
    return {
      ...report,
      status: 'unsupported',
      checkedAt: Date.now(),
    }
  }

  const tools = role === 'donor' ? donorTools(actions) : recipientTools(actions)
  const humanOnlyActionsExcluded = tools.every(
    (tool) => !HUMAN_ONLY_TOOL_NAMES.includes(tool.name as typeof HUMAN_ONLY_TOOL_NAMES[number]),
  )
  try {
    const registeredTools = await Promise.all(
      tools.map(async (tool) => {
        await modelContext.registerTool(tool, { signal })
        return tool.name
      }),
    )
    return {
      ...report,
      status: 'supported',
      apiDetected: true,
      registeredTools,
      humanOnlyActionsExcluded,
      checkedAt: Date.now(),
    }
  } catch {
    return {
      ...report,
      status: 'error',
      apiDetected: true,
      humanOnlyActionsExcluded,
      checkedAt: Date.now(),
      error: 'The browser exposed WebMCP, but one or more tools could not be registered.',
    }
  }
}
