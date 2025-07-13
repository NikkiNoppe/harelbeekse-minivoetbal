
// Simple polyfills for basic functionality
if (typeof Array.isArray === 'undefined') {
  Array.isArray = function(arg: any): arg is any[] {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
  console.log('✅ Array.isArray polyfill loaded');
}

if (typeof Object.entries === 'undefined') {
  Object.entries = function(obj: any) {
    const ownProps = Object.keys(obj);
    let i = ownProps.length;
    const resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
  console.log('✅ Object.entries polyfill loaded');
}

if (typeof Object.keys === 'undefined') {
  Object.keys = function(obj: any) {
    const keys = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  console.log('✅ Object.keys polyfill loaded');
}

console.log('✅ Simple polyfills loaded successfully');

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
