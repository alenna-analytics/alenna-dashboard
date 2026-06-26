import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

export type PageBreadcrumbItem = {
  label: string
  to?: string
}

type PageBreadcrumbProps = {
  items: PageBreadcrumbItem[]
  className?: string
  ariaLabel?: string
}

export function PageBreadcrumb({ items, className, ariaLabel = 'Breadcrumb' }: PageBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label={ariaLabel} className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li
              key={`${item.label}-${i}`}
              className={cn(
                'flex min-w-0 items-center gap-1.5',
                isLast ? 'min-w-0 flex-1 overflow-hidden' : 'shrink-0',
              )}
            >
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate font-medium text-text-secondary transition-colors hover:text-text-primary"
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'min-w-0 truncate font-medium',
                    isLast ? 'text-text-primary' : 'text-text-secondary',
                  )}
                  title={item.label}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
