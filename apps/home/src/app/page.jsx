import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { PrimaryFeatures } from '@/components/PrimaryFeatures'
import { OurStory } from '@/components/OurStory'
import { ContactUs } from '@/components/ContactUs'
import { HeroCTA } from '@/components/HeroCTA'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PrimaryFeatures />
        <HeroCTA />
        <OurStory />
        <ContactUs />
      </main>
      <Footer />
    </>
  )
}
