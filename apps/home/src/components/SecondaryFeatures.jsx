'use client'
import { Container } from '@/components/Container'

export function SecondaryFeatures() {
  return (
    <section
      id="secondary-features"
      aria-label="Features for simplifying everyday business tasks"
      className="bg-black pb-14 pt-20 sm:pb-20 sm:pt-32 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-3xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Explore our network of public APIs
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-300">
            See how easy APIs can be first hand. Try out popular APIs instantly
            and build quicker than ever, no auth required. We are constantly
            adding new APIs and you can contribute too!
          </p>
        </div>
      </Container>
    </section>
  )
}
