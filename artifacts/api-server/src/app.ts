import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? "";
const allowedOrigins = rawAllowedOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const cookieSameSite =
  (process.env.SESSION_COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined) ??
  (isProduction ? "none" : "lax");
const cookieSecure = isProduction
  ? process.env.SESSION_COOKIE_SECURE !== "false"
  : process.env.SESSION_COOKIE_SECURE === "true";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required in production.");
}

if (cookieSameSite === "none" && !cookieSecure) {
  throw new Error('SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAMESITE is "none".');
}

const PgSession = connectPgSimple(session);

void pool
  .query(
    `CREATE TABLE IF NOT EXISTS "user_sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
    ) WITH (OIDS=FALSE);
    CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");`,
  )
  .catch((err) => logger.error({ err }, "Не удалось создать таблицу сессий"));

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
    name: "pricehub.sid",
  }),
);

app.use("/api", router);

export default app;
