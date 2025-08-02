// extension/src/components/TrustScoreBox.tsx
import React, { useState } from 'react';

interface TrustScoreBoxProps {
    score: number | null;
    deductions: string[];
}

const TrustScoreBox: React.FC<TrustScoreBoxProps> = ({ score, deductions }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (score === null) {
        return (
            <div style={{ padding: '10px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '5px' }}>
                <p style={{ margin: 0, color: '#555' }}>Checking trust score...</p>
            </div>
        );
    }

    const isSuspicious = score < 50;
    const scoreColor = isSuspicious ? '#dc3545' : '#28a745';
    const bgColor = isSuspicious ? '#ffebeb' : '#e6ffed';
    const borderColor = isSuspicious ? '#dc3545' : '#28a745';

    const hasDeductions = deductions && deductions.length > 0;
    const scoreBoxStyles = {
        marginTop: '10px',
        padding: '12px',
        borderRadius: '5px',
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        textAlign: 'center',
        cursor: hasDeductions ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }as React.CSSProperties;

    return (
        <div
            style={scoreBoxStyles}
            onClick={() => hasDeductions && setShowDetails(!showDetails)}
        >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '1em', color: scoreColor, fontWeight: 'bold' }}>
                    Trust Score: <strong>{score}</strong>
                </p>
                {hasDeductions && (
                    <span style={{ color: scoreColor, fontSize: '0.8em', lineHeight: '1em' }}>
                        {showDetails ? '▲' : '▼'}
                    </span>
                )}
            </div>

            {showDetails && (
                <div style={{
                    marginTop: '15px',
                    paddingTop: '10px',
                    borderTop: '1px solid #ddd',
                    textAlign: 'left',
                    fontSize: '0.85em',
                    color: '#666'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Deductions:</p>
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

export default TrustScoreBox;