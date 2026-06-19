import adsIcon from '@/assets/icons/ads.svg'
import aiIcon from '@/assets/icons/ai.svg'
import billingIcon from '@/assets/icons/billing.svg'
import channelsIcon from '@/assets/icons/channels.svg'
import companyIcon from '@/assets/icons/company.svg'
import configIcon from '@/assets/icons/config.svg'
import downloadIcon from '@/assets/icons/download.svg'
import growthIcon from '@/assets/icons/growth.svg'
import homeIcon from '@/assets/icons/home.svg'
import integrationsIcon from '@/assets/icons/integrations.svg'
import loadingIcon from '@/assets/icons/loading.svg'
import notificationsIcon from '@/assets/icons/notifications.svg'
import ordersIcon from '@/assets/icons/orders.svg'
import orgsIcon from '@/assets/icons/orgs.svg'
import productsIcon from '@/assets/icons/products.svg'
import reportsIcon from '@/assets/icons/reports.svg'
import salesIcon from '@/assets/icons/sales.svg'
import simulationsIcon from '@/assets/icons/simulations.svg'
import speedIcon from '@/assets/icons/speed.svg'
import userIcon from '@/assets/icons/user.svg'
import validationIcon from '@/assets/icons/validation.svg'

export const APP_ICONS = {
  home: homeIcon,
  products: productsIcon,
  sales: salesIcon,
  reports: reportsIcon,
  ads: adsIcon,
  channels: channelsIcon,
  simulations: simulationsIcon,
  integrations: integrationsIcon,
  config: configIcon,
  loading: loadingIcon,
  ai: aiIcon,
  billing: billingIcon,
  company: companyIcon,
  download: downloadIcon,
  growth: growthIcon,
  notifications: notificationsIcon,
  orders: ordersIcon,
  orgs: orgsIcon,
  speed: speedIcon,
  user: userIcon,
  validation: validationIcon,
} as const

export type AppIconName = keyof typeof APP_ICONS
