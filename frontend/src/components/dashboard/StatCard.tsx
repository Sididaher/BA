interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'purple'
}

const palettes = {
  blue:   { wrap: 'bg-blue-50'   },
  green:  { wrap: 'bg-green-50'  },
  yellow: { wrap: 'bg-yellow-50' },
  purple: { wrap: 'bg-purple-50' },
}

export default function StatCard({
  label, value, icon, color = 'blue',
}: StatCardProps) {
  const { wrap } = palettes[color]

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${wrap}`}>
        {icon}
      </div>
      {/* Value + label */}
      <div>
        <p className="text-2xl font-bold text-text leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}
