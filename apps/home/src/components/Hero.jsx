import Image from 'next/image'

import { Container } from '@/components/Container'
import yc from '@/images/logos/yc.svg'
import { HeroCTA } from './HeroCTA'

export function Hero() {
  return (
    <Container className="bg-black pb-16 pt-20 text-center lg:pt-32">
      <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-white marker:sm:text-7xl">
        The API tool for teams
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg tracking-tight text-slate-300">
        RecipeUI is an open source Postman alternative. <br />
        Built for everyone from Devs to PMs to QA. <br /> Test APIs with a click
        of a button. <br />
      </p>
      <HeroCTA />
      <div className="mt-10 flex items-center justify-center">
        <Image src={yc} alt="backed by yc" unoptimized className="w-40" />

        {/* {[
            [
              { name: 'Transistor', logo: logoTransistor },
              { name: 'Tuple', logo: logoTuple },
              { name: 'StaticKit', logo: logoStaticKit },
            ],
            [
              { name: 'Mirage', logo: logoMirage },
              { name: 'Laravel', logo: logoLaravel },
              { name: 'Statamic', logo: logoStatamic },
            ],
          ].map((group, groupIndex) => (
            <li key={groupIndex}>
              <ul
                role="list"
                className="flex flex-col items-center gap-y-8 sm:flex-row sm:gap-x-12 sm:gap-y-0"
              >
                {group.map((company) => (
                  <li key={company.name} className="flex">
                    <Image src={company.logo} alt={company.name} unoptimized />
                  </li>
                ))}
              </ul>
            </li>
          ))} */}
      </div>
    </Container>
  )
}
