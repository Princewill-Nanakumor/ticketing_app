"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/sentry";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import {
  getUpdateUserFieldErrors,
  updateUserSchema,
  type UpdateUserState,
} from "@/app/actions/users-schema";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { tickets: true },
  },
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    return null;
  }

  return user;
}

export async function getUsers() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      await logEvent(
        "Unauthorized access to user list",
        "user",
        {},
        "warning",
      );
      return [];
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });

    await logEvent(
      "Fetched all users",
      "user",
      { count: users.length, adminId: admin.id },
      "info",
    );

    return users;
  } catch (error) {
    await logEvent("Error fetching users", "user", {}, "error", error);
    return [];
  }
}

export async function getUserById(id: string) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      await logEvent(
        "Unauthorized access to user details",
        "user",
        { userId: id },
        "warning",
      );
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      await logEvent("User not found", "user", { userId: id }, "warning");
      return null;
    }

    return user;
  } catch (error) {
    await logEvent(
      "Error fetching user",
      "user",
      { userId: id },
      "error",
      error,
    );
    return null;
  }
}

export async function updateUser(
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const admin = await requireAdmin();

  if (!admin) {
    return {
      success: false,
      message: "You must be an admin to edit users.",
    };
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password") || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors above.",
      errors: getUpdateUserFieldErrors(parsed.error),
    };
  }

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  let role = parsed.data.role;
  const password = parsed.data.password ?? "";

  // Keep the designated admin email as ADMIN.
  if (isAdminEmail(email)) {
    role = "ADMIN";
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (emailTaken) {
      return {
        success: false,
        message: "An account with that email exists.",
        errors: { email: "An account with that email exists." },
      };
    }

    if (existing.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

      if (adminCount <= 1) {
        return {
          success: false,
          message: "You cannot remove the last admin.",
          errors: { role: "You cannot remove the last admin." },
        };
      }
    }

    if (isAdminEmail(existing.email) && !isAdminEmail(email)) {
      return {
        success: false,
        message: "The primary admin email cannot be changed.",
        errors: { email: "The primary admin email cannot be changed." },
      };
    }

    const data: {
      name: string;
      email: string;
      role: "USER" | "ADMIN";
      passwordHash?: string;
    } = { name, email, role };

    if (password.length > 0) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);

    await logEvent(
      "User updated",
      "user",
      { userId, adminId: admin.id, role },
      "info",
    );

    return {
      success: true,
      message: "User updated successfully.",
    };
  } catch (error) {
    await logEvent(
      "User update failed",
      "user",
      { userId, adminId: admin.id },
      "error",
      error,
    );

    return {
      success: false,
      message: "Could not update the user. Please try again.",
    };
  }
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    redirect("/users");
  }

  if (userId === admin.id) {
    await logEvent(
      "Admin attempted to delete own account",
      "user",
      { userId, adminId: admin.id },
      "warning",
    );
    redirect("/users");
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      redirect("/users");
    }

    if (isAdminEmail(existing.email)) {
      await logEvent(
        "Attempted to delete primary admin",
        "user",
        { userId, adminId: admin.id },
        "warning",
      );
      redirect("/users");
    }

    if (existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

      if (adminCount <= 1) {
        await logEvent(
          "Attempted to delete last admin",
          "user",
          { userId, adminId: admin.id },
          "warning",
        );
        redirect("/users");
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/users");
    revalidatePath("/tickets");

    await logEvent(
      "User deleted",
      "user",
      { userId, adminId: admin.id },
      "info",
    );
  } catch (error) {
    await logEvent(
      "User delete failed",
      "user",
      { userId, adminId: admin.id },
      "error",
      error,
    );
  }

  redirect("/users");
}
