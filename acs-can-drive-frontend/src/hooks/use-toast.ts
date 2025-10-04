import { useState } from 'react';

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  return { toasts, setToasts };
}


