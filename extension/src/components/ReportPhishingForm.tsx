// extension/src/components/ReportPhishingForm.tsx
import React from 'react';

interface ReportPhishingFormProps {
    url: string; // This *must* match the type passed from Popup.tsx
}

const ReportPhishingForm: React.FC<ReportPhishingFormProps> = ({ url }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const encodedUrl = encodeURIComponent(url);
    const reportPage = `http://localhost:4000/report?url=${encodedUrl}`;

    // Open the report page in a new tab
    window.open(reportPage, '_blank');

    console.log(`Redirecting to report page for URL: ${url}`);
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '15px', borderTop: '1px solid #eee' }}>
            <p>Is this site suspicious? Help us by reporting it!</p>
            <input
                type="text"
                value={url}
                readOnly
                style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
                type="submit"
                style={{
                    padding: '10px 15px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Report Site
            </button>
        </form>
    );
};

export default ReportPhishingForm;