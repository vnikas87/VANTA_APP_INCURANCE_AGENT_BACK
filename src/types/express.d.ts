import 'express';

export type AuthenticatedUser = {
  sub: string;
  dbUserId: number;
  username?: string;
  email?: string;
  roles: string[];
  tokenPayload: Record<string, unknown>;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
