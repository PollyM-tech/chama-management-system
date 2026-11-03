import { generateKeyPairSync } from "node:crypto";
import { writeFileSync } from "node:fs";

const output = process.argv[2] ?? ".env.auth-keys";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const privatePem = privateKey
  .export({ type: "pkcs8", format: "pem" })
  .trimEnd()
  .replace(/\n/g, " ");
const jwks = JSON.stringify({
  keys: [{ use: "sig", ...publicKey.export({ format: "jwk" }) }],
});

// Dotenv strips the single quotes but preserves the JSON's double quotes.
// JSON.stringify(jwks) here would leave escaped quotes in the deployed value.
writeFileSync(
  output,
  `JWT_PRIVATE_KEY="${privatePem}"\nJWKS='${jwks}'\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(`Generated signing keys in ${output}. Keep this file private.`);
