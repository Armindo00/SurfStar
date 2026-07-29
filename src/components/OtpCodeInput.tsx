import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function OtpCodeInput({ value, onChange, disabled }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '')

  const update = (next: string) => {
    onChange(normalizeDigits(next))
  }

  const focusIndex = (index: number) => {
    refs.current[Math.max(0, Math.min(index, 5))]?.focus()
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = normalizeDigits(raw)
    if (cleaned.length > 1) {
      update(cleaned)
      focusIndex(cleaned.length >= 6 ? 5 : cleaned.length)
      return
    }

    const next = `${value.slice(0, index)}${cleaned}${value.slice(index + 1)}`
    update(next)
    if (cleaned && index < 5) focusIndex(index + 1)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = normalizeDigits(event.clipboardData.getData('text'))
    update(pasted)
    focusIndex(pasted.length >= 6 ? 5 : pasted.length)
  }

  return (
    <div className="auth-otp-grid" role="group" aria-label="Reset code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          className="auth-otp-cell"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1} of 6`}
        />
      ))}
    </div>
  )
}
