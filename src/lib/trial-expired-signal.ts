type BillingGateListener = () => void

let trialListener: BillingGateListener | null = null
let paymentListener: BillingGateListener | null = null
let subscriptionAlreadyActiveListener: BillingGateListener | null = null

export function onTrialExpired(cb: BillingGateListener): () => void {
  trialListener = cb
  return () => {
    if (trialListener === cb) trialListener = null
  }
}

export function signalTrialExpired(): void {
  trialListener?.()
}

export function onPaymentRequired(cb: BillingGateListener): () => void {
  paymentListener = cb
  return () => {
    if (paymentListener === cb) paymentListener = null
  }
}

export function signalPaymentRequired(): void {
  paymentListener?.()
}

export function onSubscriptionAlreadyActive(cb: BillingGateListener): () => void {
  subscriptionAlreadyActiveListener = cb
  return () => {
    if (subscriptionAlreadyActiveListener === cb) subscriptionAlreadyActiveListener = null
  }
}

export function signalSubscriptionAlreadyActive(): void {
  subscriptionAlreadyActiveListener?.()
}
