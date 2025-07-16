export const calculateTrustScore = (url: string, checks: Array<number>): number => {
    const baseScore = 100;
    const penalty = checks.reduce((acc, check) => acc + (check ? 0 : 10), 0);
    return Math.max(0, baseScore - penalty);
};

export const assessUrlSafety = (trustScore: number): string => {
    if (trustScore >= 80) {
        return "Safe";
    } else if (trustScore >= 50) {
        return "Caution";
    } else {
        return "Unsafe";
    }
};