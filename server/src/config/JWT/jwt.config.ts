import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  githubUsername: string;
  githubId: number;
  firebaseUID: string;
  accessToken?: string;
}

const getSecret = (): string => {
  const secret = process.env.JWT_SERVER_SECREAT;
  if (!secret) {
    throw new Error("JWT_SERVER_SECREAT is not set");
  }
  return secret;
};

const deriveAESKey = (): Buffer => {
  return crypto.createHash("sha256").update(getSecret()).digest();
};

export const encryptSensitive = (value: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveAESKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
};

export const decryptSensitive = (payload: string): string => {
  const raw = Buffer.from(payload, "base64url");
  if (raw.length < 28) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveAESKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

export const decryptStoredGitHubAccessToken = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  try {
    return decryptSensitive(value);
  } catch {
    // Backward compatibility for legacy plain-text values already in the DB.
    return value;
  }
};

export const generateToken = (
  payload: JwtPayload
): string => {
  return jwt.sign(
    payload,
    getSecret(),
    {
      expiresIn: "30d",
    }
  );
};

export const verifyToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    getSecret()
  ) as JwtPayload;
};

export interface VSCodeTokenPayload {
  githubAccessToken?: string;
  uid: string;
  username?: string;
  issuedAt: number;
}

const VSCodeTokenVersion = 2;

export const generateVSCodeToken = (
  payload: VSCodeTokenPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = "30d"
): string => {
  return jwt.sign(
    {
      ...payload,
      v: VSCodeTokenVersion,
    },
    getSecret(),
    {
      algorithm: "HS256",
      expiresIn,
    }
  );
};

export const verifyVSCodeToken = (
  token: string
): VSCodeTokenPayload => {
  const signedToken = token.includes(".") ? token : decryptSensitive(token);
  const decoded = jwt.verify(signedToken, getSecret(), {
    algorithms: ["HS256"],
  }) as Record<string, unknown>;

  let githubAccessToken: string | undefined;
  const gh = decoded.gh;
  if (typeof gh === "string") {
    try {
      githubAccessToken = JSON.parse(decryptSensitive(gh)).githubAccessToken as string | undefined;
    } catch {
      githubAccessToken = undefined;
    }
  }

  return {
    githubAccessToken,
    uid: typeof decoded.uid === "string" ? decoded.uid : "",
    username: typeof decoded.username === "string" ? decoded.username : undefined,
    issuedAt: typeof decoded.issuedAt === "number" ? decoded.issuedAt : Date.now(),
  };
};
