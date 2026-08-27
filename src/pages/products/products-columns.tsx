import type { ColumnDef } from "@tanstack/react-table"
import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { Eye, MoreVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import type { ProductSummaryApi } from "@/lib/types/catalog"
import { AppIcon } from "@/ui/app-icon"
import { StatusPill } from "@/ui/status-pill"
import { Checkbox } from "@/ui/checkbox"
import { CopyTextButton } from "@/ui/copy-text-button"
import { DataTableColumnHeader } from "@/ui/data-table/data-table-column-header"
import { TABLE_EMPTY_CELL, TableEmptyCell, tableTextOrEmpty } from "@/ui/data-table/table-empty-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip"

import { ProductCostInlineCell } from "./product-cost-inline-cell"
import { ProductPlatformLogoName } from "./product-platform-logo-name"
import { productsLinkingGroupPath } from "./products-inner-nav"
import { ProductStockAlertBadge } from "./product-stock-alert-ui"
import { ProductTableThumb } from "./product-table-thumb"

const META_SKU_COL = {
  headerClassName: "w-44 min-w-44 max-w-44",
  cellClassName: "w-44 min-w-44 max-w-44 overflow-hidden align-middle whitespace-normal",
} as const

const META_BRAND_COL = {
  headerClassName: "w-28 min-w-28 max-w-28",
  cellClassName: "w-28 min-w-28 max-w-28 overflow-hidden align-middle whitespace-normal",
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
  onGoDetail: (productId: string) => void
  selection: ProductTableSelectionBinding
  onOpenCostEditor?: (productId: string) => void
}

function statusPillVariant(status: string): ComponentProps<typeof StatusPill>['variant'] {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'archived':
      return 'info'
    case 'deleted':
      return 'error'
    default:
      return 'neutral'
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
    onGoDetail,
    selection,
    onOpenCostEditor,
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
          size="md"
          variant="accent"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("productsTableSelectRow")}
          checked={selection.isRowSelected(row.original.id)}
          onCheckedChange={(value) => selection.onRowToggle(row.original.id, !!value)}
          size="md"
          variant="accent"
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
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              to={`/dashboard/products/${rowData.id}`}
              className="line-clamp-2 min-w-0 break-words text-sm font-normal text-primary hover:underline"
              title={rowData.title}
            >
              {rowData.title}
            </Link>
            {rowData.link_group_id ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <StatusPill
                      variant="info"
                      className="size-4 min-h-4 min-w-4 p-0 [&>img]:size-2.5 [&>svg]:size-2.5"
                    >
                      <AppIcon name="integrations" colorize className="size-2.5" />
                      <span className="sr-only">{t('productsVinculacionLinkedBadge')}</span>
                    </StatusPill>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{t('productsVinculacionLinkedBadge')}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "internal_sku",
      meta: META_SKU_COL,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColSku")} />,
      cell: ({ row }) => {
        const rawSku = row.original.internal_sku
        const sku = tableTextOrEmpty(rawSku)
        const hasSku = sku !== TABLE_EMPTY_CELL
        if (!hasSku) return <TableEmptyCell />
        return (
          <div className="flex min-w-0 items-center gap-1">
            <span
              className="min-w-0 flex-1 truncate font-mono text-text-secondary"
              title={sku}
            >
              {sku}
            </span>
            {rawSku ? (
              <CopyTextButton
                text={rawSku.trim()}
                copiedLabel={t("productsCopyFeedback")}
                failedLabel={t("productsCopyFailed")}
                copyAriaLabel={t("productsTableCopySku")}
              />
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
          <StatusPill variant={statusPillVariant(st)}>{statusLabel(t, st)}</StatusPill>
        )
      },
      enableHiding: true,
    },
    {
      id: "platforms",
      accessorFn: (row) => row.platforms.join(","),
      header: () => t("productsColChannels"),
      cell: ({ row }) => {
        const plats = row.original.platforms
        if (!plats.length) {
          return <TableEmptyCell />
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
      accessorKey: "brand",
      meta: META_BRAND_COL,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("productsColBrand")} />,
      cell: ({ row }) => {
        const brand = tableTextOrEmpty(row.original.brand)
        if (brand === TABLE_EMPTY_CELL) return <TableEmptyCell />
        return (
          <span className="block truncate text-text-secondary" title={brand}>
            {brand}
          </span>
        )
      },
      enableHiding: true,
    },
    {
      accessorKey: "cost",
      meta: {
        headerClassName: "justify-end",
        cellClassName: "text-right",
      },
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
            readOnly={hasVariants || !onOpenCostEditor}
            readOnlyHint={hasVariants ? t("productsInlineCostVariantHint") : undefined}
            onOpenEditor={onOpenCostEditor}
            t={t}
          />
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
      id: 'link_group',
      accessorFn: (row) => row.link_group_title ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailHeaderStatGroupLabel')} />
      ),
      cell: ({ row }) => {
        const groupId = row.original.link_group_id
        if (!groupId) return <TableEmptyCell />
        const groupTitle =
          row.original.link_group_title?.trim() || t('productsVinculacionHubCrumb')
        return (
          <Link to={productsLinkingGroupPath(groupId)} className="max-w-[14rem]">
            <StatusPill variant="info" className="max-w-full">
              <AppIcon name="integrations" colorize className="size-3" />
              <span className="truncate">{groupTitle}</span>
            </StatusPill>
          </Link>
        )
      },
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("productsTableActions")}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onGoDetail(p.id)}>
                  <Eye className="h-4 w-4" aria-hidden />
                  <span>{t("productsTableViewDetail")}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
