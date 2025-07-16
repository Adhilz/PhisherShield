export interface TrustScore {
    score: number;
    level: 'low' | 'medium' | 'high';
    reasons: string[];
}

export interface Report {
    url: string;
    description: string;
    timestamp: Date;
}