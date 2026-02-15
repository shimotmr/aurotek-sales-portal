'use client'

import { usePathname } from 'next/navigation'

import AppShell from './AppShell'

interface LayoutWrapperProps {
  children: React.ReactNode
}

// Pages that should NOT have AppShell
const EXCLUDED_PATHS = ['/', '/login']

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // Check if current path should be excluded
  const shouldExclude = EXCLUDED_PATHS.some(path => pathname === path)
  
  if (shouldExclude) {
    return <>{children}</>
  }
  
  return <AppShell>{children}</AppShell>
}
