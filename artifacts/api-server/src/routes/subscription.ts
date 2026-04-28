import { Router, type IRouter } from "express";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const PLANS = [
  {
    id: "free",
    name: "Старт",
    priceRub: 0,
    period: "month",
    description: "Базовый доступ для покупателей и небольших продавцов",
    features: ["До 10 товаров", "Поиск по площадкам", "Чаты", "Лента новостей"],
  },
  {
    id: "pro",
    name: "Pro",
    priceRub: 1490,
    period: "month",
    description: "Для активных продавцов и аналитиков",
    features: [
      "Безлимит товаров",
      "AI-инсайты вчера и сегодня",
      "Полная аналитика по 5 площадкам",
      "Приоритетная поддержка",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceRub: 4990,
    period: "month",
    description: "Командное решение и расширенный API",
    features: [
      "Все из Pro",
      "До 5 пользователей в команде",
      "API для интеграций",
      "Расширенные отчёты и экспорт",
    ],
  },
];

router.get("/subscription/plans", (_req, res) => {
  res.json(PLANS);
});

router.get("/subscription/me", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id));
  if (!sub) {
    res.json({ planId: "free", status: "active", renewsAt: null, plan: PLANS[0] });
    return;
  }
  const plan = PLANS.find((p) => p.id === sub.planId) ?? PLANS[0];
  res.json({
    planId: sub.planId,
    status: sub.status,
    renewsAt: sub.renewsAt.toISOString(),
    plan,
  });
});

router.post("/subscription/subscribe", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { planId } = req.body ?? {};
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "Неизвестный тариф" });
    return;
  }
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);
  await db
    .insert(subscriptionsTable)
    .values({ userId: user.id, planId: plan.id, status: "active", renewsAt })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: { planId: plan.id, status: "active", renewsAt },
    });
  await db.update(usersTable).set({ subscriptionTier: plan.id }).where(eq(usersTable.id, user.id));
  res.json({ planId: plan.id, status: "active", renewsAt: renewsAt.toISOString(), plan });
});

export default router;
