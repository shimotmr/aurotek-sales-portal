import {
  Bot, ClipboardList, Search, TrendingUp, Microscope,
  PenTool, Code2, Palette, CircleDot, Circle,
  BarChart3, Target, Package, Construction, FileText,
  Lightbulb, AlertTriangle, CheckCircle2, XCircle, Rocket
} from 'lucide-react'

export const AGENT_ICONS = {
  Bot, ClipboardList, Search, TrendingUp, Microscope,
  PenTool, Code2, Palette
} as const

export const PRIORITY_ICONS = {
  high: CircleDot,
  medium: CircleDot,
  low: CircleDot,
  none: Circle,
  // Legacy support
  P1: CircleDot,
  P2: CircleDot,
} as const

export const PRIORITY_COLORS = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
  none: 'text-gray-400',
  P1: 'text-red-500',
  P2: 'text-yellow-500',
} as const

export const COMMON_ICONS = {
  BarChart3, Target, Package, Construction, FileText,
  Lightbulb, AlertTriangle, CheckCircle2, XCircle, Rocket
} as const

// Icon wrapper component
interface IconProps {
  name: string
  size?: number
  className?: string
}

export function AgentIcon({ name, size = 16, className = '' }: IconProps) {
  const Icon = AGENT_ICONS[name as keyof typeof AGENT_ICONS]
  if (!Icon) return <span className={className}>{name}</span>
  return <Icon size={size} className={className} />
}

export function PriorityIcon({ name, size = 16, className = '' }: IconProps) {
  const Icon = PRIORITY_ICONS[name as keyof typeof PRIORITY_ICONS]
  const color = PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || 'text-gray-500'
  if (!Icon) return <span className={className}>{name}</span>
  return <Icon size={size} className={`${color} ${className}`} fill="currentColor" />
}

export function CommonIcon({ name, size = 16, className = '' }: IconProps) {
  const Icon = COMMON_ICONS[name as keyof typeof COMMON_ICONS]
  if (!Icon) return <span className={className}>{name}</span>
  return <Icon size={size} className={className} />
}
