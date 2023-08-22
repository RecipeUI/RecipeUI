import screenshotHomepage from '@/images/screenshots/homepage.png'
import Image from 'next/image'
import { Button } from '@/components/Button'

export function HeroCTA() {
  return (
    <section id="api-network">
      <div className="bg-black py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Explore our network of APIs
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Try out some public APIs we support and see how easy APIs can be
              first hand! We are constantly adding new APIs for everyone to try,
              no coding experience required.
            </p>
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-x-6">
          <Button
            color="white"
            className="text-[black]"
            href="https://recipeui.com/"
          >
            Check it out at RecipeUI
          </Button>
        </div>
        <div className="relative overflow-hidden pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Image
              src={screenshotHomepage}
              alt="App screenshot"
              className="mb-[-3%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
              width={2432}
              height={1442}
            />
            <div className="relative" aria-hidden="true">
              <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-black pt-[6%]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
