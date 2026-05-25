import { Alert, AlertDescription } from '@/components/common/ui/alert';

interface AuthStatusMessageProps {
  error: string | null;
  success: string | null;
}

export default function AuthStatusMessage({ error, success }: AuthStatusMessageProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
