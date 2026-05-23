import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BRAHMO Drug Safety Engine',
  description: 'Deterministic drug safety layer for clinical AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
