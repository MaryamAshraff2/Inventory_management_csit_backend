import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Inject Authorization header into all fetch calls to the backend
(() => {
  const originalFetch = window.fetch;
  const API_HOSTS = new Set([
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ]);
  const API_PATH_PREFIX = '/inventory/';

  function shouldAttachAuth(urlString) {
    try {
      const url = new URL(urlString, window.location.origin);
      const isApiHost = API_HOSTS.has(`${url.protocol}//${url.host}`);
      const isApiPath = url.pathname.startsWith(API_PATH_PREFIX);
      return isApiHost && isApiPath;
    } catch (e) {
      return false;
    }
  }

  window.fetch = (input, init = {}) => {
    const urlString = typeof input === 'string' ? input : input.url;

    if (!shouldAttachAuth(urlString)) {
      return originalFetch(input, init);
    }

    const token = sessionStorage.getItem('authToken');
    if (!token) {
      return originalFetch(input, init);
    }

    // Normalize headers
    let headers = init.headers || {};
    if (headers instanceof Headers) {
      headers = Object.fromEntries(headers.entries());
    }

    // Do not overwrite if already set
    if (!headers['Authorization'] && !headers['authorization']) {
      headers = { ...headers, Authorization: `Bearer ${token}` };
    }

    const nextInit = { ...init, headers };
    return originalFetch(input, nextInit);
  };
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)