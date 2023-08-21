import Image from 'next/image'

import { Container } from '@/components/Container'
import yc from '@/images/logos/yc.svg'
import { Button } from './Button'

export function Hero() {
  return (
    <Container className="bg-black  text-center lg:pt-10">
      <h1 className="mx-auto max-w-4xl font-display text-4xl font-medium tracking-tight text-white sm:text-5xl marker:sm:text-7xl">
        The API tool <span className="block sm:inline">for teams</span>
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg tracking-tight text-slate-300">
        RecipeUI is an open source Postman alternative.{' '}
        <br className="hidden sm:block" />
        Built for everyone from Devs to PMs to QA. Test APIs in seconds.
      </p>
      <div className="mt-10 flex justify-center gap-x-6">
        <Button color="white" className="text-[black]">
          Explore our API Network
        </Button>
        <Button
          variant="outline"
          className="text-white hover:bg-slate-900 hover:text-white"
        >
          Book a demo
        </Button>
      </div>
      <div className="mt-10 flex items-center justify-center">
        <Image src={yc} alt="backed by yc" unoptimized className="w-40" />
      </div>
      <div className="mx-auto mt-8 max-w-screen-xl">
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            title="Loom Video"
            src="https://www.loom.com/embed/e5b8c04bca094dd8a5507925ab887002?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
            allowFullScreen
            className="h-full w-full"
            style={{
              width: '100%', // Adjust the width as needed
              height: '100%', // Adjust the height as needed
            }}
          />
        </div>
      </div>
    </Container>
  )
}
