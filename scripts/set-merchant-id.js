// Simple script to set merchant ID in localStorage
// Run this in browser console or include in HTML

const merchantId = 'cmdxzweny0001vgq7wlr4ptll';

if (typeof window !== 'undefined') {
  localStorage.setItem('merchantId', merchantId);
  console.log('Merchant ID set:', merchantId);
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('merchantIdSet', { 
    detail: merchantId 
  }));
  
  console.log('✅ Merchant ID configured successfully!');
  console.log('🔄 Please refresh the page to see the changes.');
} else {
  console.log('❌ This script must run in a browser environment');
} 