const crypto = require('crypto');

function decryptIfNeeded({ plain, encrypted, key }) {
  if (plain) return plain.trim();
  if (!encrypted) return '';
  if (!key) throw new Error('MP_DECRYPT_KEY is required to decrypt MP_ACCESS_TOKEN_ENC');
  // expected format: iv:cipher:tag (all base64)
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format. Expected iv:cipher:tag');
  const [ivB64, cipherB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const cipherText = Buffer.from(cipherB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'utf8'), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8').trim();
}

function getMpToken() {
  try {
    const plain = process.env.MP_ACCESS_TOKEN || '';
    const encrypted = process.env.MP_ACCESS_TOKEN_ENC || '';
    const key = process.env.MP_DECRYPT_KEY || '';
    return decryptIfNeeded({ plain, encrypted, key });
  } catch (e) {
    console.error('Failed to obtain Mercado Pago token:', e.message);
    return '';
  }
}

module.exports = { getMpToken };