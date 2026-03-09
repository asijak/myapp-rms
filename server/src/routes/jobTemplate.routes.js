import express from "express";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "../controllers/jobTemplate.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", requirePermission("vac_create"), getTemplates);
router.post("/", requirePermission("vac_create"), createTemplate);
router.patch("/:id", requirePermission("vac_edit"), updateTemplate);
router.delete("/:id", requirePermission("vac_delete"), deleteTemplate);

export default router;
