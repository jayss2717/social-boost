import React from 'react';
import { Button, ButtonProps } from '@shopify/polaris';
import { useButtonLoading } from '@/hooks/useButtonLoading';

interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<void> | void;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  onClick, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  ...props 
}: LoadingButtonProps) {
  const { isLoading, withLoading } = useButtonLoading();

  const handleClick = withLoading(async () => {
    await onClick();
  });

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      loading={isLoading}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
} 