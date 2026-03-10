import express from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, restrictTo, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard", requirePermission("dash_view"), analyticsController.getDashboard);
router.get("/overview", requirePermission("dash_view"), analyticsController.getOverview);
router.get("/trends", requirePermission("dash_view"), analyticsController.getTrends);
router.get("/demographics", requirePermission("dash_view"), analyticsController.getDemographics);
router.get("/efficiency", requirePermission("dash_view"), analyticsController.getEfficiency);

export default router;
