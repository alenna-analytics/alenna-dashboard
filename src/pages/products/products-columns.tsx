import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import type { ProductSummaryApi } from "@/lib/types/catalog"
import { fmtCurrency } from "@/pages/reports/reports-ui-helpers"
import { Checkbox } from "@/ui/checkbox"
import { DataTableColumnHeader } from "@/ui/data-table/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

import { ProductTableThumb } from "./product-table-thumb"

export type ProductTableColumnLabels = {
  t: (key: ShellStringKey) => string
  baseCurrency: string
  watchedIds: ReadonlySet<string>
  onToggleWatch: (productId: string) => void
  onCopySku: (sku: string | null) => void
  onRefresh: () => void
  onGoDetail: (productId: string) => void
}

function formatPlatformLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function statusPillClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
    case "inactive":
      return "bg-muted text-muted-foreground"
    case "archived":
      return "bg-sky-500/15 text-sky-950 dark:text-sky-100"
    case "deleted":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function statusLabel(t: (key: ShellStringKey) => string, status: string): string {
  switch (status) {
    case "active":
      return t("productsStatusActive")
    case "inactive":
      return t("productsStatusInactive")
    case "archived":
      return t("productsStatusArchived")
    case "deleted":
      return t("productsStatusDeleted")
    default:
      return status
  }
}

export function createProductColumns(labels: ProductTableColumnLabels): ColumnDef<ProductSummaryApi>[] {
  const { t, baseCurrency, watchedIds, onToggleWatch, onCopySku, onRefresh, onGoDetail } = labels

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("productsTableSelectAll")}
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("productsTableSelectRow")}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "image",
      accessorFn: (row) => row.image_url,
      header: () => <span className="text-text-secondary">{t("productsColImage")}</span>,
      cell: ({ row }) => <ProductTableThumb url={row.original.image_url} alt={row.original.title} />,
      enableSorting: false,
      enableHiding: true,
      size: 52,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColProduct")} />,
      cell: ({ row }) => {
        const rowData = row.original
        return (
          <div className="flex max-w-[min(20rem,50vw)] flex-wrap items-center gap-2">
            <Link
              to={`/dashboard/products/${rowData.id}`}
              className="font-medium text-primary hover:underline"
            >
              {rowData.title}
            </Link>
            {rowData.cost_missing ? (
              <span className="inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                {t("productsCostMissingBadge")}
              </span>
            ) : null}
          </div>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColStatus")} />,
      cell: ({ row }) => {
        const st = row.original.status
        return (
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              statusPillClass(st),
            )}
          >
            {statusLabel(t, st)}
          </span>
        )
      },
      enableHiding: true,
    },
    {
      id: "platforms",
      accessorFn: (row) => row.platforms.join(","),
      header: () => <span className="text-text-secondary">{t("productsColChannels")}</span>,
      cell: ({ row }) => {
        const plats = row.original.platforms
        if (!plats.length) {
          return <span className="text-xs text-text-tertiary">—</span>
        }
        return (
          <div className="flex max-w-[14rem] flex-wrap gap-1">
            {plats.map((p) => (
              <span
                key={p}
                className="inline-flex rounded-md border border-border-subtle bg-bg-elevated px-2 py-0.5 text-[11px] font-medium text-text-secondary"
              >
                {formatPlatformLabel(p)}
              </span>
            ))}
          </div>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "brand",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColBrand")} />,
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.brand?.trim() || "—"}</span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <DataTableColumnHeader className="justify-end" column={column} title={t("productsColCost")} />
      ),
      cell: ({ row }) => {
        const c = row.original.cost
        return (
          <span className="block text-right tabular-nums">
            {c != null ? fmtCurrency(c, baseCurrency) : "—"}
          </span>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "internal_sku",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColSku")} />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-secondary">{row.original.internal_sku ?? "—"}</span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "listing_count",
      header: ({ column }) => (
        <DataTableColumnHeader className="justify-end" column={column} title={t("productsColListings")} />
      ),
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.listing_count}</span>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsTableColCreated")} />,
      cell: ({ row }) => (
        <span className="text-xs text-text-secondary">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original
        const watched = watchedIds.has(p.id)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none",
                "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
              )}
              aria-label={t("productsTableActions")}
            >
              <MoreHorizontal className="size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("productsTableActions")}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onGoDetail(p.id)}>{t("productsTableViewDetail")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopySku(p.internal_sku)}>{t("productsTableCopySku")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleWatch(p.id)}>
                  {watched ? t("productsTableWatchRemove") : t("productsTableWatchAdd")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRefresh()}>{t("productsTableRefresh")}</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
