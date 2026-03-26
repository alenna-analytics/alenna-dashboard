# Dashboard metrics: source and calculation

This document describes how each dashboard visualization gets its numbers: **computed in the API from stored aggregates**, **computed in the browser from API series**, or **layout-only transforms** (no new business logic).

## API foundations

- **`GET /analytics/summary`** — For the selected date range (and optional platform / product filters), the API loads daily metric rows, sums them into one `KpiSummary`, repeats for the **previous period** of equal length, and returns current values, previous values, and `%` deltas (`app/application/use_cases/get_summary.py`, `app/domain/services/aggregate.py`).

- **`GET /analytics/daily`** — Same filters plus `granularity` (`daily` | `weekly` | `monthly`). Rows are **bucketed by period**; each bucket is summarized with the same `compute_summary` logic as the summary endpoint (`bucket_by_period` in `aggregate.py`).

### KPIs computed in the API (summary and each series point)

| Field | Definition (aggregates) |
| --- | --- |
| `gross_revenue`, `net_revenue`, `gross_profit`, `cogs`, `total_cogs`, `channel_commission`, `shipping_cost`, `ads_spend`, `ebitda`, `order_count`, `units_sold` | Sum of the corresponding fields over all daily rows in the bucket (or full range for summary). |
| `margin_pct` | `100 * gross_profit / net_revenue` when `net_revenue ≠ 0`, else `0` (`_safe_pct`). |
| `avg_order_value` | `net_revenue / order_count` when `order_count > 0`, else `0`. |
| `ebitda` | `gross_profit - max(ads_spend, 0)`, capped so it does not exceed `gross_profit` when gross profit is non-negative (`_compute_ebitda` in `aggregate.py`). |

The dashboard does **not** recompute these formulas for summary or daily points; it displays API values (with display currency conversion — see below).

## Per visualization

### Top metric cards (KPI tiles)

- **Source:** `summary.current` and `summary.deltas` from `/analytics/summary`.
- **Calculation:** All figures are **pre-aggregated in the API** as above. The UI only formats numbers and shows delta badges from `change_pct`.

### P&amp;L waterfall

- **Source:** Single object `summary.current` (same as KPI cards).
- **Calculation in the UI:** Steps are **built client-side** for visualization only:
  - Start from gross revenue; subtract commission and shipping (absolute values from API); show net revenue as a subtotal.
  - COGS: if product COGS and “other” COGS are both present, shows two steps; otherwise one combined COGS step.
  - Optional **reconcile** step: `gross_profit - (net_revenue - total_cogs)` when this residual is material — bridges rounding/definition gaps between net, total COGS, and reported gross profit.
  - Gross profit is the API value; EBITDA is appended unless a **product filter** is active and `ads_spend` is zero (then ads are not attributed to SKUs, so EBITDA is omitted).

### “Evolución mensual” stacked chart

- **Source:** `/analytics/daily` with `granularity: monthly` (tenant-wide or filtered platforms/products as selected).
- **Calculation:** Each month’s `gross_revenue`, `net_revenue`, `gross_profit`, `ebitda`, `margin_pct` come from the API bucket. The **stack segments** are a **display decomposition** in the dashboard: non-negative parts of `ebitda`, `(gross_profit - ebitda)`, `(net_revenue - gross_profit)`, and `(gross_revenue - net_revenue)` so the stack visually partitions height — they are **not** independent additive business metrics stacked arbitrarily.

### Ventas brutas / netas por canal (overlay chart)

- **Source:** Three calls to `/analytics/daily` with `granularity: monthly` and `platform` set to each of Shopify, Amazon, Mercado Libre (within the same date and product filters).
- **Calculation:** For each month, **gross** and **net** per channel are read directly from each series point (`gross_revenue`, `net_revenue`). The chart only arranges bars (side-by-side gross vs net per channel).

### Margen por canal (line chart)

- **Source:** Same three monthly per-platform series as the overlay.
- **Calculation:** **`margin_pct` is read from the API** for each channel-month point. The UI does not recompute margin.

### Donut (participación por canal)

- **Source:** `/analytics/daily` **daily** granularity, **per platform** (Shopify / Amazon / Mercado Libre), summed in the client.
- **Calculation:** For each channel, **sum of `net_revenue`** over all points in range. Sort by value for display.

### Cost composition bar chart (COGS, comisión, envío, ads por canal)

- **Source:** Same daily per-platform series as the donut.
- **Calculation:** For each channel, **sum** of `cogs`, `channel_commission`, `shipping_cost`, and `ads_spend` (absolute values) across points. No extra formulas.

### Product catalog filter

- When `product_id` query params are set, summary and daily endpoints use **product-scoped** repository methods; aggregates are still computed with `compute_summary` on those rows. Some UI copy warns when metrics (e.g. ads) are not allocated at line level.

### Currency on screen

- Amounts from the API are in the **account base currency** (with FX field for MXN/USD display). The **`CurrencyProvider`** converts for display using the user’s chosen display currency; this does not change API semantics.

---

For authoritative formulas, prefer `ecommerce-analytics-api/app/domain/services/aggregate.py` and the analytics use cases; this file is a map from **chart → data path**.
