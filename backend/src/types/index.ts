export interface TrustScore {
    url: string;
    score: number;
    isSafe: boolean;
    reasons: string[];
}

export interface Report {
    url: string;
    description: string;
    timestamp: Date;
}