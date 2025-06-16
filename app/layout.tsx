import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'role-chat-web App',
  description: 'Created with role-team',
  generator: 'role.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
