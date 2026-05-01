export type Stage = 'cold' | 'warm' | 'active' | 'hot' | 'won'

export type EngagementType =
  | 'welcome'
  | 'follow_up'
  | 're_engagement'
  | 'escalation'
  | 'agent_blast'
  | 'webinar_invite'
  | 'webinar_reminder'
  | 'webinar_followup'
  | 'no_show_followup'
  | 'content_drop'
  | 'monthly_review'

export type EngagementStatus =
  | 'drafted'
  | 'sent'
  | 'replied'
  | 'no_response'
  | 'bounced'

export interface Broker {
  id: string
  name: string
  brokerage: string
  email?: string
  phone?: string
  agent_count?: number
  stage: Stage
  tags: string[]
  notes: string
  next_action?: string
  next_action_date?: string
  created_at: string
}

export interface EngagementEntry {
  id: string
  date: string
  broker_name: string
  brokerage: string
  type: EngagementType
  ask: string
  status: EngagementStatus
  notes: string
}

export type SnippetCategory =
  | 'price_drop'
  | 'market_beat'
  | 'compliance'
  | 'fraud_prevention'
  | 'seasonal'
  | 'webinar'
  | 'general'

export interface Snippet {
  id: string
  title: string
  category: SnippetCategory
  body: string
  starred: boolean
  use_count: number
  created_at: string
}

export interface WebinarChecklist {
  reg_email_sent: boolean
  reminder_sent: boolean
  handout_sent: boolean
  attendee_followup_sent: boolean
  no_show_followup_sent: boolean
}

export interface Webinar {
  id: string
  title: string
  date: string
  brokerage_focus?: string
  registrants: number
  attendees: number
  notes: string
  checklist: WebinarChecklist
  created_at: string
}

export type DataSourceMode = 'demo' | 'local-storage' | 'folder'

export interface AppState {
  brokers: Broker[]
  log: EngagementEntry[]
  snippets: Snippet[]
  webinars: Webinar[]
  theme: 'light' | 'dark'
  dataSource: DataSourceMode
  folderName: string | null
}
