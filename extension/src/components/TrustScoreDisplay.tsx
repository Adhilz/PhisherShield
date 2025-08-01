// extension/src/components/TrustScoreDisplay.tsx
import React, { useState } from 'react';

interface TrustScoreDisplayProps {
    trustScore: number | null;
    deductions?: string[]; // Optional array of deduction strings
    onClick?: () => void; // Optional click handler
}

const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({ trustScore, deductions, onClick }) => {
    const [showDetails, setShowDetails] = useState(false); // State to toggle deduction details

    if (trustScore === null) {
        return (
            <div className="phishershield-score-display safe" style={{ cursor: 'default' }}>
                <p>Checking trust score...</p>
            </div>
        );
    }

    const isSuspicious = trustScore < 50;
    const scoreClass = isSuspicious ? 'suspicious' : 'safe';

    const handleClick = () => {
        console.log('[TrustScoreDisplay] Clicked! Deductions:', deductions); // Debug log
        if (deductions && deductions.length > 0) { // Only toggle if there are deductions to show
            setShowDetails(!showDetails);
        }
        onClick?.(); // Call external onClick if provided
    };

    return (
        <div
            className={`phishershield-score-display ${scoreClass}`}
            onClick={handleClick} // ADD onClick HANDLER
            style={{ cursor: (deductions && deductions.length > 0) ? 'pointer' : 'default' }} // Change cursor
        >
            <p>Trust Score: <strong>{trustScore}</strong></p>
            {deductions && deductions.length > 0 && ( // Only show arrow if deductions exist
                <span style={{ marginLeft: '10px', fontSize: '0.8em', verticalAlign: 'middle' }}>
                    {showDetails ? '▲' : '▼'} {/* Up/Down arrow */}
                </span>
            )}

            {showDetails && deductions && deductions.length > 0 && ( // Display deductions
                <div style={{
                    marginTop: '15px',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee',
                    textAlign: 'left',
                    fontSize: '0.85em',
                    color: '#666'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Deductions:</p>
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {deductions.map((deduction, index) => (
                            <li key={index} style={{ marginBottom: '3px' }}>- {deduction}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TrustScoreDisplay;