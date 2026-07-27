import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy public discover URL — market feed owns discovery now. */
export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover · AgroLink" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/market" });
  },
  component: () => null,
});
