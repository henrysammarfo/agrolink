#!/usr/bin/env node
/**
 * Stress-test order lifecycle step ordering — no step should regress.
 * Run: node scripts/stress-order-flow.mjs
 */
import {
  assertMonotonicPipeline,
  getBuyerPipelineStep,
  getDeliverySetupSubstep,
  getPaymentTrackingStep,
  mockOrder,
  pipelineIndex,
} from "../src/lib/order-lifecycle.ts";
import { getFarmerStepId as farmerStep } from "../src/lib/farmer-order-flow.ts";

const results = [];
function pass(name, detail = "ok") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}: ${detail}`);
}

function testDeliverySetupSubsteps() {
  const cases = [
    { input: { fulfillmentMode: "farm_pickup", hasAddress: false, hasVehicle: false, hasQuote: false, driversForVehicle: 0 }, expect: "mode" },
    { input: { fulfillmentMode: "platform_delivery", hasAddress: false, hasVehicle: true, hasQuote: false, driversForVehicle: 0 }, expect: "address" },
    { input: { fulfillmentMode: "platform_delivery", hasAddress: true, hasVehicle: false, hasQuote: false, driversForVehicle: 0 }, expect: "vehicle" },
    { input: { fulfillmentMode: "platform_delivery", hasAddress: true, hasVehicle: true, hasQuote: false, driversForVehicle: 0 }, expect: "quote" },
    { input: { fulfillmentMode: "platform_delivery", hasAddress: true, hasVehicle: true, hasQuote: true, driversForVehicle: 3 }, expect: "drivers" },
  ];
  for (const c of cases) {
    const got = getDeliverySetupSubstep(c.input);
    if (got !== c.expect) return fail("Delivery setup substep", `${JSON.stringify(c.input)} → ${got}, want ${c.expect}`);
  }
  pass("Delivery setup substeps", `${cases.length} cases`);
}

function testPaymentTracking() {
  const seq = [
    getPaymentTrackingStep("pending"),
    getPaymentTrackingStep("pending"),
    getPaymentTrackingStep("paid"),
  ];
  if (seq[0] !== "pending" || seq[2] !== "confirmed") {
    return fail("Payment tracking", JSON.stringify(seq));
  }
  pass("Payment tracking", "pending → confirmed");
}

function testBuyerPipelineMonotonic() {
  const scenarios = [
    {
      name: "happy path platform delivery",
      states: [
        { status: "pending", payment_status: "pending" },
        { status: "pending", payment_status: "pending" },
        { status: "confirmed", payment_status: "paid", delivery: { status: "requested", driver_id: null } },
        { status: "confirmed", payment_status: "paid", delivery: { status: "requested", driver_id: null } },
        { status: "confirmed", payment_status: "paid", delivery: { status: "driver_assigned", driver_id: "d1" } },
        { status: "processing", payment_status: "paid", delivery: { status: "driver_assigned", driver_id: "d1" } },
        { status: "dispatched", payment_status: "paid", delivery: { status: "driver_enroute_pickup", driver_id: "d1" } },
        { status: "dispatched", payment_status: "paid", delivery: { status: "picked_up", driver_id: "d1" } },
        { status: "dispatched", payment_status: "paid", delivery: { status: "enroute_delivery", driver_id: "d1" } },
        { status: "delivered", payment_status: "paid", delivery: { status: "delivered", driver_id: "d1" } },
      ],
    },
    {
      name: "farmer prep before driver pickup",
      states: [
        { status: "confirmed", payment_status: "paid", delivery: { status: "requested", driver_id: null } },
        { status: "processing", payment_status: "paid", delivery: { status: "driver_assigned", driver_id: "d1" } },
        { status: "dispatched", payment_status: "paid", delivery: { status: "driver_enroute_pickup", driver_id: "d1" } },
      ],
    },
  ];

  for (const scenario of scenarios) {
    const steps = scenario.states.map((s) =>
      getBuyerPipelineStep(mockOrder(s)),
    );
    const check = assertMonotonicPipeline(steps);
    if (!check.ok) {
      return fail(
        `Buyer pipeline: ${scenario.name}`,
        `regression at ${check.at}: ${check.prev} → ${check.next} (indices ${pipelineIndex(check.prev)} → ${pipelineIndex(check.next)})`,
      );
    }
    pass(`Buyer pipeline: ${scenario.name}`, `${steps.length} transitions, ends at ${steps.at(-1)}`);
  }
}

function testFarmerPipelineMonotonic() {
  const states = [
    { status: "pending", payment_status: "pending" },
    { status: "pending", payment_status: "pending" },
    { status: "confirmed", payment_status: "paid" },
    { status: "processing", payment_status: "paid" },
    { status: "dispatched", payment_status: "paid", delivery: { status: "requested" } },
    { status: "dispatched", payment_status: "paid", delivery: { status: "driver_assigned", driver_id: "d1" } },
    { status: "dispatched", payment_status: "paid", delivery: { status: "driver_enroute_pickup", driver_id: "d1" } },
    { status: "dispatched", payment_status: "paid", delivery: { status: "picked_up", driver_id: "d1" } },
    { status: "dispatched", payment_status: "paid", delivery: { status: "enroute_delivery", driver_id: "d1" } },
    { status: "delivered", payment_status: "paid", delivery: { status: "delivered", driver_id: "d1" } },
  ];

  const FARMER_ORDER = ["payment", "accepted", "preparing", "ready", "driver", "transit", "done"];
  let lastIdx = -1;
  for (const s of states) {
    const step = farmerStep(mockOrder(s));
    const idx = FARMER_ORDER.indexOf(step);
    if (idx < lastIdx) {
      return fail("Farmer pipeline monotonic", `regression: ${FARMER_ORDER[lastIdx]} → ${step}`);
    }
    lastIdx = idx;
  }
  pass("Farmer pipeline monotonic", `${states.length} transitions, ends at ${FARMER_ORDER[lastIdx]}`);
}

function testNoSkipDispatchedToTransit() {
  const order = mockOrder({
    status: "dispatched",
    payment_status: "paid",
    delivery: { status: "requested", driver_id: null },
  });
  const step = getBuyerPipelineStep(order);
  if (step === "enroute" || step === "picked_up") {
    return fail("No skip ready→transit", `dispatched+requested should not be ${step}`);
  }
  if (step !== "ready") return fail("Ready step", `got ${step}`);
  pass("No skip ready→transit", "dispatched stays at ready until driver progresses");
}

function testPaymentBeforeDriverSearch() {
  const unpaid = getBuyerPipelineStep(mockOrder({ status: "pending", payment_status: "pending", delivery: { status: "requested" } }));
  const paid = getBuyerPipelineStep(mockOrder({ status: "confirmed", payment_status: "paid", delivery: { status: "requested" } }));
  if (pipelineIndex(unpaid) >= pipelineIndex("driver_search")) {
    return fail("Payment before driver search", `unpaid at ${unpaid}`);
  }
  if (paid !== "driver_search") return fail("Driver search after pay", `got ${paid}`);
  pass("Payment before driver search", `${unpaid} → ${paid}`);
}

function main() {
  console.log("AgroLink order flow stress test\n");
  testDeliverySetupSubsteps();
  testPaymentTracking();
  testBuyerPipelineMonotonic();
  testFarmerPipelineMonotonic();
  testNoSkipDispatchedToTransit();
  testPaymentBeforeDriverSearch();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main();
