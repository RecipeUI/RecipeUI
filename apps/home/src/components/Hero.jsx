import Image from 'next/image'

import { Container } from '@/components/Container'
import yc from '@/images/logos/yc.svg'
import { Button } from './Button'
import { HeroButtons } from '@/components/HeroButtons'
import classNames from 'classnames'

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
      <HeroButtons />
      <div className="mt-10 flex items-center justify-center">
        <Image src={yc} alt="backed by yc" unoptimized className="w-40" />
      </div>
      <div
        className={classNames(
          'mx-auto mt-8 max-w-screen-xl',
          // Revert this later when loom comesb ack,
          'hidden'
        )}
      >
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
      <div className="mt-6 flex justify-center">
        <div className="h-[600px] w-[70%] rounded-sm bg-gray-600 ">
          <h2 className="mt-24 text-4xl font-bold ">Demo Soon</h2>
        </div>
      </div>
    </Container>
  )
}
