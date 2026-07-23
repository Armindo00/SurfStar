import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'

type Props = {
  title: string
  description: string
}

export function PlaceholderScreen({ title, description }: Props) {
  const { setView } = useApp()
  return (
    <div className="ss-flow">
      <ScreenHeader title={title} onBack={() => setView('coach-home')} />
      <div className="ss-card">
        <p className="muted">{description}</p>
      </div>
    </div>
  )
}
