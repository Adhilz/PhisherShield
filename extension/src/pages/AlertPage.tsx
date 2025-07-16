// extension/src/pages/AlertPage.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const AlertPage: React.FC = () => {
    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', margin: '50px auto' }}>
            <h1>PhisherShield Alert</h1>
            <p>This is a placeholder alert page!</p>
            <p>Content will be dynamically loaded here based on scan results.</p>
            <button
                onClick={() => window.history.back()}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '15px'
                }}
            >
                Go Back (Placeholder)
            </button>
        </div>
    );
};

// Mount the React app to the root div in alert.html
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AlertPage />);
}

export default AlertPage;