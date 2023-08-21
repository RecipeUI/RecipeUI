import { Button } from '@/components/Button'
import { Container } from '@/components/Container'

export function CallToAction() {
  return (
    <section
      id="contact-us"
      className="relative overflow-hidden bg-black py-32"
    >
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Contact us
          </h2>
          <p className="mt-4 text-lg tracking-tight text-white">
            Email us at team@recipeui.com for questions or feedback. Book a demo
            to see how RecipeUI can work for your team.
          </p>
          <Button
            variant="outline"
            className="mt-10 text-white hover:bg-slate-900 hover:text-white"
            href="https://calendly.com/jeane-nfi/30min"
            target="_blank"
          >
            Book a demo
          </Button>
        </div>
      </Container>
    </section>
  )
}
