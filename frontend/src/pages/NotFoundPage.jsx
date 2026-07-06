import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        title="Página no encontrada"
        description="La página que buscás no existe o fue movida."
        action={
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        }
      />
    </div>
  )
}
