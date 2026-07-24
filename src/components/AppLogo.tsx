type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  size?: LogoSize
  className?: string
  alt?: string
}

export function AppLogo({ size = 'md', className = '', alt = 'SurfStar' }: Props) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`app-logo app-logo--${size}${className ? ` ${className}` : ''}`}
      decoding="async"
    />
  )
}
