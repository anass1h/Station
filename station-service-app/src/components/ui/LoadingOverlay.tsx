import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Chargement...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-secondary-600">{message}</p>
      </div>
    </div>
  );
}
