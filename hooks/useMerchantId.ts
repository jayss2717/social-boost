import { useState, useEffect } from 'react';

export function useMerchantId() {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    // Get initial merchantId from localStorage
    const initialMerchantId = localStorage.getItem('merchantId');
    setMerchantId(initialMerchantId);

    // Listen for changes to localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'merchantId') {
        setMerchantId(e.newValue);
      }
    };

    // Listen for custom events when merchantId is set
    const handleMerchantIdSet = (e: CustomEvent) => {
      setMerchantId(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('merchantIdSet', handleMerchantIdSet as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('merchantIdSet', handleMerchantIdSet as EventListener);
    };
  }, []);

  return merchantId;
} 