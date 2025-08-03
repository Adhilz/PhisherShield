// extension/src/pages/AlertPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, ExternalLink, Flag, X, ArrowRight, Users, Brain } from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import TrustScoreDisplay from '../components/TrustScoreDisplay';

interface AlertData {
    url: string;
    score: number;
    message: string;
    tabId: number;
    geminiAiScore?: number | null;
    geminiAiReason?: string | null;
    deductions?: string[];
    reportCount?: number;
}

const AlertPage: React.FC = () => {
    const [alertData, setAlertData] = useState<AlertData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.storage.local.get('phisherShieldAlertData', (data) => {
            if (data.phisherShieldAlertData) {
                setAlertData(data.phisherShieldAlertData);
                setLoading(false);
                console.log("[AlertPage] Successfully retrieved data for overlay:", data.phisherShieldAlertData);
            } else {
                console.error("[AlertPage] NO DATA FOUND IN STORAGE for overlay!");
                setLoading(false);
                setAlertData({ url: 'unknown', score: 0, message: 'Error: Could not retrieve site information for alert overlay.', tabId: -1 });
            }
        });
    }, []);

    // Helper function to send user actions back to the background script
    const sendUserAction = (action: 'continue' | 'report' | 'block') => {
        if (alertData) {
            chrome.runtime.sendMessage({
                type: 'userAction',
                action: action,
                originalUrl: alertData.url,
                tabId: alertData.tabId
            });
        }
    };

    // Handlers for the buttons
    const handleContinue = () => {
        sendUserAction('continue');
    };

    const handleReport = () => {
        sendUserAction('report');
        chrome.tabs.create({ url: `http://localhost:3001/?url=${encodeURIComponent(alertData ? alertData.url : 'unknown')}` });
    };

    const handleBlock = () => {
        sendUserAction('block');
    };
    
    if (loading) {
        return (
            <motion.div 
                className="phishershield-alert-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    fontFamily: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
            >
                <img 
                    src="icons/loading.png" 
                    alt="PhisherShield is scanning..."
                    className="phishershield-logo-spinner"
                    style={{ width: '64px', height: '64px' }}
                />
                <motion.p 
                    style={{ color: 'rgba(32, 33, 36, 0.8)', marginTop: '16px', fontSize: '1.1rem' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Loading PhisherShield check...
                </motion.p>
            </motion.div>
        );
    }

    if (!alertData || alertData.url === 'unknown') {
        return (
            <motion.div 
                className="phishershield-alert-box"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ 
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    fontFamily: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
            >
                <AlertTriangle size={48} color="#ea4335" style={{ marginBottom: '16px' }} />
                <h1 className="warning">Error</h1>
                <p style={{ color: 'rgba(32, 33, 36, 0.8)', marginBottom: '8px' }}>
                    Could not retrieve site information for alert overlay.
                </p>
                <p style={{ color: 'rgba(32, 33, 36, 0.6)', fontSize: '0.9rem' }}>
                    Please check your background service worker console for details.
                </p>
            </motion.div>
        );
    }

    const { url, score, message, geminiAiScore, deductions, geminiAiReason, reportCount } = alertData;
    const isSuspicious = score < 50;

    return (
        <motion.div 
            className={`phishershield-alert-box ${isSuspicious ? 'suspicious' : 'safe'}`}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                fontFamily: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                boxSizing: 'border-box',
                position: 'relative'
            }}
        >
            <motion.h1 
                className={isSuspicious ? 'warning' : 'safe'}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    margin: 0,
                    lineHeight: 1.2,
                    background: isSuspicious 
                        ? 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)'
                        : 'linear-gradient(135deg, #34a853 0%, #4285f4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.025em'
                }}
            >
                {isSuspicious ? (
                    <>
                        <AlertTriangle size={32} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
                        Warning: Suspicious Site Detected!
                    </>
                ) : (
                    <>
                        <CheckCircle size={32} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
                        Site Appears Safe
                    </>
                )}
            </motion.h1>

            <motion.div 
                className="phishershield-url-display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <p style={{ fontSize: '1rem', color: 'rgba(32, 33, 36, 0.8)', margin: '0 0 8px 0', fontWeight: 600 }}>URL:</p>
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                        color: '#4285f4',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        fontSize: '0.9rem',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        background: 'rgba(66, 133, 244, 0.1)'
                    }}
                >
                    {url}
                    <ExternalLink size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                </a>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <TrustScoreDisplay trustScore={score} deductions={deductions} />
            </motion.div>

            <AnimatePresence>
                {geminiAiScore !== null && (
                    <motion.div 
                        className="phishershield-ai-score"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid #4285f4',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            margin: '16px 0',
                            textAlign: 'center',
                            boxShadow: '0 0 20px rgba(66, 133, 244, 0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Brain size={16} color="#4285f4" />
                            <span style={{ fontSize: '0.9rem', color: 'rgba(32, 33, 36, 0.8)', fontWeight: 600 }}>AI Analysis Score</span>
                        </div>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4285f4', display: 'block', marginBottom: '8px' }}>{geminiAiScore}</span>
                        {geminiAiReason && (
                            <p style={{ fontSize: '0.85rem', color: 'rgba(32, 33, 36, 0.6)', lineHeight: 1.4, margin: 0 }}>{geminiAiReason}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {reportCount !== undefined && reportCount > 0 && (
                    <motion.div 
                        className="phishershield-report-count"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid #fbbc04',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            margin: '16px 0',
                            textAlign: 'center',
                            boxShadow: '0 0 20px rgba(251, 188, 4, 0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Users size={16} color="#fbbc04" />
                            <span style={{ fontSize: '0.9rem', color: 'rgba(32, 33, 36, 0.8)', margin: 0 }}>
                                Reported by <span style={{ fontWeight: 700, color: '#fbbc04' }}>{reportCount}</span> users via PhisherShield.
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <AlertBanner message={message} />
            </motion.div>

            <motion.div 
                className="phishershield-buttons-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    width: '100%',
                    marginTop: '16px',
                    flexWrap: 'wrap'
                }}
            >
                <AnimatePresence>
                    {isSuspicious && (
                        <>
                            <motion.button
                                onClick={handleReport}
                                className="report-btn"
                                whileHover={{ y: -3, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: 0.9 }}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '16px 24px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #fbbc04 0%, #f9ab00 100%)',
                                    color: '#202124',
                                    border: '1px solid rgba(251, 188, 4, 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Flag size={16} style={{ marginRight: '8px' }} />
                                Report
                            </motion.button>
                            <motion.button
                                onClick={handleBlock}
                                className="block-btn"
                                whileHover={{ y: -3, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: 1.0 }}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '16px 24px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #ea4335 0%, #d93025 100%)',
                                    color: 'white',
                                    border: '1px solid rgba(234, 67, 53, 0.3)',
                                    backdropFilter: 'blur(10px)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <X size={16} style={{ marginRight: '8px' }} />
                                Block
                            </motion.button>
                        </>
                    )}
                </AnimatePresence>
                <motion.button
                    onClick={handleContinue}
                    className="continue-btn"
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isSuspicious ? 1.1 : 0.9 }}
                    style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '16px 24px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)',
                        color: 'white',
                        border: '1px solid rgba(66, 133, 244, 0.3)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <ArrowRight size={16} style={{ marginRight: '8px' }} />
                    Continue to Site
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default AlertPage;