import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { normalizePasswordResetCode, PASSWORD_RESET_OTP_LENGTH } from '../passwordRecoveryUtils'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  length?: number
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  length = PASSWORD_RESET_OTP_LENGTH,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')

  const update = (next: string) => {
    onChange(normalizePasswordResetCode(next).slice(0, length))
  }

  const focusIndex = (index: number) => {
    refs.current[Math.max(0, Math.min(index, length - 1))]?.focus()
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    if (cleaned.length > 1) {
      update(cleaned)
      focusIndex(Math.min(cleaned.length, length) - 1)
      return
    }

    const next = `${value.slice(0, index)}${cleaned}${value.slice(index + 1)}`
    update(next)
    if (cleaned && index < length - 1) focusIndex(index + 1)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    update(pasted)
    focusIndex(Math.min(pasted.length, length) - 1)
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
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  )
}
