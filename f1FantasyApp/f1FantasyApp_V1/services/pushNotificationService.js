// services/pushNotificationService.js
// APNs push notification delivery via HTTP/2 JWT authentication.
//
// Required environment variables (set in Railway dashboard or .env):
//   APNS_KEY          — contents of your .p8 key file (including BEGIN/END lines)
//   APNS_KEY_ID       — the 10-char Key ID from the Apple Developer portal
//   APNS_TEAM_ID      — your 10-char Apple Developer Team ID
//   APNS_BUNDLE_ID    — your app's bundle identifier, e.g. com.maxfaulkner.f1fantasy
//   APNS_PRODUCTION   — set to "true" for production APNs, otherwise uses sandbox

'use strict';

const http2 = require('http2');
const crypto = require('crypto');

const APNS_HOST_PROD    = 'api.push.apple.com';
const APNS_HOST_SANDBOX = 'api.sandbox.push.apple.com';

let _cachedToken = null;
let _tokenGeneratedAt = 0;

function getApnsJwt() {
  const now = Math.floor(Date.now() / 1000);
  // Reuse token for up to 55 minutes (Apple allows up to 60)
  if (_cachedToken && now - _tokenGeneratedAt < 55 * 60) return _cachedToken;

  const keyId   = process.env.APNS_KEY_ID;
  const teamId  = process.env.APNS_TEAM_ID;
  const keyData = process.env.APNS_KEY;

  if (!keyId || !teamId || !keyData) {
    console.warn('[APNs] APNS_KEY_ID, APNS_TEAM_ID or APNS_KEY not configured — push disabled');
    return null;
  }

  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString('base64url');
  const message = `${header}.${payload}`;

  const key  = crypto.createPrivateKey(keyData);
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  const signature = sign.sign(key, 'base64url');

  _cachedToken = `${message}.${signature}`;
  _tokenGeneratedAt = now;
  return _cachedToken;
}

/**
 * Send a push notification to a single APNs device token.
 * @param {string} deviceToken  - The APNs device token hex string
 * @param {object} notification - { title, body, data? }
 */
async function sendPush(deviceToken, notification) {
  const jwt = getApnsJwt();
  if (!jwt) return; // APNs not configured

  const bundleId = process.env.APNS_BUNDLE_ID || 'com.maxfaulkner.f1fantasy';
  const host     = process.env.APNS_PRODUCTION === 'true' ? APNS_HOST_PROD : APNS_HOST_SANDBOX;

  const payload = JSON.stringify({
    aps: {
      alert: { title: notification.title, body: notification.body },
      sound: 'default',
      badge: 1,
    },
    data: notification.data ?? {},
  });

  return new Promise((resolve) => {
    try {
      const client = http2.connect(`https://${host}`);
      client.on('error', (err) => { console.error('[APNs] Connection error:', err.message); resolve(); });

      const req = client.request({
        ':method': 'POST',
        ':path':   `/3/device/${deviceToken}`,
        ':scheme': 'https',
        ':authority': host,
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      });

      req.setEncoding('utf8');
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const status = req.sentHeaders[':status'] ?? req.headers[':status'];
        if (status !== 200) console.warn('[APNs] Non-200 response:', status, body);
        client.close();
        resolve();
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.error('[APNs] Send error:', err.message);
      resolve();
    }
  });
}

/**
 * Send a push to all users in a list (looks up their push tokens).
 * @param {string[]} userIds
 * @param {object}   notification - { title, body, data? }
 * @param {object}   prisma       - Prisma client instance
 */
async function sendPushToUsers(userIds, notification, prisma) {
  if (!userIds?.length) return;
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, pushToken: { not: null } },
    select: { pushToken: true },
  });
  await Promise.allSettled(users.map(u => sendPush(u.pushToken, notification)));
}

module.exports = { sendPush, sendPushToUsers };
