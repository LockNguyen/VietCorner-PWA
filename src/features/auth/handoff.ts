// The secrets behind handing a sign-in from one browser to another. Pure, and used on both sides: the
// browser and the server make them, the server checks them.
//
// Two secrets, each known to one party only, and only their SHA-256 travels or is stored:
// - The device that asks to sign in makes a `claimKey` and keeps it. Its hash, the `attempt`, goes into the
//   email link. Only the device holding the key can collect the sign-in, because nobody can work a key out
//   from its hash. (The same idea as PKCE.) One key per device per church day (storage.ts).
// - Our server makes a `linkKey` for each email and puts it only in that email; the table keeps its hash.
//   Tapping a link that carries it is the proof that the tap came from the mailbox.

const HEX_64 = /^[0-9a-f]{64}$/;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

// A new secret: 32 random bytes as 64 hex characters.
export function newSecret(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

// The public name of a secret: its SHA-256, as 64 hex characters. A claim key's is the `attempt`.
export async function hashOf(secret: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))));
}

// Whether a value has the shape of a secret or its hash (they share it). For the routes, which take both
// from strangers.
export function isHex64(value: unknown): value is string {
  return typeof value === "string" && HEX_64.test(value);
}
