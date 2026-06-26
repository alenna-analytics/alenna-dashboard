import adsIcon from '@/assets/icons/ads.svg'
import aiIcon from '@/assets/icons/ai.svg'
import billingIcon from '@/assets/icons/billing.svg'
import channelsIcon from '@/assets/icons/channels.svg'
import companyIcon from '@/assets/icons/company.svg'
import configIcon from '@/assets/icons/config.svg'
import decreaseIcon from '@/assets/icons/decrease.svg'
import downloadIcon from '@/assets/icons/download.svg'
import growthIcon from '@/assets/icons/growth.svg'
import homeIcon from '@/assets/icons/home.svg'
import integrationsIcon from '@/assets/icons/integrations.svg'
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

import homeIconRaw from '@/assets/icons/home.svg?raw'
import productsIconRaw from '@/assets/icons/products.svg?raw'
import salesIconRaw from '@/assets/icons/sales.svg?raw'
import reportsIconRaw from '@/assets/icons/reports.svg?raw'
import adsIconRaw from '@/assets/icons/ads.svg?raw'
import channelsIconRaw from '@/assets/icons/channels.svg?raw'
import simulationsIconRaw from '@/assets/icons/simulations.svg?raw'
import integrationsIconRaw from '@/assets/icons/integrations.svg?raw'
import configIconRaw from '@/assets/icons/config.svg?raw'
import decreaseIconRaw from '@/assets/icons/decrease.svg?raw'
import aiIconRaw from '@/assets/icons/ai.svg?raw'
import billingIconRaw from '@/assets/icons/billing.svg?raw'
import companyIconRaw from '@/assets/icons/company.svg?raw'
import downloadIconRaw from '@/assets/icons/download.svg?raw'
import growthIconRaw from '@/assets/icons/growth.svg?raw'
import notificationsIconRaw from '@/assets/icons/notifications.svg?raw'
import ordersIconRaw from '@/assets/icons/orders.svg?raw'
import orgsIconRaw from '@/assets/icons/orgs.svg?raw'
import speedIconRaw from '@/assets/icons/speed.svg?raw'
import userIconRaw from '@/assets/icons/user.svg?raw'
import validationIconRaw from '@/assets/icons/validation.svg?raw'

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
  decrease: decreaseIcon,
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

export const APP_ICONS_RAW = {
  home: homeIconRaw,
  products: productsIconRaw,
  sales: salesIconRaw,
  reports: reportsIconRaw,
  ads: adsIconRaw,
  channels: channelsIconRaw,
  simulations: simulationsIconRaw,
  integrations: integrationsIconRaw,
  config: configIconRaw,
  decrease: decreaseIconRaw,
  ai: aiIconRaw,
  billing: billingIconRaw,
  company: companyIconRaw,
  download: downloadIconRaw,
  growth: growthIconRaw,
  notifications: notificationsIconRaw,
  orders: ordersIconRaw,
  orgs: orgsIconRaw,
  speed: speedIconRaw,
  user: userIconRaw,
  validation: validationIconRaw,
} as const satisfies Record<keyof typeof APP_ICONS, string>

export type AppIconName = keyof typeof APP_ICONS
