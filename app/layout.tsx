import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppSidebar } from '@/components/app-sidebar'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Recuritone - Recruitment Platform',
  description: 'Professional recruitment platform for managing jobs and candidate profiles',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased flex h-screen bg-background`}>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
