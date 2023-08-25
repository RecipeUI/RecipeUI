'use client'

import Image from 'next/image'

import { Container } from '@/components/Container'
import yc from '@/images/logos/yc.svg'
import { Button } from './Button'
import { HeroButtons } from '@/components/HeroButtons'
import classNames from 'classnames'
import DarkApp from '@/images/screenshots/DarkApp.png'
import { useState } from 'react'

export function Hero() {
  const [show, setShow] = useState(false)

  return (
    <Container className="bg-black  text-center lg:pt-10">
      <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl marker:sm:text-7xl">
        The API tool <span className="block sm:inline">for teams</span>
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg tracking-tight text-slate-300">
        RecipeUI is an open source Postman alternative.
        <br className="hidden sm:block" />
        APIs made easy, no coding experience or required.
        <br className="hidden sm:block" />
        Built for everyone from PMs to QA to Devs.
      </p>
      <HeroButtons />
      <div className="mt-10 flex items-center justify-center">
        <Image src={yc} alt="backed by yc" unoptimized className="w-40" />
      </div>
      <div
        className={classNames('cursor-pointer')}
        onClick={() => setShow(true)}
      >
        <div
          style={{
            position: 'relative',
            paddingBottom: '64.5933014354067%',
            height: 0,
          }}
        >
          {show ? (
            <iframe
              src="https://www.loom.com/embed/a942d8382ea249dab99c8ba2792ae02c?sid=44ec3342-c13e-488d-a837-a5473d708e89"
              frameborder="0"
              webkitAllowFullscreen
              mozAllowFullscreen
              allowFullscreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <>
              <Image
                src={DarkApp}
                alt="RecipeUI Dark Mode"
                unoptimized
                className="absolute left-0 right-0 top-0 max-h-[600px]  overflow-clip  object-cover object-top"
              />
              <div
                className="absolute left-1/2 top-1/2 flex  items-center justify-center md:top-[30%]"
                style={{
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  className="h-16 w-16 fill-slate-200 stroke-[#21b2a5] md:h-40 md:w-40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                  />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
