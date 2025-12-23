import { createHmac, timingSafeEqual } from 'crypto';

export function verifySlackRequest(
    req: Request,
    body: string,
    secret: string
): boolean {
    const signature = req.headers.get('x-slack-signature');
    const timestamp = req.headers.get('x-slack-request-timestamp');

    if (!signature || !timestamp) {
        console.error('[Slack Verify] Missing headers');
        return false;
    }

    // Check if timestamp is too old (replay attack protection) - 5 minutes
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) {
        console.error('[Slack Verify] Timestamp too old');
        return false;
    }

    const sigBasestring = 'v0:' + timestamp + ':' + body;
    const mySignature = 'v0=' + createHmac('sha256', secret)
        .update(sigBasestring, 'utf8')
        .digest('hex');

    const mySigBuffer = Buffer.from(mySignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (mySigBuffer.length !== signatureBuffer.length) {
        console.error('[Slack Verify] Signature length mismatch');
        return false;
    }

    const isValid = timingSafeEqual(mySigBuffer, signatureBuffer);
    if (!isValid) {
        console.error('[Slack Verify] Signature hash mismatch');
    }

    return isValid;
}
