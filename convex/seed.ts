import { mutationGeneric } from 'convex/server'
import { v } from 'convex/values'
import { ensurePartners, PARTNER_FIXTURES } from './helpers'

export const seedPartners = mutationGeneric({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await ensurePartners(ctx)
    return PARTNER_FIXTURES.length
  },
})
