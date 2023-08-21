import { Sora, Lexend } from 'next/font/google'
import clsx from 'clsx'

import '@/styles/tailwind.css'

export const metadata = {
  title: {
    template: '%s - RecipeUI',
    default: 'RecipeUI - The API tool for teams',
  },
  description: 'Open source Postman alternative. Test APIs in seconds.',
}

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
})

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
})

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={clsx(
        'h-full scroll-smooth bg-white antialiased',
        sora.variable,
        lexend.variable
      )}
    >
      <body className="flex h-full flex-col">{children}</body>
    </html>
  )
}
