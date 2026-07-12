import { prisma } from "@/lib/prisma";
import type { Role, UserStatus } from "@/generated/prisma/enums";

export interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  orderCount: number;
  createdAt: string;
}

export interface UserListQuery {
  search?: string;
}

/** Safe user list for admin (never includes password hash). */
export async function getUsers(query: UserListQuery = {}): Promise<UserListItem[]> {
  const search = query.search?.trim();
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    orderCount: user._count.orders,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}
