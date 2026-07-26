import supabaseAdmin from "@/config/supabase";
import prisma from "@/config/prisma";
import { ApiError } from "@/utils/ApiError";
import { Role } from "@prisma/client";

export async function registerUser(name: string, email: string, password: string, phone?: string) {
  // 1. Create the user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // Supabase sends its own verification email
    user_metadata: { name },
  });

  if (error || !data.user) {
    throw ApiError.badRequest(error?.message ?? "Failed to create account");
  }

  // 2. Mirror the user in our own database for relational data (orders, wishlist, etc.)
  const user = await prisma.user.create({
    data: {
      supabaseId: data.user.id,
      name,
      email,
      phone,
      role: Role.CUSTOMER,
    },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Account not found. Please contact support.");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user,
  };
}

export async function loginWithGoogleCallback(supabaseUserId: string, email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { supabaseId: supabaseUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: { supabaseId: supabaseUserId, email, name, role: Role.CUSTOMER },
    });
  }
  return user;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL}/reset-password`,
  });
  if (error) {
    throw ApiError.badRequest(error.message);
  }
}
