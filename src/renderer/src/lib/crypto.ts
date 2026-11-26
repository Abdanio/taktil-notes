// Pure Web Crypto API AES-256-GCM + PBKDF2 implementation with zero dependencies

export interface EncryptedData {
  ciphertext: string
  salt: string
  iv: string
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt note content using AES-256-GCM with a user-supplied password or PIN
 */
export async function encryptNoteContent(
  plaintext: string,
  password: string
): Promise<EncryptedData> {
  const enc = new TextEncoder()
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const key = await deriveAesKey(password, salt)

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource
    },
    key,
    enc.encode(plaintext) as unknown as BufferSource
  )

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv)
  }
}

/**
 * Decrypt note content using AES-256-GCM.
 * Throws an Error if the password is incorrect or data has been tampered with.
 */
export async function decryptNoteContent(
  encrypted: EncryptedData,
  password: string
): Promise<string> {
  const salt = base64ToBuffer(encrypted.salt)
  const iv = base64ToBuffer(encrypted.iv)
  const cipherBytes = base64ToBuffer(encrypted.ciphertext)

  const key = await deriveAesKey(password, salt)

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource
      },
      key,
      cipherBytes as unknown as BufferSource
    )

    const dec = new TextDecoder()
    return dec.decode(decryptedBuffer)
  } catch (err) {
    throw new Error('Kata sandi salah atau data terenkripsi tidak valid.')
  }
}
