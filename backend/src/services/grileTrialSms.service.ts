import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

const SMSLINK_DEFAULT_URL = "https://secure.smslink.ro/sms/gateway/communicate/json.php";

type SmslinkJsonResponse = {
  response_type?: string;
  response_id?: string;
  response_message?: string;
};

/** Normalizeaza la E.164 (ex. +40722111222). */
export function normalizePhoneToE164(raw: string, defaultCountry: "RO" = "RO"): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid()) return null;
  return parsed.format("E.164");
}

/** SMSLink accepta 07..., +40..., etc.; folosim format national fara spatii. */
export function phoneE164ToSmslinkTo(phoneE164: string): string | null {
  const parsed = parsePhoneNumberFromString(phoneE164);
  if (!parsed?.isValid()) return null;
  return parsed.formatNational().replace(/\D/g, "");
}

export function isGrileTrialSmsConfigured(): boolean {
  const id = process.env.SMSLINK_CONNECTION_ID?.trim() ?? "";
  const pass = process.env.SMSLINK_CONNECTION_PASSWORD?.trim() ?? "";
  return Boolean(id && pass);
}

export function hashTrialSmsOtp(userId: string, phoneE164: string, code: string): string {
  const pepper =
    (process.env.GRILE_TRIAL_SMS_OTP_PEPPER?.trim() ||
      process.env.SMSLINK_CONNECTION_PASSWORD?.trim() ||
      "change-me-in-production") ?? "change-me-in-production";
  return createHash("sha256").update(`${pepper}\n${userId}\n${phoneE164}\n${code.trim()}`).digest("hex");
}

export function generateSixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function trialSmsCodeMatchesStored(storedSha256Hex: string, userId: string, phoneE164: string, code: string): boolean {
  const candidateHex = hashTrialSmsOtp(userId, phoneE164, code);
  try {
    const a = Buffer.from(storedSha256Hex, "hex");
    const b = Buffer.from(candidateHex, "hex");
    if (a.length !== b.length || a.length !== 32) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Trimite SMS prin SMSLink.ro (JSON Gateway).
 * @see https://www.smslink.ro/sms-gateway-json-parametrii-asociati-endpoint-urilor.html
 */
export async function smslinkSendTransactionalSms(params: {
  toNationalDigits: string;
  message: string;
  /** 1 = simulare (fara SMS real), conform documentatiei SMSLink */
  testMode?: boolean;
}): Promise<void> {
  const connectionId = process.env.SMSLINK_CONNECTION_ID?.trim() ?? "";
  const password = process.env.SMSLINK_CONNECTION_PASSWORD?.trim() ?? "";
  const url = (process.env.SMSLINK_API_URL?.trim() || SMSLINK_DEFAULT_URL).trim();
  if (!connectionId || !password) {
    throw new Error("SMSLINK_NOT_CONFIGURED");
  }

  const test =
    params.testMode === true ||
    process.env.SMSLINK_TEST_MODE === "1" ||
    process.env.SMSLINK_TEST_MODE === "true";

  const body: Record<string, string | number> = {
    connection_id: connectionId,
    password,
    to: params.toNationalDigits,
    message: params.message,
    test: test ? 1 : 0,
  };
  const sender = process.env.SMSLINK_SENDER?.trim();
  if (sender) {
    body.sender = sender;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let json: SmslinkJsonResponse;
  try {
    json = JSON.parse(raw) as SmslinkJsonResponse;
  } catch {
    throw new Error(`SMSLINK_BAD_RESPONSE: ${raw.slice(0, 240)}`);
  }
  if (json.response_type !== "MESSAGE") {
    const msg = json.response_message ?? raw.slice(0, 200);
    throw new Error(msg);
  }
}
