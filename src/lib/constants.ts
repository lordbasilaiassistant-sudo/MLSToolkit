import type { Stage, EngagementType, EngagementStatus, SnippetCategory } from './types'

export const STAGES: Stage[] = ['cold', 'warm', 'active', 'hot', 'won']

export const STAGE_LABELS: Record<Stage, string> = {
  cold: 'Cold',
  warm: 'Warm',
  active: 'Active',
  hot: 'Hot',
  won: 'Won',
}

export const STAGE_COLORS: Record<Stage, { bg: string; text: string; ring: string; bar: string }> = {
  cold:   { bg: 'bg-slate-500/10',  text: 'text-slate-600 dark:text-slate-300',   ring: 'ring-slate-500/30',  bar: 'bg-slate-500'  },
  warm:   { bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-300',   ring: 'ring-amber-500/30',  bar: 'bg-amber-500'  },
  active: { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-300',     ring: 'ring-blue-500/30',   bar: 'bg-blue-500'   },
  hot:    { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-300',       ring: 'ring-red-500/30',    bar: 'bg-red-500'    },
  won:    { bg: 'bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-300',ring: 'ring-emerald-500/30',bar: 'bg-emerald-500'},
}

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  cold: 'No contact in 60+ days or never engaged',
  warm: 'Recent contact, exploring fit',
  active: 'Regular touchpoints, evaluating',
  hot: 'Decision pending, needs close',
  won: 'Onboarded broker — maintain relationship',
}

export const ENGAGEMENT_TYPES: EngagementType[] = [
  'welcome',
  'follow_up',
  're_engagement',
  'escalation',
  'agent_blast',
  'webinar_invite',
  'webinar_reminder',
  'webinar_followup',
  'no_show_followup',
  'content_drop',
  'monthly_review',
]

export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, string> = {
  welcome: 'Welcome',
  follow_up: 'Follow-up',
  re_engagement: 'Re-engagement',
  escalation: 'Escalation',
  agent_blast: 'Agent blast',
  webinar_invite: 'Webinar invite',
  webinar_reminder: 'Webinar reminder',
  webinar_followup: 'Webinar follow-up',
  no_show_followup: 'No-show follow-up',
  content_drop: 'Content drop',
  monthly_review: 'Monthly review',
}

export const ENGAGEMENT_STATUSES: EngagementStatus[] = [
  'drafted',
  'sent',
  'replied',
  'no_response',
  'bounced',
]

export const STATUS_COLORS: Record<EngagementStatus, string> = {
  drafted: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
  sent: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  replied: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  no_response: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  bounced: 'bg-red-500/15 text-red-600 dark:text-red-300',
}

export const SNIPPET_CATEGORIES: SnippetCategory[] = [
  'price_drop',
  'market_beat',
  'compliance',
  'fraud_prevention',
  'seasonal',
  'webinar',
  'general',
]

export const SNIPPET_CATEGORY_LABELS: Record<SnippetCategory, string> = {
  price_drop: 'Price drop',
  market_beat: 'Market beat',
  compliance: 'Compliance',
  fraud_prevention: 'Fraud prevention',
  seasonal: 'Seasonal',
  webinar: 'Webinar',
  general: 'General',
}

export const STORAGE_KEYS = {
  state: 'mlstoolkit:state:v1',
  theme: 'mlstoolkit:theme',
  dataSource: 'mlstoolkit:dataSource',
} as const

export const STALENESS_DAYS = {
  fresh: 7,
  warm: 21,
} as const
