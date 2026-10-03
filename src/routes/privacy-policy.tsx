import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage, policyHead } from "@/components/site/PolicyPage";
import { legalQuery } from "@/lib/use-legal";

export const Route = createFileRoute("/privacy-policy")({
  head: () => policyHead("Privacy Policy", "How ThePoshakCo collects, uses and protects your personal information."),
  loader: ({ context }) => context.queryClient.ensureQueryData(legalQuery).catch(() => null),
  errorComponent: () => <p className="p-20 text-center">Could not load this policy. Please refresh.</p>,
  notFoundComponent: () => <p className="p-20 text-center">Policy not found.</p>,
  component: () => <PolicyPage slug="privacy-policy" />,
});
