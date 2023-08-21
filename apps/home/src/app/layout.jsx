import { Sora } from 'next/font/google'
import clsx from 'clsx'
import '../styles/tailwind.css'

const metadataConstants = {
  title: 'RecipeUI',
  description:
    'Open source postman alternative for teams. Discover how to use APIs from ChatGPT, GIPHY, Reddit, PokeAPI, and more in under a minute.',
  image_url: 'https://www.recipeui.com/opengraph-image.png',
}
export const metadata = {
  openGraph: {
    title: metadataConstants.title,
    description: metadataConstants.description,
    url: 'https://www.recipeui.com/',
    siteName: 'RecipeUI',
    images: [
      {
        url: metadataConstants.image_url,
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: metadataConstants.title,
    description: metadataConstants.description,
    images: [
      {
        url: metadataConstants.image_url,
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ],
  },
  title: metadataConstants.title,
  description: metadataConstants.description,
}

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
})

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={clsx(
        'h-full scroll-smooth bg-white antialiased',
        sora.variable
      )}
    >
      <body className="flex h-full flex-col">{children}</body>
    </html>
  )
}
