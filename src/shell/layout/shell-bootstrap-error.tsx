import { ServiceErrorScreen } from '@/shell/service-error-screen'

type ShellBootstrapErrorProps = {
  lang: string
}

export function ShellBootstrapError({ lang }: ShellBootstrapErrorProps) {
  return <ServiceErrorScreen lang={lang} />
}
