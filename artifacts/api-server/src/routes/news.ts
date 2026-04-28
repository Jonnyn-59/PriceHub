import { Router, type IRouter } from "express";
import { db, newsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/news", async (_req, res) => {
  const rows = await db.select().from(newsTable).orderBy(desc(newsTable.publishedAt)).limit(40);
  res.json(
    rows.map((n) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
      source: n.source,
      category: n.category,
      url: n.url,
      imageUrl: n.imageUrl,
      publishedAt: n.publishedAt.toISOString(),
    })),
  );
});

export default router;
