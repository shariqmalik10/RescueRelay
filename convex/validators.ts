import { v } from 'convex/values'

export const storageModeValidator = v.union(
  v.literal('chilled'),
  v.literal('hot'),
  v.literal('ambient'),
)

export const responseDraftValidator = v.union(v.literal('accept'), v.literal('decline'))

export const reservationActorValidator = v.union(
  v.literal('donor'),
  v.literal('recipient'),
  v.literal('agent'),
  v.literal('system'),
)

export const eventTypeValidator = v.union(
  v.literal('prepared'),
  v.literal('sent'),
  v.literal('response_prepared'),
  v.literal('accepted'),
  v.literal('declined'),
)

export const reservationEventValidator = v.object({
  type: eventTypeValidator,
  actor: reservationActorValidator,
  summary: v.string(),
  timestamp: v.number(),
})

export const offerInputValidator = v.object({
  mealCategory: v.string(),
  quantity: v.number(),
  sealed: v.boolean(),
  allergenInformationPresent: v.boolean(),
  allergens: v.array(v.string()),
  storageMode: storageModeValidator,
  pickupStart: v.string(),
  pickupEnd: v.string(),
  handlingDeclarationAccepted: v.boolean(),
})
