import { useRoute } from "wouter";
import {
  useAdminGetSellerHistory,
  getAdminGetSellerHistoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Package, Activity, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

export default function AdminSellerHistory() {
  const [, params] = useRoute("/admin/seller-history/:id");
  const id = Number(params?.id);
  const { data, isLoading } = useAdminGetSellerHistory(id, {
    query: {
      enabled: !!id,
      queryKey: getAdminGetSellerHistoryQueryKey(id),
    },
  });

  if (isLoading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const { seller, products, actions, salesSeries, totals } = data as any;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-mono">
              {seller.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold tracking-tight">{seller.displayName}</div>
            <div className="text-sm font-mono text-muted-foreground mt-1">
              {seller.hubId} · {seller.email ?? "без email"}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="font-mono">{seller.role}</Badge>
              <Badge variant="secondary" className="font-mono uppercase">
                {seller.subscriptionTier}
              </Badge>
              {seller.banned && (
                <Badge variant="destructive" className="font-mono">заблокирован</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <div className="text-xs uppercase text-muted-foreground font-mono">Выручка 30д</div>
              <div className="text-xl font-bold font-mono">{fmt(totals.revenue30d)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground font-mono">Прибыль 30д</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {fmt(totals.profit30d)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground font-mono">Заказов</div>
              <div className="text-xl font-bold font-mono">{totals.orders30d}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground font-mono">Товаров</div>
              <div className="text-xl font-bold font-mono">{totals.products}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" /> Динамика выручки за 14 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(v: number) => fmt(v)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" /> Товары ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.length === 0 && (
              <div className="text-sm text-muted-foreground">Нет товаров</div>
            )}
            {products.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs font-mono text-muted-foreground">{p.marketplace}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-medium">{fmt(p.price)}</div>
                  <div className="text-xs text-muted-foreground font-mono">остаток {p.stock}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" /> Последние действия ({actions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Нет действий</div>
            ) : (
              <div className="relative border-l border-border ml-2 space-y-4 pb-2">
                {actions.map((a: any) => (
                  <div key={a.id} className="relative pl-5">
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <div className="text-xs font-mono text-muted-foreground">
                      {format(new Date(a.createdAt), "dd MMM HH:mm", { locale: ru })}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-primary font-mono">{a.action}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="font-mono text-xs">{a.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
