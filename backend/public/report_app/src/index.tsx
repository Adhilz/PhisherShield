// phishing-detection/backend/public/report_app/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // This file contains Tailwind directives
import App from './App';
import { FirebaseProvider } from './AuthContext'; // Import the provider

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <FirebaseProvider> {/* <--- Wrap App with FirebaseProvider */}
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);