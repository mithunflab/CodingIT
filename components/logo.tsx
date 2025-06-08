import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const Logo = () => {
  const { resolvedTheme } = useTheme() // Use resolvedTheme for actual light/dark
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  let logoSrcToRender: string;

  if (!mounted) {
    logoSrcToRender = '/logo-dark.png';
  } else {
    logoSrcToRender = resolvedTheme === 'dark' ? '/logo-dark.png' : '/android-chrome-192x192.png';
  }

  return (
    <Image
      src={logoSrcToRender}
      width={42}
      height={42}
      alt="Logo"
      key={mounted ? resolvedTheme : 'initial'} // Add key to help React differentiate if src changes
    />
  )
}

export default Logo;