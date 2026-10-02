import { Router } from "express";

import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../controllers/settings.controller.js";

const router = Router();

/* =====================================================
   GET SETTINGS
===================================================== */

router.get(
  "/",
  getSettings,
);

/* =====================================================
   UPDATE SETTINGS
===================================================== */

router.put(
  "/",
  updateSettings,
);

/* =====================================================
   RESET SETTINGS
===================================================== */

router.post(
  "/reset",
  resetSettings,
);

export default router;