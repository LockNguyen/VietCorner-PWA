// The two values behind handing a sign-in from one browser to another. Pure, and used on both sides: the
// browser makes them, the server checks them.
//
// The device that asks to sign in makes a secret `claimKey` and keeps it. Only its SHA-256, the `attempt`,
// goes into the email link. Whoever opens the link can leave the sign-in under that attempt; only the device
// holding the key can collect it, because nobody can work a key out from its hash. (The same idea as PKCE.)

const HEX_64 = /^[0-9a-f]{64}$/;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

// A new secret: 32 random bytes as 64 hex characters.
export function newClaimKey(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

// The public name of a claim key: its SHA-256, as 64 hex characters.
export async function attemptOf(claimKey: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(claimKey))));
}

// Whether a value has the shape of a claim key or an attempt (they share it). For the routes, which take
// both from strangers.
export function isHex64(value: unknown): value is string {
  return typeof value === "string" && HEX_64.test(value);
}
