import tls from 'tls';

export const checkSSLValidity = (domain: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const socket = tls.connect(443, domain, { servername: domain }, () => {
            // Check if certificate is authorized and not expired
            const valid = socket.authorized && !socket.authorizationError;
            socket.end();
            resolve(valid);
        });

        socket.on('error', () => {
            resolve(false);
        });
    });
};