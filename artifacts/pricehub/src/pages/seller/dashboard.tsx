import { useGetSellerSummary, useGetSalesAnalytics, useGetAiInsights, useListNews } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Lightbulb, Activity, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetSellerSummary();
  const { data: analytics, isLoading: loadingAnalytics } = useGetSalesAnalytics();
  const { data: insights, isLoading: loadingInsights } = useGetAiInsights();
  const { data: news } = useListNews();

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽';
  
  const getDelta = (today: number, yesterday: number) => {
    if (!yesterday) return { value: 0, isPositive: true };
    const percent = ((today - yesterday) / yesterday) * 100;
    return { value: Math.abs(percent).toFixed(1), isPositive: percent >= 0 };
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Обзор продаж</h1>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[1,2,3,4].map(i => <Card key={i} className="h-32 bg-muted" />)}
        </div>
      ) : summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Выручка сегодня</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(summary.revenueToday)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {(() => {
                  const d = getDelta(summary.revenueToday, summary.revenueYesterday);
                  return (
                    <span className={`flex items-center ${d.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {d.isPositive ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                      {d.value}% к вчерашнему дню
                    </span>
                  );
                })()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Прибыль сегодня</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatCurrency(summary.profitToday)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {(() => {
                  const d = getDelta(summary.profitToday, summary.profitYesterday);
                  return (
                    <span className={`flex items-center ${d.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {d.isPositive ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                      {d.value}% к вчерашнему дню
                    </span>
                  );
                })()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Продано единиц</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.unitsToday} шт.</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {(() => {
                  const d = getDelta(summary.unitsToday, summary.unitsYesterday);
                  return (
                    <span className={`flex items-center ${d.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {d.isPositive ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                      {d.value}% к вчерашнему дню
                    </span>
                  );
                })()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Средняя по всем товарам</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-8">
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Динамика выручки</CardTitle>
            <CardDescription>За последние 14 дней</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : analytics ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.series}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(val) => `${val / 1000}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Выручка']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-3">
          <CardHeader>
            <CardTitle>По маркетплейсам</CardTitle>
            <CardDescription>Доля выручки</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : analytics ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.marketplaceBreakdown} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="marketplace" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {analytics.marketplaceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {insights && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className={`border-l-4 ${insights.yesterday.sentiment === 'positive' ? 'border-l-emerald-500' : insights.yesterday.sentiment === 'negative' ? 'border-l-rose-500' : 'border-l-primary'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div variant="outline" className="font-mono text-xs">Анализ вчерашнего дня</div>
                <Lightbulb className="w-4 h-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mt-2">{insights.yesterday.headline}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{insights.yesterday.summary}</p>
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Рекомендации:</div>
                <ul className="space-y-1 text-sm">
                  {insights.yesterday.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <ArrowRight className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${insights.today.sentiment === 'positive' ? 'border-l-emerald-500' : insights.today.sentiment === 'negative' ? 'border-l-rose-500' : 'border-l-primary'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">Прогноз на сегодня</Badge>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mt-2">{insights.today.headline}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{insights.today.summary}</p>
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Что сделать сейчас:</div>
                <ul className="space-y-1 text-sm">
                  {insights.today.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <ArrowRight className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {news && news.length > 0 && (
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Важные новости площадок</CardTitle>
              <Link href="/news" className="text-sm text-primary hover:underline">Все новости</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {news.slice(0, 4).map(item => (
                <div key={item.id} className="min-w-[300px] max-w-[300px] border border-border rounded-lg p-4 snap-start shrink-0 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">{item.source}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(item.publishedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <h4 className="font-medium line-clamp-2 mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{item.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
