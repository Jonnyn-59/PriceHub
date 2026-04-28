import {
  db,
  usersTable,
  productsTable,
  salesTable,
  marketplaceListingsTable,
  marketplaceOffersTable,
  newsTable,
  preferencesTable,
  serverNodesTable,
  consoleLogTable,
  codeFilesTable,
  auditLogTable,
  subscriptionsTable,
  chatsTable,
  messagesTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword, ALL_DEV_PERMISSIONS, SUPPORT_PERMISSIONS } from "./lib/auth";
import { logger } from "./lib/logger";

const MARKETPLACES = ["Ozon", "Wildberries", "Я.Маркет", "DNS", "AliExpress"] as const;

async function ensureUser(opts: {
  hubId: string;
  password: string;
  displayName: string;
  email?: string;
  role: string;
  permissions?: string[];
  subscriptionTier?: string;
  bio?: string;
  company?: string;
}) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.hubId, opts.hubId));
  if (existing) return existing;
  const [user] = await db
    .insert(usersTable)
    .values({
      hubId: opts.hubId,
      passwordHash: await hashPassword(opts.password),
      displayName: opts.displayName,
      email: opts.email ?? null,
      role: opts.role,
      permissions: opts.permissions ?? [],
      subscriptionTier: opts.subscriptionTier ?? "free",
      bio: opts.bio ?? null,
      company: opts.company ?? null,
    })
    .returning();
  await db.insert(preferencesTable).values({ userId: user.id }).onConflictDoNothing();
  return user;
}

const LISTING_SEED = [
  { name: "iPhone 15 Pro 256 ГБ", brand: "Apple", category: "Электроника", base: 119990, image: "https://images.unsplash.com/photo-1696446702118-31cf17e3f47c?w=600" },
  { name: "Sony WH-1000XM5 наушники", brand: "Sony", category: "Аудио", base: 32990, image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600" },
  { name: "MacBook Air 13 M3 8/256 ГБ", brand: "Apple", category: "Ноутбуки", base: 109990, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600" },
  { name: "Samsung Galaxy S24 256 ГБ", brand: "Samsung", category: "Электроника", base: 79990, image: "https://images.unsplash.com/photo-1610792516775-01de03eae630?w=600" },
  { name: "PlayStation 5 Slim", brand: "Sony", category: "Игры", base: 54990, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600" },
  { name: "Кофемашина De'Longhi Magnifica", brand: "De'Longhi", category: "Бытовая техника", base: 42990, image: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=600" },
  { name: "LG OLED C3 55\"", brand: "LG", category: "Телевизоры", base: 119990, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600" },
  { name: "Dyson V15 Detect беспроводной пылесос", brand: "Dyson", category: "Бытовая техника", base: 64990, image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600" },
  { name: "Кроссовки Nike Air Max 90", brand: "Nike", category: "Одежда", base: 11990, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" },
  { name: "Xiaomi Mi Robot Vacuum X20+", brand: "Xiaomi", category: "Бытовая техника", base: 28990, image: "https://images.unsplash.com/photo-1589894404892-7310b92ea7a2?w=600" },
  { name: "Apple Watch Series 9 GPS 45 мм", brand: "Apple", category: "Электроника", base: 38990, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600" },
  { name: "Nintendo Switch OLED", brand: "Nintendo", category: "Игры", base: 32990, image: "https://images.unsplash.com/photo-1612801799932-b0e3a4c1d2ce?w=600" },
];

async function seedListings() {
  const count = await db.select({ c: sql<number>`count(*)::int` }).from(marketplaceListingsTable);
  if ((count[0]?.c ?? 0) > 0) return;
  for (const item of LISTING_SEED) {
    const [listing] = await db
      .insert(marketplaceListingsTable)
      .values({
        name: item.name,
        brand: item.brand,
        category: item.category,
        description: `${item.name} — официальная гарантия, доставка по всей России.`,
        imageUrl: item.image,
      })
      .returning();
    for (const m of MARKETPLACES) {
      const variance = (Math.random() - 0.5) * 0.18;
      const price = Math.round((item.base * (1 + variance)) / 10) * 10;
      await db.insert(marketplaceOffersTable).values({
        listingId: listing.id,
        marketplace: m,
        price,
        url: `https://example.com/${m.toLowerCase()}/${listing.id}`,
        inStock: Math.random() > 0.15,
        deliveryDays: Math.floor(Math.random() * 5) + 1,
        rating: Math.round((4 + Math.random() * 0.9) * 10) / 10,
      });
    }
  }
}

async function seedSellerData(sellerId: number) {
  const existing = await db.select().from(productsTable).where(eq(productsTable.sellerId, sellerId));
  if (existing.length > 0) return;
  const sellerProducts = [
    { name: "Чехол силиконовый iPhone 15 Pro", price: 1490, cost: 320, marketplace: "Ozon", category: "Аксессуары", stock: 240, image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400" },
    { name: "Зарядное устройство 65 Вт USB-C", price: 2490, cost: 690, marketplace: "Wildberries", category: "Аксессуары", stock: 180, image: "https://images.unsplash.com/photo-1606293926249-ed22b234c0ad?w=400" },
    { name: "Беспроводные наушники TWS Pro", price: 4290, cost: 1280, marketplace: "Я.Маркет", category: "Аудио", stock: 95, image: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400" },
    { name: "Подставка для ноутбука алюминиевая", price: 2890, cost: 720, marketplace: "DNS", category: "Аксессуары", stock: 60, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
    { name: "USB-хаб 7 в 1 USB-C", price: 3490, cost: 980, marketplace: "AliExpress", category: "Аксессуары", stock: 140, image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400" },
    { name: "Кабель USB-C 100W 2 м", price: 990, cost: 220, marketplace: "Ozon", category: "Аксессуары", stock: 320, image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400" },
  ];
  const ids: number[] = [];
  for (const p of sellerProducts) {
    const [row] = await db
      .insert(productsTable)
      .values({
        sellerId,
        name: p.name,
        description: `${p.name} — поставляется напрямую с фабрики. Гарантия 12 месяцев.`,
        price: p.price,
        cost: p.cost,
        currency: "RUB",
        marketplace: p.marketplace,
        category: p.category,
        imageUrl: p.image,
        stock: p.stock,
      })
      .returning();
    ids.push(row.id);
  }
  // Sales for last 14 days
  const now = new Date();
  for (let day = 0; day < 14; day++) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - day);
    const ordersToday = day === 0 ? 12 : day === 1 ? 18 : Math.floor(Math.random() * 10) + 4;
    for (let i = 0; i < ordersToday; i++) {
      const pIdx = Math.floor(Math.random() * sellerProducts.length);
      const p = sellerProducts[pIdx];
      const productId = ids[pIdx];
      const units = Math.floor(Math.random() * 3) + 1;
      const soldAt = new Date(dayDate);
      soldAt.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
      await db.insert(salesTable).values({
        productId,
        sellerId,
        units,
        revenue: p.price * units,
        profit: (p.price - p.cost) * units,
        marketplace: p.marketplace,
        soldAt,
      });
    }
  }
}

async function seedNews() {
  const c = await db.select({ c: sql<number>`count(*)::int` }).from(newsTable);
  if ((c[0]?.c ?? 0) > 0) return;
  const items = [
    { title: "Ozon запустил программу финансирования селлеров до 5 млн ₽", summary: "Новая кредитная линия доступна продавцам со средним оборотом от 200 тыс. ₽ в месяц.", source: "RetailRu", category: "Маркетплейсы" },
    { title: "Wildberries обновил алгоритм ранжирования карточек", summary: "Теперь рейтинг продавца сильнее влияет на позицию в выдаче. Ставка на качество сервиса.", source: "E-pepper", category: "Маркетплейсы" },
    { title: "Я.Маркет вводит динамическое ценообразование для бытовой техники", summary: "Новый инструмент Smart Pricing позволяет автоматически корректировать цены на основе спроса.", source: "Forbes", category: "Технологии" },
    { title: "DNS открыл маркетплейс для сторонних продавцов", summary: "Запуск состоялся в трёх категориях: электроника, аксессуары, бытовая техника.", source: "Коммерсантъ", category: "Маркетплейсы" },
    { title: "AliExpress Россия удвоил инвестиции в логистику", summary: "Запущены три новых склада в Подмосковье общей площадью 60 тыс. м².", source: "VC.ru", category: "Логистика" },
    { title: "Курс рубля повлиял на закупочные цены электроники", summary: "Селлеры готовятся к перерасчёту маржи и пересмотру каталогов.", source: "RBC", category: "Финансы" },
    { title: "Россияне всё чаще сравнивают цены перед покупкой — исследование", summary: "78% покупателей проверяют цену хотя бы на двух площадках. Сервисы сравнения растут.", source: "Mediascope", category: "Аналитика" },
    { title: "PriceHub запустил AI-помощника для продавцов", summary: "Сервис автоматически формирует рекомендации по ценам и закупкам на основе вчерашних продаж.", source: "PriceHub", category: "Платформа" },
  ];
  for (const item of items) {
    const offset = Math.floor(Math.random() * 72);
    const publishedAt = new Date(Date.now() - offset * 60 * 60 * 1000);
    await db.insert(newsTable).values({
      ...item,
      url: "https://pricehub.example/news",
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.title)}/600/360`,
      publishedAt,
    });
  }
}

async function seedNodes() {
  const c = await db.select({ c: sql<number>`count(*)::int` }).from(serverNodesTable);
  if ((c[0]?.c ?? 0) > 0) return;
  const nodes = [
    { id: "node-eu-1", name: "Frankfurt-Edge-1", region: "EU-Central", status: "healthy", cpu: 28, memory: 41, uptimeHours: 412 },
    { id: "node-ru-1", name: "Moscow-Core-1", region: "RU-Central", status: "healthy", cpu: 47, memory: 63, uptimeHours: 192 },
    { id: "node-ru-2", name: "Saint-Petersburg-2", region: "RU-NW", status: "degraded", cpu: 78, memory: 81, uptimeHours: 38 },
    { id: "node-asia-1", name: "Singapore-Edge-1", region: "AP-South", status: "healthy", cpu: 22, memory: 35, uptimeHours: 1024 },
  ];
  for (const n of nodes) await db.insert(serverNodesTable).values(n);
}

async function seedConsole() {
  const c = await db.select({ c: sql<number>`count(*)::int` }).from(consoleLogTable);
  if ((c[0]?.c ?? 0) > 0) return;
  const lines = [
    { level: "info", source: "boot", message: "PriceHub api-server v1.4.2 запущен на порту 8080" },
    { level: "info", source: "db", message: "Postgres pool инициализирован: max=20" },
    { level: "info", source: "scheduler", message: "Запланирован пересбор индекса цен в 03:00 UTC" },
    { level: "warn", source: "marketplace", message: "AliExpress: повышенная задержка ответа 1.4s" },
    { level: "info", source: "ai-insights", message: "Сгенерированы рекомендации для 124 продавцов" },
    { level: "debug", source: "session", message: "Очистка просроченных сессий: удалено 17 записей" },
    { level: "error", source: "marketplace", message: "DNS: 502 Bad Gateway — повторная попытка через 30с" },
    { level: "info", source: "marketplace", message: "DNS: восстановлено соединение" },
    { level: "info", source: "billing", message: "Подписка обновлена: user=ozon_seller, plan=pro" },
    { level: "warn", source: "rate-limit", message: "Wildberries приближение к лимиту: 92% от квоты" },
  ];
  for (const l of lines) await db.insert(consoleLogTable).values(l);
}

async function seedCodeFiles() {
  const c = await db.select({ c: sql<number>`count(*)::int` }).from(codeFilesTable);
  if ((c[0]?.c ?? 0) > 0) return;
  const files = [
    {
      path: "config/pricing.json",
      language: "json",
      content: JSON.stringify(
        {
          marketplaces: ["Ozon", "Wildberries", "Я.Маркет", "DNS", "AliExpress"],
          fees: { Ozon: 0.12, Wildberries: 0.15, "Я.Маркет": 0.13, DNS: 0.08, AliExpress: 0.05 },
          minMargin: 0.18,
        },
        null,
        2,
      ),
    },
    {
      path: "config/feature-flags.json",
      language: "json",
      content: JSON.stringify(
        {
          aiInsightsV2: true,
          marketplaceDns: true,
          chatAttachments: false,
          newSubscriptionPaywall: true,
        },
        null,
        2,
      ),
    },
    {
      path: "scripts/refresh-prices.ts",
      language: "typescript",
      content: `// Запускается каждые 30 минут\nexport async function refreshPrices() {\n  for (const marketplace of MARKETPLACES) {\n    await fetchAndStore(marketplace);\n  }\n}\n`,
    },
    {
      path: "templates/email/welcome.txt",
      language: "txt",
      content: `Здравствуйте, {{displayName}}!\n\nВы успешно зарегистрированы в PriceHub. Ваш Hub ID: {{hubId}}.\n\nКоманда PriceHub.`,
    },
  ];
  for (const f of files) await db.insert(codeFilesTable).values(f);
}

async function seedChat(devId: number, sellerId: number) {
  const a = Math.min(devId, sellerId);
  const b = Math.max(devId, sellerId);
  const [existing] = await db
    .select()
    .from(chatsTable)
    .where(sql`${chatsTable.userAId} = ${a} and ${chatsTable.userBId} = ${b}`);
  if (existing) return;
  const [chat] = await db.insert(chatsTable).values({ userAId: a, userBId: b }).returning();
  const conv = [
    { senderId: sellerId, content: "Здравствуйте! Не приходят данные по продажам с Wildberries за вчера.", offset: 60 },
    { senderId: devId, content: "Добрый день. Сейчас посмотрим, скорее всего синхронизация задержалась.", offset: 55 },
    { senderId: devId, content: "Перезапустил коннектор Wildberries. Данные подтянутся в течение 10 минут.", offset: 50 },
    { senderId: sellerId, content: "Отлично, спасибо! Дайте знать когда будет видно.", offset: 45 },
    { senderId: devId, content: "Готово, проверьте вкладку «Аналитика».", offset: 30 },
  ];
  for (const m of conv) {
    const sentAt = new Date(Date.now() - m.offset * 60 * 1000);
    await db.insert(messagesTable).values({ chatId: chat.id, senderId: m.senderId, content: m.content, sentAt });
  }
  await db.update(chatsTable).set({ lastMessageAt: new Date() }).where(eq(chatsTable.id, chat.id));
}

export async function seed() {
  logger.info("Запуск сидинга PriceHub…");

  const dev = await ensureUser({
    hubId: "Jonny_mainDev007",
    password: "Jonny_r23",
    displayName: "Jonny — Главный разработчик",
    email: "jonny@pricehub.dev",
    role: "developer",
    permissions: ALL_DEV_PERMISSIONS,
    subscriptionTier: "studio",
    bio: "Главный разработчик PriceHub. Доступ ко всем подсистемам.",
    company: "PriceHub Engineering",
  });

  const support = await ensureUser({
    hubId: "support_anya",
    password: "support123",
    displayName: "Анна — Поддержка",
    email: "support@pricehub.ru",
    role: "support",
    permissions: SUPPORT_PERMISSIONS,
  });

  const seller = await ensureUser({
    hubId: "ozon_seller",
    password: "seller123",
    displayName: "Магазин Технополис",
    email: "shop@technopolis.ru",
    role: "seller",
    subscriptionTier: "pro",
    company: "ИП Иванов И.И.",
    bio: "Продаём аксессуары на 5 маркетплейсах.",
  });

  await ensureUser({
    hubId: "buyer_irina",
    password: "buyer123",
    displayName: "Ирина Смирнова",
    email: "irina@example.ru",
    role: "buyer",
  });

  await db
    .insert(subscriptionsTable)
    .values({ userId: seller.id, planId: "pro", status: "active", renewsAt: new Date(Date.now() + 30 * 86400 * 1000) })
    .onConflictDoNothing();
  await db
    .insert(subscriptionsTable)
    .values({ userId: dev.id, planId: "studio", status: "active", renewsAt: new Date(Date.now() + 30 * 86400 * 1000) })
    .onConflictDoNothing();

  await seedListings();
  await seedSellerData(seller.id);
  await seedNews();
  await seedNodes();
  await seedConsole();
  await seedCodeFiles();
  await seedChat(dev.id, seller.id);

  // Audit log entries
  const auditCount = await db.select({ c: sql<number>`count(*)::int` }).from(auditLogTable);
  if ((auditCount[0]?.c ?? 0) === 0) {
    const entries = [
      { actorId: dev.id, actorName: dev.displayName, actorRole: dev.role, action: "system.boot", target: "api-server" },
      { actorId: dev.id, actorName: dev.displayName, actorRole: dev.role, action: "admin.dev.create", target: support.hubId },
      { actorId: support.id, actorName: support.displayName, actorRole: support.role, action: "user.view", target: seller.hubId },
      { actorId: seller.id, actorName: seller.displayName, actorRole: seller.role, action: "product.create", target: "product#1" },
      { actorId: dev.id, actorName: dev.displayName, actorRole: dev.role, action: "admin.code.update", target: "config/feature-flags.json" },
    ];
    for (const e of entries) await db.insert(auditLogTable).values(e);
  }

  logger.info(
    {
      dev: dev.hubId,
      seller: seller.hubId,
      support: support.hubId,
    },
    "Сидинг завершён",
  );
}
