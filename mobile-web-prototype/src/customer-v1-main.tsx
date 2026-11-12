import React from 'react';
import ReactDOM from 'react-dom/client';
import { CustomerV1Workbench } from './customer-v1-prototype';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <CustomerV1Workbench initialMode="debug" />
    </React.StrictMode>
  );
}
