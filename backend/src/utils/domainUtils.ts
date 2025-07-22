const getRootDomain = (hostname: string): string => {
    const parsed = psl.parse(hostname);
    return parsed && typeof parsed === 'object' && 'domain' in parsed && parsed.domain
        ? parsed.domain
        : hostname;
};
