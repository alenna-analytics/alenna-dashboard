import type { ColumnDef } from "@tanstack/react-table"
import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { MoreVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import type { ProductSummaryApi } from "@/lib/types/catalog"
import { Badge } from "@/ui/badge"
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

import { ProductCostInlineCell } from "./product-cost-inline-cell"
import { ProductPlatformLogoName } from "./product-platform-logo-name"
import { ProductStockAlertBadge } from "./product-stock-alert-ui"
import { ProductTableThumb } from "./product-table-thumb"

const EMPTY_CELL = "—"

function tableTextOrEmpty(raw: string | null | undefined): string {
  const s = raw?.trim() ?? ""
  if (!s) return EMPTY_CELL
  if (/^\p{Pd}+$/u.test(s)) return EMPTY_CELL
  return s
}

/** Same width for Marca + SKU so both columns line up. */
const META_BRAND_SKU_COL = {
  headerClassName: "w-44 min-w-44 max-w-44",
  cellClassName: "w-44 min-w-44 max-w-44 overflow-hidden align-middle whitespace-normal",
} as const

export type ProductTableSelectionBinding = {
  headerChecked: boolean
  headerIndeterminate: boolean
  onHeaderToggle: (checked: boolean) => void
  isRowSelected: (productId: string) => boolean
  onRowToggle: (productId: string, checked: boolean) => void
}

export type ProductTableColumnLabels = {
  t: (key: ShellStringKey) => string
  /** Format an amount that is denominated in `tenant.base_currency`. */
  formatBaseMoney: (value: number) => string
  onCopySku: (sku: string | null) => void
  onGoDetail: (productId: string) => void
  selection: ProductTableSelectionBinding
  activeEditProductId: string | null
  onEditActivate: (productId: string) => void
  onEditDeactivate: () => void
  onSaveCost: (productId: string, cost: number) => Promise<void>
  saveCostPending: boolean
}

function statusBadgeVariant(status: string): ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "active":
      return "success"
    case "inactive":
      return "secondary"
    case "archived":
      return "info"
    case "deleted":
      return "error"
    default:
      return "secondary"
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
  const {
    t,
    formatBaseMoney,
    onCopySku,
    onGoDetail,
    selection,
    activeEditProductId,
    onEditActivate,
    onEditDeactivate,
    onSaveCost,
    saveCostPending,
  } = labels

  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          aria-label={t("productsTableSelectAll")}
          checked={selection.headerIndeterminate ? false : selection.headerChecked}
          indeterminate={selection.headerIndeterminate}
          onCheckedChange={selection.onHeaderToggle}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("productsTableSelectRow")}
          checked={selection.isRowSelected(row.original.id)}
          onCheckedChange={(value) => selection.onRowToggle(row.original.id, !!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "image",
      accessorFn: (row) => row.image_url,
      header: () => t("productsColImage"),
      cell: ({ row }) => <ProductTableThumb url={row.original.image_url} alt={row.original.title} />,
      enableSorting: false,
      enableHiding: true,
      size: 52,
    },
    {
      accessorKey: "title",
      meta: {
        headerClassName: "min-w-[17rem] max-w-[min(30rem,42vw)]",
        cellClassName:
          "min-w-[17rem] max-w-[min(30rem,42vw)] overflow-hidden align-middle whitespace-normal",
      },
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColProduct")} />,
      cell: ({ row }) => {
        const rowData = row.original
        return (
          <Link
            to={`/dashboard/products/${rowData.id}`}
            className="line-clamp-2 max-w-full break-words text-sm font-normal text-primary hover:underline"
            title={rowData.title}
          >
            {rowData.title}
          </Link>
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
          <Badge variant={statusBadgeVariant(st)}>{statusLabel(t, st)}</Badge>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "stock_alert",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("productsDetailListingColAlert")} />
      ),
      cell: ({ row }) => (
        <ProductStockAlertBadge level={row.original.stock_alert ?? "none"} t={t} />
      ),
      enableHiding: true,
    },
    {
      id: "platforms",
      accessorFn: (row) => row.platforms.join(","),
      header: () => t("productsColChannels"),
      cell: ({ row }) => {
        const plats = row.original.platforms
        if (!plats.length) {
          return <span className="text-text-tertiary">{EMPTY_CELL}</span>
        }
        return (
          <div className="flex max-w-[16rem] flex-col gap-1.5">
            {plats.map((p) => (
              <ProductPlatformLogoName
                key={p}
                platformSlug={p}
                t={t}
              />
            ))}
          </div>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "brand",
      meta: META_BRAND_SKU_COL,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColBrand")} />,
      cell: ({ row }) => {
        const b = tableTextOrEmpty(row.original.brand)
        return (
          <span className="block truncate text-text-secondary" title={b === EMPTY_CELL ? undefined : b}>
            {b}
          </span>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <DataTableColumnHeader className="justify-end" column={column} title={t("productsColCost")} />
      ),
      cell: ({ row }) => {
        const rowData = row.original
        const label = rowData.internal_sku?.trim() || rowData.title
        const hasVariants = (rowData.variant_count ?? 0) > 0
        return (
          <ProductCostInlineCell
            productId={rowData.id}
            label={label}
            cost={rowData.cost}
            costMissing={rowData.cost_missing}
            formatMoney={formatBaseMoney}
            readOnly={hasVariants}
            readOnlyHint={hasVariants ? t("productsInlineCostVariantHint") : undefined}
            isActive={activeEditProductId === rowData.id}
            onActivate={onEditActivate}
            onDeactivate={onEditDeactivate}
            onSave={onSaveCost}
            isSaving={saveCostPending && activeEditProductId === rowData.id}
            t={t}
          />
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "internal_sku",
      meta: META_BRAND_SKU_COL,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColSku")} />,
      cell: ({ row }) => {
        const sku = tableTextOrEmpty(row.original.internal_sku)
        return (
          <span
            className="block max-w-full truncate font-mono text-text-secondary"
            title={sku === EMPTY_CELL ? undefined : sku}
          >
            {sku}
          </span>
        )
      },
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
        <span className="text-text-secondary">
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none",
                "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
              )}
              aria-label={t("productsTableActions")}
            >
              <MoreVertical className="size-4 shrink-0" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("productsTableActions")}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onGoDetail(p.id)}>{t("productsTableViewDetail")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopySku(p.internal_sku)}>{t("productsTableCopySku")}</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
