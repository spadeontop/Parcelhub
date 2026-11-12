import React from 'react';
import ReactDOM from 'react-dom/client';
import { StaffV1Workbench } from './staff-v1-prototype';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <StaffV1Workbench initialMode="debug" />
    </React.StrictMode>
  );
}
