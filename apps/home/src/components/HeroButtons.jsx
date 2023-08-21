'use client'

import { Button } from '@/components/Button'
import Cookie from 'js-cookie'

export function HeroButtons() {
  return (
    <div className="mt-10 flex justify-center gap-x-4 sm:gap-x-6">
      <Button
        color="white"
        className="text-[black]"
        onClick={() => {
          Cookie.set('showApp', 'true', { domain: 'recipeui.com' })

          window.open('https://recipeui.com/', '_blank')
        }}
      >
        Explore our API Network
      </Button>
      <Button
        variant="outline"
        className="text-white hover:bg-slate-900 hover:text-white"
        onClick={() => {
          window.open('https://calendly.com/jeane-nfi/30min', '_blank')
        }}
      >
        Book a demo
      </Button>
    </div>
  )
}
