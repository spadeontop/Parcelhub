import React from 'react';
import ReactDOM from 'react-dom/client';
import { PostmanWorkbench } from './postman-v1';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <PostmanWorkbench />
    </React.StrictMode>
  );
}
