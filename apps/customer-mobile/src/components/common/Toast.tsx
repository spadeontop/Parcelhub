import React from 'react';

export interface ToastProps {
  message?: string;
  isOpen?: boolean;
  onPress?: () => void;
}

// Toast popup UI has been disabled as screen UI handles feedback directly
export const Toast: React.FC<ToastProps> = () => {
  return null;
};

export default Toast;
