import { Router, type IRouter } from "express";
import { db, chatsTable, messagesTable, usersTable } from "@workspace/db";
import { and, asc, desc, eq, ne, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/chats", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const rows = await db
    .select()
    .from(chatsTable)
    .where(or(eq(chatsTable.userAId, user.id), eq(chatsTable.userBId, user.id)))
    .orderBy(desc(chatsTable.lastMessageAt));

  const result = await Promise.all(
    rows.map(async (c) => {
      const otherId = c.userAId === user.id ? c.userBId : c.userAId;
      const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
      const [last] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.chatId, c.id))
        .orderBy(desc(messagesTable.sentAt))
        .limit(1);
      return {
        id: c.id,
        peer: other
          ? {
              id: other.id,
              hubId: other.hubId,
              displayName: other.displayName,
              role: other.role,
              avatarUrl: other.avatarUrl,
            }
          : null,
        lastMessage: last
          ? { content: last.content, sentAt: last.sentAt.toISOString(), senderId: last.senderId }
          : null,
        lastMessageAt: c.lastMessageAt.toISOString(),
      };
    }),
  );
  res.json(result);
});

router.post("/chats", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { peerId } = req.body ?? {};
  if (!peerId || peerId === user.id) {
    res.status(400).json({ error: "Неверный собеседник" });
    return;
  }
  const a = Math.min(user.id, Number(peerId));
  const b = Math.max(user.id, Number(peerId));
  const [existing] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.userAId, a), eq(chatsTable.userBId, b)));
  let chat = existing;
  if (!chat) {
    [chat] = await db.insert(chatsTable).values({ userAId: a, userBId: b }).returning();
  }
  res.json({ id: chat.id });
});

router.get("/chats/:id/messages", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
  if (!chat || (chat.userAId !== user.id && chat.userBId !== user.id)) {
    res.status(404).json({ error: "Чат не найден" });
    return;
  }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, id))
    .orderBy(asc(messagesTable.sentAt));
  res.json(
    msgs.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      sentAt: m.sentAt.toISOString(),
    })),
  );
});

router.post("/chats/:id/messages", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = Number(req.params.id);
  const { content } = req.body ?? {};
  if (!content) {
    res.status(400).json({ error: "Пустое сообщение" });
    return;
  }
  const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
  if (!chat || (chat.userAId !== user.id && chat.userBId !== user.id)) {
    res.status(404).json({ error: "Чат не найден" });
    return;
  }
  const [msg] = await db
    .insert(messagesTable)
    .values({ chatId: id, senderId: user.id, content })
    .returning();
  await db.update(chatsTable).set({ lastMessageAt: new Date() }).where(eq(chatsTable.id, id));
  res.json({
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    content: msg.content,
    sentAt: msg.sentAt.toISOString(),
  });
});

router.get("/chats/contacts", requireAuth, async (req, res) => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const rows = await db.select().from(usersTable).where(ne(usersTable.id, user.id)).limit(40);
  res.json(
    rows.map((u) => ({
      id: u.id,
      hubId: u.hubId,
      displayName: u.displayName,
      role: u.role,
      avatarUrl: u.avatarUrl,
    })),
  );
});

export default router;
