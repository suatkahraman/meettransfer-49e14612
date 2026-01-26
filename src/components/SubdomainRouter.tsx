/**
 * Subdomain Router Component
 * 
 * Detects if the app is accessed via a subdomain and routes accordingly.
 * Used for reservations.meettransfer.app to show standalone booking page.
 */

import { lazy, Suspense } from "react";

const StandaloneReservation = lazy(() => import("@/pages/StandaloneReservation"));

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center px-6">
      <div className="mx-auto animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  </div>
);

/**
 * Check if current hostname is the reservations subdomain
 */
export function isReservationsSubdomain(): boolean {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  
  // Check for reservations subdomain
  return (
    hostname === "reservations.meettransfer.app" ||
    hostname === "www.reservations.meettransfer.app" ||
    // Also support Lovable preview for testing
    hostname.includes("reservations") && hostname.includes("lovable")
  );
}

/**
 * Component that renders standalone reservation page for subdomain access
 */
export function SubdomainReservationPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StandaloneReservation />
    </Suspense>
  );
}
