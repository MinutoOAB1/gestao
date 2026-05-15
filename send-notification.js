// Script to send a test notification about platform updates
const http = require('http');

async function main() {
    // First, login to get the token
    const loginData = JSON.stringify({
        email: 'admin@escritorio.com',
        password: 'password123'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const loginResult = await new Promise((resolve, reject) => {
        const req = http.request(loginOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Login response:', data);
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ raw: data });
                }
            });
        });
        req.on('error', (e) => {
            console.log('Login error:', e.message);
            reject(e);
        });
        req.write(loginData);
        req.end();
    });

    const token = loginResult.access_token;
    console.log('Token obtained:', token ? 'Yes' : 'No');

    if (!token) {
        console.log('Could not get token. Full response:', loginResult);
        return;
    }

    // Now send the broadcast notification
    const notifData = JSON.stringify({
        title: '🚀 Plataforma Atualizada!',
        message: 'Novas funcionalidades: Busca Global (Ctrl+K), Sistema de Auditoria, Rate Limiting, Pipeline CI/CD e Notificacoes em Tempo Real!',
        type: 'SYSTEM'
    });

    const notifOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/broadcast',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(notifData)
        }
    };

    const result = await new Promise((resolve, reject) => {
        const req = http.request(notifOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.write(notifData);
        req.end();
    });

    console.log('Broadcast result:', result);
}

main().catch(console.error);
