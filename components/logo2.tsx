'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ComponentProps } from 'react'

export default function Icon(
  props: Omit<ComponentProps<typeof Image>, 'src' | 'alt'>
) {
  const { theme } = useTheme()
  const src = theme === 'light' ? '/icon-dark.png' : '/icon.png'
  const { width, style } = props

  return (
    <Image
      src={src}
      alt="icon"
      {...props}
      style={{ ...style, width, height: 'auto' }}
    />
  )
}
