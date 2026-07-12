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
  role?: Role;
  status?: UserStatus;
  sort?: UserSort;
  page?: number;
  pageSize?: number;
}

export type UserSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "orders-desc";

export interface PaginatedUsers {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
}

const DEFAULT_USER_PAGE_SIZE = 20;

function userOrderBy(sort: UserSort = "newest") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "name-asc":
      return { name: "asc" as const };
    case "name-desc":
      return { name: "desc" as const };
    case "orders-desc":
      return { orders: { _count: "desc" as const } };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

function buildUserWhere(query: UserListQuery) {
  const search = query.search?.trim();

  return {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

/** Safe user list for admin (never includes password hash). */
export async function getUsers(query: UserListQuery = {}): Promise<UserListItem[]> {
  const result = await getUsersPaginated(query);
  return result.items;
}

export async function getUsersPaginated(
  query: UserListQuery = {},
): Promise<PaginatedUsers> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    50,
    Math.max(1, query.pageSize ?? DEFAULT_USER_PAGE_SIZE),
  );
  const where = buildUserWhere(query);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: userOrderBy(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminUserStats(): Promise<AdminUserStats> {
  const [total, active, suspended, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return { total, active, suspended, admins };
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
