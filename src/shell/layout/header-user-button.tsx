import { UserButton, useUser } from '@clerk/react'

import { userInitials } from '@/lib/user/initials'
import type { MeResponse } from '@/lib/types/me-types'

const CLERK_INITIALS_BG = '#ECEA5D'
const CLERK_INITIALS_FG = '#000000'

type HeaderUserButtonProps = {
  me?: MeResponse | null
}

export function HeaderUserButton({ me = null }: HeaderUserButtonProps) {
  const { user } = useUser()
  const initials = userInitials({
    firstName: me?.first_name ?? user?.firstName,
    lastName: me?.last_name ?? user?.lastName,
    email: me?.email ?? user?.primaryEmailAddress?.emailAddress,
  })

  return (
    <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-full text-[11px] font-semibold tracking-wide"
        style={{ backgroundColor: CLERK_INITIALS_BG, color: CLERK_INITIALS_FG }}
        aria-hidden
      >
        {initials}
      </div>
      <UserButton
        appearance={{
          elements: {
            rootBox: 'flex size-8 items-center justify-center',
            userButtonBox: 'flex size-8 items-center justify-center',
            userButtonTrigger:
              'flex size-8 items-center justify-center rounded-full p-0 hover:bg-transparent',
            avatarBox: 'size-8 rounded-full',
            userButtonAvatarImage: 'opacity-0',
            userPreviewAvatarImage: 'opacity-0',
            userPreviewAvatarBox: 'bg-[#ECEA5D]',
            userButtonPopoverCard: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
