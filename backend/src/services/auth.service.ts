import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id: string;
  email: string;
  role: "student" | "professor" | "admin";
};

const DEV_JWT_SECRET = "dev_jwt_secret_change_me";

// In productie refuzam pornirea fara un secret real: cu valoarea implicita (publica in repo) oricine ar putea
// semna tokenuri valide pentru orice cont, inclusiv pentru admini.
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!secret || secret === DEV_JWT_SECRET || secret.length < 32)) {
    throw new Error("JWT_SECRET lipseste sau este prea scurt (minim 32 de caractere) in productie.");
  }
  return secret || DEV_JWT_SECRET;
}

const JWT_SECRET = resolveJwtSecret();

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

export function verifyAuthToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
}
