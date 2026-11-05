import React from 'react';
import ReactDOM from 'react-dom/client';
import CustomerStandaloneApp from './CustomerStandaloneApp';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <CustomerStandaloneApp />
    </React.StrictMode>
  );
}

