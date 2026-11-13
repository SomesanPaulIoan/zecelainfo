export {};

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email?: string;
      role?: "student" | "professor" | "admin";
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
