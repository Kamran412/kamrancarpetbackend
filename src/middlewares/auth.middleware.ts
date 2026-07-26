import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import prisma from "@/config/prisma";
import supabaseAdmin from "@/config/supabase";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  supabaseId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Supabase-issued JWT sent in the Authorization header, then
 * loads (or lazily creates) the matching local User record so downstream
 * handlers can rely on req.user.
 *
 * IMPORTANT: this previously used `jwt.verify(token, SUPABASE_JWT_SECRET)`
 * with a manually-configured secret. That secret was never set in .env
 * (only the unrelated app-level JWT_SECRET was), so every real Supabase
 * token failed signature verification and every admin request failed with
 * "Invalid or expired token" — regardless of whether the token was even
 * being sent. Supabase's own SDK (`supabaseAdmin.auth.getUser`) verifies
 * the token against the project directly, which works correctly whether
 * the project signs with the legacy shared secret or the newer per-project
 * signing keys, and doesn't require any extra env var.
 */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or malformed Authorization header");
    }

    const token = header.split(" ")[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    let user = await prisma.user.findUnique({ where: { supabaseId: data.user.id } });

    // A Supabase auth user can exist without a mirrored local User row if
    // it was created directly in the Supabase dashboard, or if signup
    // mirroring failed partway. Rather than hard-failing every request for
    // an otherwise-valid, verified user, lazily create the local record.
    if (!user) {
      user = await prisma.user.create({
        data: {
          supabaseId: data.user.id,
          email: data.user.email ?? "",
          name: (data.user.user_metadata?.name as string) ?? data.user.email ?? "User",
          role: Role.CUSTOMER,
        },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Account has been deactivated");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      supabaseId: user.supabaseId,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

/** Allows the request through if a valid token is present, but does not require one (guest checkout etc). */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();
  try {
    await requireAuth(req, _res, next);
  } catch {
    next();
  }
};
