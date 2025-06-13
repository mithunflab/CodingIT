import { useState, useCallback } from 'react';
import { UseAuthFormReturn } from '@/components/auth/types'; // Adjust path as necessary

export function useAuthForm(): UseAuthFormReturn {
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [message, setMessageState] = useState<string | null>(null);

  const setError = useCallback((errorMsg: string | null) => {
    setErrorState(errorMsg);
    if (errorMsg) setMessageState(null);
  }, []);

  const setMessage = useCallback((msg: string | null) => {
    setMessageState(msg);
    if (msg) setErrorState(null);
  }, []);

  const clearMessages = useCallback(() => {
    setErrorState(null);
    setMessageState(null);
  }, []);

  return {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  };
}
