import React from 'react';

interface ToastProps {
  message?: string;
  isOpen?: boolean;
}

// Toast popup UI has been disabled
export const Toast: React.FC<ToastProps> = () => {
  return null;
};
