import type { Metadata } from "next";
import { PlacementTestWorkspace } from "@/components/meditatii/PlacementTestWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = {
  title: "Test inițial meditații",
  robots: { index: false, follow: false },
};

export default function PlacementTestPage() {
  return (
    <RequireAuth>
      <PlacementTestWorkspace />
    </RequireAuth>
  );
}
