import { randomBytes } from "node:crypto";

function secret(bytes = 48) {
  return randomBytes(bytes).toString("base64url");
}

const jwt = secret();
const refresh = secret();
const internal = secret(32);

if (jwt === refresh) {
  console.error("JWT_SECRET y JWT_REFRESH_SECRET coincidieron; vuelve a ejecutar");
  process.exit(1);
}

console.log("# Pega estos valores en Render y Vercel. No los guardes en git.");
console.log(`JWT_SECRET=${jwt}`);
console.log(`JWT_REFRESH_SECRET=${refresh}`);
console.log(`INTERNAL_API_KEY=${internal}`);
