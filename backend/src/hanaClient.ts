import * as dotenv from 'dotenv';
dotenv.config(); // ✅ Load .env variables

const hdb = require('hdb') as any;

console.log('[DEBUG] HANA_HOST:', process.env.HANA_HOST);
console.log('[DEBUG] HANA_PORT:', process.env.HANA_PORT);

const client = hdb.createClient({
    host: process.env.HANA_HOST,
    port: process.env.HANA_PORT ? parseInt(process.env.HANA_PORT, 10) : 443,
    user: process.env.HANA_USER,
    password: process.env.HANA_PASSWORD,
    schema: process.env.HANA_SCHEMA
});

client.on('error', (err: any) => {
    console.error('SAP HANA Client Error:', err);
});

export const connectToHana = () => {
    return new Promise<void>((resolve, reject) => {
        if (client.readyState === 'connected') {
            console.log('SAP HANA client is already connected.');
            resolve();
        } else {
            console.log('Attempting to connect to SAP HANA...');
            client.connect((err: any) => {
                if (err) {
                    console.error('SAP HANA Connection Failed:', err);
                    return reject(err);
                }
                console.log('Successfully connected to SAP HANA.');
                resolve();
            });
        }
    });
};

export const queryHana = (sql: string, params: any[]): Promise<any[]> => {
    return new Promise<any[]>((resolve, reject) => {
        connectToHana().then(() => {
            client.exec(sql, params, (err: any, rows: any[]) => {
                if (err) {
                    console.error('SAP HANA Query Failed:', err);
                    return reject(err);
                }
                resolve(rows);
            });
        }).catch(reject);
    });
};
