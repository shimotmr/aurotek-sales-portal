'use client'

import { usePageTracking } from '@/lib/usePageTracking'

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  usePageTracking()
  return <>{children}</>
}
