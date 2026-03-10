import express from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { uploadSystemLogo } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", settingsController.getSettings);
router.put(
  "/",
  protect,
  requirePermission("set_manage"),
  uploadSystemLogo.single("logo"),
  settingsController.updateSettings,
);

export default router;
