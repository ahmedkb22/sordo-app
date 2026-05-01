'use client'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ConditionalNav() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) return null
  return <Navbar />
}