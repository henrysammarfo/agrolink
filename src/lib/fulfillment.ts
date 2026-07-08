export type FulfillmentMode = "platform_delivery" | "farm_pickup" | "own_driver";

export const FULFILLMENT_OPTIONS: {
  value: FulfillmentMode;
  label: string;
  description: string;
}[] = [
  {
    value: "platform_delivery",
    label: "AgroLink delivery",
    description: "We match a nearby car, motor, or bicycle driver to pick up from the farm(s) and deliver to you.",
  },
  {
    value: "farm_pickup",
    label: "I'll pick up myself",
    description: "Pay for produce only — collect at the farmer's location. No driver fee.",
  },
  {
    value: "own_driver",
    label: "My driver will collect",
    description: "You arrange pickup (restaurant driver, staff, etc.). Produce is ready at the farm.",
  },
];
