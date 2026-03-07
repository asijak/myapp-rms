import express from "express";
import * as appController from "../controllers/application.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// User routes
router.post("/apply", appController.applyToJob);
router.get("/my-applications", appController.getMyApplications);
router.patch("/:id/applicant-data", appController.updateApplicantData);

// Admin routes
router.get("/job/:jobId", requirePermission("application_view"), appController.getJobApplications);
router.get("/:id", requirePermission("application_view"), appController.getApplicationById);
router.patch("/:id/rating",   requirePermission("application_manage"), appController.updateHrRating);
router.patch("/:id/evaluate", requirePermission("application_manage"), appController.evaluateApplication);
router.patch("/:id/status",   requirePermission("application_manage"), appController.updateApplicationStatus);

export default router;
