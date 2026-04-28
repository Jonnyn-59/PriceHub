import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export const PERMISSIONS = {
  USERS_VIEW: "users:view",
  USERS_EDIT: "users:edit",
  USERS_BAN: "users:ban",
  USERS_DELETE: "users:delete",
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",
  DEVS_CREATE: "devs:create",
  DEVS_EDIT: "devs:edit",
  SERVER_VIEW: "server:view",
  SERVER_RESTART: "server:restart",
  CODE_VIEW: "code:view",
  CODE_EDIT: "code:edit",
  CONSOLE_VIEW: "console:view",
  AUDIT_VIEW: "audit:view",
  HISTORY_VIEW: "history:view",
} as const;

export function useCan(scope: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === "developer") return true;
  return user.permissions.includes(scope) || user.permissions.includes("all");
}

export function Can({ scope, children }: { scope: string; children: ReactNode }) {
  const can = useCan(scope);
  if (!can) return null;
  return <>{children}</>;
}
