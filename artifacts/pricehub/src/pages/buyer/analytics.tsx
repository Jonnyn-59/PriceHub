import { motion } from "framer-motion";
import { useGetBuyerSavingsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, Eye, Percent } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Link } from "wouter";

const formatRub = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

const MARKET_COLORS: Record<string, string> = {
  Ozon: "#0095ff",
  Wildberries: "#a855f7",
  "Я.Маркет": "#facc15",
  DNS: "#fb923c",
  AliExpress: "#ef4444",
};

export default function BuyerAnalytics() {
  const { data, isLoading } = useGetBuyerSavingsSummary();

  if (isLoading || !data) {
    return <div className="text-muted-foreground p-8 text-center">Считаем вашу экономию...</div>;
  }

  const stats = [
    {
      label: "Общая экономия",
      value: formatRub(data.totals.totalSavings),
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Средняя выгода",
      value: `${data.totals.avgSavingsPercent}%`,
      icon: Percent,
      color: "text-primary",
    },
    {
      label: "Отслеживаемых товаров",
      value: data.totals.trackedItems,
      icon: ShoppingBag,
      color: "text-cyan-400",
    },
    {
      label: "Просмотрено товаров",
      value: data.totals.viewedItems,
      icon: Eye,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Моя экономия</h1>
        <p className="text-muted-foreground mt-1">
          Аналитика лучших цен и сэкономленных средств за последний период.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                    <div className="text-2xl font-bold mt-1">{s.value}</div>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Экономия по площадкам</CardTitle>
          </CardHeader>
          <CardContent>
            {data.savingsByMarketplace.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.savingsByMarketplace}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="marketplace" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(v: number) => formatRub(v)}
                  />
                  <Bar dataKey="savings" radius={[8, 8, 0, 0]}>
                    {data.savingsByMarketplace.map((d) => (
                      <Cell key={d.marketplace} fill={MARKET_COLORS[d.marketplace] ?? "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Распределение лучших предложений</CardTitle>
          </CardHeader>
          <CardContent>
            {data.savingsByMarketplace.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.savingsByMarketplace}
                    dataKey="deals"
                    nameKey="marketplace"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {data.savingsByMarketplace.map((d) => (
                      <Cell key={d.marketplace} fill={MARKET_COLORS[d.marketplace] ?? "hsl(var(--primary))"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Свежие выгодные предложения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.recentDeals.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/listing/${d.id}`}>
                  <div
                    className="p-4 rounded-xl border border-border hover-elevate cursor-pointer h-full"
                    data-testid={`card-deal-${d.id}`}
                  >
                    <div className="font-medium line-clamp-2 min-h-[3rem]">{d.name}</div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary">{formatRub(d.lowestPrice)}</span>
                      {(d.savingsPercent ?? 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          -{d.savingsPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
