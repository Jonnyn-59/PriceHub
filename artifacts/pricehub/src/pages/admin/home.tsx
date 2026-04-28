import { useAdminListUsers, useAdminListProducts, useAdminGetAuditLog } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, Code, Ban, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AdminHome() {
  const { data: users, isLoading: usersLoading } = useAdminListUsers();
  const { data: products, isLoading: productsLoading } = useAdminListProducts();
  const { data: auditLog, isLoading: auditLoading } = useAdminGetAuditLog();

  const stats = {
    buyers: users?.filter(u => u.role === "buyer").length || 0,
    sellers: users?.filter(u => u.role === "seller").length || 0,
    devs: users?.filter(u => u.role === "developer" || u.role === "support").length || 0,
    banned: users?.filter(u => u.banned).length || 0,
    totalProducts: products?.length || 0,
  };

  const recentAudit = auditLog?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground mt-1">Сводка по системе и последние действия.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Покупатели</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersLoading ? <Skeleton className="h-8 w-16" /> : stats.buyers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Продавцы</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersLoading ? <Skeleton className="h-8 w-16" /> : stats.sellers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Разработчики</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersLoading ? <Skeleton className="h-8 w-16" /> : stats.devs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Заблокированы</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{usersLoading ? <Skeleton className="h-8 w-16" /> : stats.banned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsLoading ? <Skeleton className="h-8 w-16" /> : stats.totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Журнал аудита (последние 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentAudit.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">Нет записей аудита.</div>
          ) : (
            <div className="relative border-l border-muted ml-3 space-y-6 pb-4">
              {recentAudit.map((entry) => (
                <div key={entry.id} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1">
                    <span className="font-medium">{entry.actorName}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm:ss", { locale: ru })}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-primary">{entry.action}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-mono bg-muted px-1 py-0.5 rounded">{entry.target}</span>
                  </div>
                  {entry.details && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md font-mono overflow-x-auto whitespace-pre-wrap">
                      {entry.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
