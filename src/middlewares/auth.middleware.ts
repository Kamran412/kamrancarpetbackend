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

async function resolveUserFromToken(header: string | undefined): Promise<AuthUser> {
  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.split(" ")[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  let user = await prisma.user.findUnique({ where: { supabaseId: data.user.id } });

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

  return { id: user.id, email: user.email, role: user.role, supabaseId: user.supabaseId };
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.user = await resolveUserFromToken(req.headers.authorization);
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

/**
 * Request ko chalne deta hai chahe token ho ya na ho, valid ho ya na ho —
 * bas jab bhi milta hai to req.user bhar deta hai.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers.authorization) return next();
  try {
    req.user = await resolveUserFromToken(req.headers.authorization);
  } catch {
    // invalid/expired token — guest jaisa treat karo, request fail mat karo
  }
  next();
};