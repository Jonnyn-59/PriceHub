import { Router, type IRouter } from "express";
import { db, salesTable, usersTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get("/analytics/summary", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.sellerId, user.id));

  const inRange = (d: Date, a: Date, b: Date) => d >= a && d < b;
  const sum = (arr: typeof rows) => ({
    revenue: arr.reduce((s, r) => s + r.revenue, 0),
    profit: arr.reduce((s, r) => s + r.profit, 0),
    units: arr.reduce((s, r) => s + r.units, 0),
    orders: arr.length,
  });
  const todayRows = rows.filter((r) => inRange(r.soldAt, today, tomorrow));
  const yesterdayRows = rows.filter((r) => inRange(r.soldAt, yesterday, today));
  const t = sum(todayRows);
  const y = sum(yesterdayRows);
  res.json({
    today: t,
    yesterday: y,
    revenueDelta: y.revenue ? Math.round(((t.revenue - y.revenue) / y.revenue) * 1000) / 10 : 0,
    profitDelta: y.profit ? Math.round(((t.profit - y.profit) / y.profit) * 1000) / 10 : 0,
    unitsDelta: y.units ? Math.round(((t.units - y.units) / y.units) * 1000) / 10 : 0,
  });
});

router.get("/analytics/sales", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const rows = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.sellerId, user.id), gte(salesTable.soldAt, since)));

  const byDay = new Map<string, { revenue: number; profit: number; units: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { revenue: 0, profit: 0, units: 0 });
  }
  for (const r of rows) {
    const key = r.soldAt.toISOString().slice(0, 10);
    const cur = byDay.get(key);
    if (cur) {
      cur.revenue += r.revenue;
      cur.profit += r.profit;
      cur.units += r.units;
    }
  }
  const series = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));

  const byMarket = new Map<string, { revenue: number; profit: number; units: number }>();
  for (const r of rows) {
    const cur = byMarket.get(r.marketplace) ?? { revenue: 0, profit: 0, units: 0 };
    cur.revenue += r.revenue;
    cur.profit += r.profit;
    cur.units += r.units;
    byMarket.set(r.marketplace, cur);
  }
  const marketplaces = Array.from(byMarket.entries()).map(([marketplace, v]) => ({
    marketplace,
    ...v,
  }));

  res.json({ series, marketplaces });
});

router.get("/analytics/ai-insights", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = await db.select().from(salesTable).where(eq(salesTable.sellerId, user.id));
  const tRows = rows.filter((r) => r.soldAt >= today && r.soldAt < tomorrow);
  const yRows = rows.filter((r) => r.soldAt >= yesterday && r.soldAt < today);

  const sum = (arr: typeof rows) => arr.reduce((s, r) => s + r.revenue, 0);
  const tRev = sum(tRows);
  const yRev = sum(yRows);

  const topMarket = (arr: typeof rows): string | null => {
    const m = new Map<string, number>();
    for (const r of arr) m.set(r.marketplace, (m.get(r.marketplace) ?? 0) + r.revenue);
    let best: [string, number] | null = null;
    for (const e of m.entries()) if (!best || e[1] > best[1]) best = e;
    return best?.[0] ?? null;
  };

  const yMarket = topMarket(yRows);
  const tMarket = topMarket(tRows);

  res.json({
    yesterday: {
      headline:
        yRev > 0
          ? `Выручка ${Math.round(yRev).toLocaleString("ru-RU")} ₽ за вчера`
          : "Вчера продаж не было",
      summary:
        yRev > 0
          ? `Лидер по продажам — ${yMarket ?? "—"}. ${yRows.length} заказов на ${yRows.length} позициях.`
          : "Стоит проверить актуальность остатков и цены — это поможет вернуть трафик.",
      recommendations:
        yRev > 0
          ? [
              `Подними цены на ${yMarket ?? "топ-площадке"} на 3–5% — спрос держится.`,
              "Запусти промо на залежавшиеся товары до конца недели.",
              "Проверь конверсию карточек с фото ниже среднего рейтинга.",
            ]
          : [
              "Перепроверь остатки на складах.",
              "Сравни цены с конкурентами в категории.",
              "Запусти баннер-промо на 24 часа.",
            ],
      sentiment: yRev > 0 ? "positive" : "warning",
    },
    today: {
      headline:
        tRev >= yRev
          ? `Сегодняшний темп +${yRev ? Math.round(((tRev - yRev) / yRev) * 100) : 0}%`
          : `Сегодня темп ниже на ${yRev ? Math.round(((yRev - tRev) / yRev) * 100) : 0}%`,
      summary: tMarket
        ? `Прямо сейчас лидирует ${tMarket}. Продано ${tRows.reduce((s, r) => s + r.units, 0)} единиц.`
        : "Сегодня пока тихо — самое время оживить витрины.",
      recommendations: [
        tMarket ? `Ускорь обработку заказов на ${tMarket}.` : "Опубликуй пост о новинках.",
        "Запусти точечную рекламу на топ-3 SKU.",
        "Проверь чат с покупателями — есть ли ожидающие сообщения.",
      ],
      sentiment: tRev >= yRev ? "positive" : "neutral",
    },
  });
});

export default router;
