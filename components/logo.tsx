import Image from 'next/image'
import { useTheme } from 'next-themes'

const Logo = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isLight = theme === 'light'

  let logoSrc = '/android-chrome-192x192.png'
  if (isDark) {
    logoSrc = '/logo-dark.png'
  } else if (isLight) {
    logoSrc = '/android-chrome-192x192.png'
  }

  return (
    <Image
      src={logoSrc}
      width={42}
      height={42}
      alt="Logo"
    />
  )
}

export default Logo;