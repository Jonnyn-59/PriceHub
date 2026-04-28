import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import marketplaceRouter from "./marketplace";
import analyticsRouter from "./analytics";
import newsRouter from "./news";
import chatsRouter from "./chats";
import subscriptionRouter from "./subscription";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(marketplaceRouter);
router.use(analyticsRouter);
router.use(newsRouter);
router.use(chatsRouter);
router.use(subscriptionRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
