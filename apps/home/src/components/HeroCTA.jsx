'use client'

import { Button } from '@/components/Button'
import Cookie from 'js-cookie'

export function HeroCTA() {
  return (
    <div className="mt-10 flex justify-center gap-x-6">
      <Button
        color="white"
        className="text-[black]"
        onClick={() => {
          Cookie.set('showApp', 'true', { domain: 'recipeui.com' })

          location.replace('https://recipeui.com/')
        }}
      >
        Explore our API network
      </Button>
      <Button variant="outline" className="text-white">
        Book a demo
      </Button>
    </div>
  )
}
