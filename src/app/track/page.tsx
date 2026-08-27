import { Suspense } from "react";
import { Tracker } from "@/components/tracker";

export const metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <main id="main" className="track-page section-shell">
      <Suspense fallback={<div className="tracking-placeholder">Loading tracker…</div>}>
        <Tracker />
      </Suspense>
    </main>
  );
}
