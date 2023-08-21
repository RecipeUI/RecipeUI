'use client'
import { Container } from '@/components/Container'
import screenshotHomepage from '@/images/screenshots/homepage.png'
import Image from 'next/image'
import { Button } from '@/components/Button'

export function SecondaryFeatures() {
  return (
    <section
      id="api-network"
      aria-label="Features for simplifying everyday business tasks"
      className="bg-black pb-14 pt-10 sm:pb-10 sm:pt-32 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-3xl md:text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Explore our network of public APIs
          </h2>
          <p className="mt-6 text-lg tracking-tight text-slate-300">
            See how easy APIs can be first hand. Try out popular APIs instantly
            and build quicker than ever, no auth required. We are constantly
            adding new APIs and you can contribute too!
          </p>
        </div>
        <div className="mt-10 flex justify-center gap-x-6">
          <Button
            color="white"
            className="text-[black]"
            onClick={() => {
              Cookie.set('showApp', 'true', { domain: 'recipeui.com' })

              setTimeout(() => {
                window.open('https://recipeui.com/', '_blank')
              }, 500)
            }}
          >
            Test some APIs now with RecipeUI
          </Button>
        </div>
        <div className="mt-12 flex items-center justify-center">
          <Image
            className="w-10/12 rounded-lg"
            src={screenshotHomepage}
            alt=""
            priority
            sizes="(min-width: 1024px) 67.8125rem, (min-width: 640px) 100vw, 45rem"
          />
        </div>
      </Container>
    </section>
  )
}
