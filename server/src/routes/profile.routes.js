import express from "express";
import { getMyProfile, upsertMyProfile } from "../controllers/profile.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyProfile);
router.put("/me", upsertMyProfile);

export default router;
