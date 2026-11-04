import React from 'react';
import ReactDOM from 'react-dom/client';
import StaffStandaloneApp from './StaffStandaloneApp';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <StaffStandaloneApp />
    </React.StrictMode>
  );
}
