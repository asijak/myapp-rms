import express from "express";
import { getAllRubrics, getRubricByCategory, upsertRubric } from "../controllers/rubric.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public read — applicants & HR both need to see rubric weights
router.get("/", getAllRubrics);
router.get("/:category", getRubricByCategory);

// Admin write
router.put("/:category", protect, requirePermission("rubric_manage"), upsertRubric);

export default router;
