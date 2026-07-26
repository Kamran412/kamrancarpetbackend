import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";

/** Restricts a route to one or more roles. Must run after requireAuth. */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
};

export const requireAdmin = requireRole(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EDITOR);
export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);
