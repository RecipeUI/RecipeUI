import { Sora } from 'next/font/google'
import clsx from 'clsx'
import '../styles/tailwind.css'

const metadataConstants = {
  title: 'RecipeUI',
  description:
    'Open source Postman alternative with type safety. Make error-free requests to ChatGPT, OpenAI, Nasa, Reddit, and more.',
  image_url: 'https://www.recipeui.com/opengraph-image.png',
}
import { redirect } from 'next/navigation'
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
  redirect('https://www.recipeui.com')

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
