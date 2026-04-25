import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl', '2xl': 'w-28 h-28 text-3xl' }

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name ?? ''} className={cn('rounded-full object-cover', sizes[size], className)} />
  }
  return (
    <div className={cn('rounded-full bg-primary-light text-primary font-bold flex items-center justify-center', sizes[size], className)}>
      {getInitials(name ?? null)}
    </div>
  )
}
