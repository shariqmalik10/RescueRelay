import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import {
  reservationEventValidator,
  responseDraftValidator,
  storageModeValidator,
} from './validators'

export default defineSchema({
  partners: defineTable({
    slug: v.string(),
    name: v.string(),
    active: v.boolean(),
    acceptedCategories: v.array(v.string()),
    requiresSealedPackaging: v.boolean(),
    requiresAllergenInformation: v.boolean(),
    acceptedStorageModes: v.array(storageModeValidator),
    pickupStart: v.string(),
    pickupEnd: v.string(),
    capacityMeals: v.optional(v.number()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    ein: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    policyUrl: v.optional(v.string()),
    registryUrl: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    sourceNote: v.optional(v.string()),
    snapshotDate: v.optional(v.string()),
    verificationStatus: v.optional(v.union(v.literal('public-profile'), v.literal('partner-confirmed'))),
  }).index('by_slug', ['slug']),

  offers: defineTable({
    demoSessionId: v.string(),
    mealCategory: v.string(),
    quantity: v.number(),
    sealed: v.boolean(),
    allergenInformationPresent: v.boolean(),
    allergens: v.array(v.string()),
    storageMode: storageModeValidator,
    pickupStart: v.string(),
    pickupEnd: v.string(),
    handlingDeclarationAccepted: v.boolean(),
    matchEvaluatedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_demo_session', ['demoSessionId']),

  reservations: defineTable({
    demoSessionId: v.string(),
    offerId: v.id('offers'),
    partnerId: v.id('partners'),
    status: v.union(
      v.literal('prepared'),
      v.literal('sent'),
      v.literal('accepted'),
      v.literal('declined'),
    ),
    responseDraft: v.optional(responseDraftValidator),
    events: v.array(reservationEventValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_demo_session', ['demoSessionId'])
    .index('by_offer', ['offerId']),
})
