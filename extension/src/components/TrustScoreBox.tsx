// extension/src/components/TrustScoreBox.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrustScoreBoxProps {
    score: number | null;
    deductions: string[];
}

const TrustScoreBox: React.FC<TrustScoreBoxProps> = ({ score, deductions }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (score === null) {
        return (
            <motion.div 
                className="phishershield-trust-score-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <img 
                        src="icons/loading.png" 
                        alt="PhisherShield is scanning..."
                        className="phishershield-logo-spinner"
                        style={{ width: '48px', height: '48px' }}
                    />
                    <p style={{ margin: '12px 0 0 0', color: 'rgba(32, 33, 36, 0.8)', fontSize: '0.9rem' }}>
                        Checking trust score...
                    </p>
                </div>
            </motion.div>
        );
    }

    const isSuspicious = score < 50;
    const hasDeductions = deductions && deductions.length > 0;

    return (
        <motion.div
            className={`phishershield-trust-score-box ${isSuspicious ? 'suspicious' : 'safe'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2 }}
            onClick={() => hasDeductions && setShowDetails(!showDetails)}
        >
            <div className="phishershield-score-display">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    {isSuspicious ? (
                        <AlertTriangle size={24} color="#ea4335" />
                    ) : (
                        <CheckCircle size={24} color="#34a853" />
                    )}
                    <div>
                        <span className="phishershield-score-value">{score}</span>
                        <div className="phishershield-score-label">Trust Score</div>
                    </div>
                    {hasDeductions && (
                        <motion.div
                            animate={{ rotate: showDetails ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {showDetails ? (
                                <ChevronUp size={20} color="rgba(32, 33, 36, 0.8)" />
                            ) : (
                                <ChevronDown size={20} color="rgba(32, 33, 36, 0.8)" />
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showDetails && hasDeductions && (
                    <motion.div
                        className="phishershield-deductions-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="phishershield-deductions-title">
                            Security Concerns Detected:
                        </div>
                        <ul className="phishershield-deductions-list">
                            {deductions.map((deduction, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {deduction}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TrustScoreBox;