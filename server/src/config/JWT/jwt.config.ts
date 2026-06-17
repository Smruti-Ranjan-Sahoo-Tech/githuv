import jwt from "jsonwebtoken";

export interface JwtPayload {
  githubUsername: string;
  githubId: number;
  firebaseUID: string;
  accessToken?: string;
}

export const generateToken = (
  payload: JwtPayload
): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SERVER_SECREAT!,
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
    process.env.JWT_SERVER_SECREAT!
  ) as JwtPayload;
};