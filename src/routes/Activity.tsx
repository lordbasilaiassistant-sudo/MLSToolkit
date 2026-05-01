import { useMemo } from 'react'
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Line, ComposedChart, PieChart, Pie, Cell, Legend } from 'recharts'
import { AlertTriangle, Mail, MessageSquareReply, Activity as ActivityIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ENGAGEMENT_TYPE_LABELS, STATUS_COLORS, STAGE_COLORS, STAGE_LABELS } from '@/lib/constants'
import { weeksAgo, formatRelative, daysSince, cn } from '@/lib/utils'

export function Activity() {
  const log = useStore(s => s.log)
  const brokers = useStore(s => s.brokers)

  const weeklySeries = useMemo(() => {
    const buckets: Array<{ week: string; sent: number; replied: number; reply_rate: number }> = []
    for (let i = 11; i >= 0; i--) {
      const start = weeksAgo(i)
      const end = weeksAgo(i - 1)
      const inWeek = log.filter(e => {
        const d = new Date(e.date)
        return d >= start && d < end
      })
      const sent = inWeek.length
      const replied = inWeek.filter(e => e.status === 'replied').length
      buckets.push({
        week: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sent,
        replied,
        reply_rate: sent ? Math.round((replied / sent) * 100) : 0,
      })
    }
    return buckets
  }, [log])

  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of log) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([type, count]) => ({ name: ENGAGEMENT_TYPE_LABELS[type as keyof typeof ENGAGEMENT_TYPE_LABELS] ?? type, count }))
      .sort((a, b) => b.count - a.count)
  }, [log])

  const totalSent = log.length
  const totalReplied = log.filter(e => e.status === 'replied').length
  const replyRate = totalSent ? Math.round((totalReplied / totalSent) * 100) : 0

  const goingCold = useMemo(() => {
    const lastTouch = new Map<string, string>()
    for (const e of log) {
      const k = e.broker_name + '|' + e.brokerage
      const prev = lastTouch.get(k)
      if (!prev || e.date > prev) lastTouch.set(k, e.date)
    }
    return brokers
      .filter(b => ['active', 'hot', 'won'].includes(b.stage))
      .map(b => {
        const last = lastTouch.get(b.name + '|' + b.brokerage)
        return { broker: b, last, days: daysSince(last) ?? 999 }
      })
      .filter(x => x.days >= 21)
      .sort((a, b) => b.days - a.days)
  }, [log, brokers])

  const recent = useMemo(() => {
    return [...log].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50)
  }, [log])

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4']

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold leading-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">{totalSent} touchpoints · {totalReplied} replies · {replyRate}% reply rate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI icon={<Mail className="h-4 w-4" />} label="Touchpoints (all-time)" value={totalSent.toString()} hint={`${weeklySeries[weeklySeries.length - 1]?.sent ?? 0} this week`} />
        <KPI icon={<MessageSquareReply className="h-4 w-4" />} label="Replies" value={totalReplied.toString()} hint={`${replyRate}% reply rate`} />
        <KPI icon={<ActivityIcon className="h-4 w-4" />} label="Active brokers" value={brokers.filter(b => ['active','hot'].includes(b.stage)).length.toString()} hint={`${brokers.length} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Last 12 weeks</CardTitle>
            <CardDescription>Sent vs replies, plus reply rate %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklySeries}>
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="sent" fill="#3b82f6" name="Sent" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="left" dataKey="replied" fill="#10b981" name="Replied" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="reply_rate" stroke="#f59e0b" strokeWidth={2} name="Reply %" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Touchpoint mix</CardTitle>
            <CardDescription>Where your effort goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {goingCold.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Going cold ({goingCold.length})
            </CardTitle>
            <CardDescription>Active/Hot/Won brokers with no touchpoint in 21+ days. Re-engage before they drift further.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {goingCold.slice(0, 8).map(({ broker, days }) => (
                <li key={broker.id} className="flex items-center gap-2 text-sm">
                  <Badge className={cn(STAGE_COLORS[broker.stage].bg, STAGE_COLORS[broker.stage].text, 'shrink-0')}>{STAGE_LABELS[broker.stage]}</Badge>
                  <span className="font-medium truncate">{broker.name}</span>
                  <span className="text-muted-foreground truncate">· {broker.brokerage}</span>
                  <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 shrink-0">{days}d quiet</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent touchpoints</CardTitle>
          <CardDescription>Latest 50 entries from your engagement log</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">No engagement entries yet. Open a broker and log your first touchpoint.</p>
          ) : (
            <ol className="space-y-1">
              {recent.map(entry => (
                <li key={entry.id} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-20 shrink-0 pt-1 tabular-nums">{formatRelative(entry.date)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium">{entry.broker_name}</span>
                      <span className="text-muted-foreground text-xs">{entry.brokerage}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <Badge className="bg-secondary text-foreground text-[10px]">{ENGAGEMENT_TYPE_LABELS[entry.type]}</Badge>
                      <Badge className={cn(STATUS_COLORS[entry.status], 'text-[10px]')}>{entry.status}</Badge>
                      {entry.ask && <span className="text-xs text-muted-foreground">→ {entry.ask}</span>}
                    </div>
                    {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entry.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPI({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  )
}
