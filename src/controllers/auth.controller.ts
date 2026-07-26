import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/validators/common.validator";
import * as authService from "@/services/auth.service";
import prisma from "@/config/prisma";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body);
  const user = await authService.registerUser(name, email, password, phone);
  res.status(201).json({
    success: true,
    message: "Account created. Please check your email to verify your account.",
    data: { id: user.id, name: user.name, email: user.email },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.loginUser(email, password);
  res.status(200).json({
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(email);
  res.status(200).json({ success: true, message: "Password reset email sent if the account exists." });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
  });
  res.status(200).json({ success: true, data: user });
});
