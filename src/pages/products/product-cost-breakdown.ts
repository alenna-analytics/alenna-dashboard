export type ComponentAmountMode = 'fixed' | 'percent'

export type ComponentAmount = {
  mode: ComponentAmountMode
  value: number
}

export type CostBreakdownInput = {
  supplierPrice: number
  freight: ComponentAmount
  duties: ComponentAmount
  packagingValue: number
}

function quantize(value: number): number {
  return Math.round(value * 10000) / 10000
}

function componentAmount(base: number, component: ComponentAmount): number {
  if (component.mode === 'percent') {
    return quantize((base * component.value) / 100)
  }
  return quantize(component.value)
}

export function computeCogsTotal(breakdown: CostBreakdownInput): number {
  const supplier = quantize(breakdown.supplierPrice)
  const freight = componentAmount(supplier, breakdown.freight)
  const dutiable = supplier + freight
  const duties = componentAmount(dutiable, breakdown.duties)
  const packaging = quantize(breakdown.packagingValue)
  return quantize(supplier + freight + duties + packaging)
}
