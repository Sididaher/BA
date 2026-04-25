/**
 * Password hashing and verification using PBKDF2-SHA256.
 * Available natively in the Deno crypto.subtle API — no external deps.
 *
 * Stored format: pbkdf2:sha256:100000:<saltHex>:<hashHex>
 */

const ITERATIONS = 100_000
const HASH_BITS  = 256

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? []
  return new Uint8Array(pairs.map(h => parseInt(h, 16)))
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BITS,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt    = crypto.getRandomValues(new Uint8Array(16))
  const derived = await deriveKey(password, salt, ITERATIONS)
  return `pbkdf2:sha256:${ITERATIONS}:${toHex(salt)}:${toHex(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false

  const [, , iterStr, saltHex, storedHashHex] = parts
  const iterations = parseInt(iterStr, 10)
  if (!Number.isFinite(iterations) || iterations <= 0) return false

  const salt    = fromHex(saltHex)
  const derived = await deriveKey(password, salt, iterations)
  const hashHex = toHex(derived)

  // Constant-time comparison
  if (hashHex.length !== storedHashHex.length) return false
  let diff = 0
  for (let i = 0; i < hashHex.length; i++) {
    diff |= hashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i)
  }
  return diff === 0
}
