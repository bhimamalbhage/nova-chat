import { createHmac } from 'crypto';

const SECRET = process.env.SLACK_SIGNING_SECRET || 'dev-secret';

export function generateLinkToken(slackUserId: string): string {
    const payload = JSON.stringify({ u: slackUserId, t: Date.now() });
    const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + signature;
    return token;
}

export function verifyLinkToken(token: string): string | null {
    try {
        const [b64, sig] = token.split('.');
        if (!b64 || !sig) return null;

        const payload = Buffer.from(b64, 'base64').toString();
        const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex');

        if (sig !== expectedSig) return null;

        const data = JSON.parse(payload);
        // Expire in 1 hour
        if (Date.now() - data.t > 3600000) return null;

        return data.u;
    } catch {
        return null;
    }
}
