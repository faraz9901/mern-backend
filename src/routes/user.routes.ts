import { Router } from "express";
import { protect } from "../middlewares/protect.middleware";
import { getMe, updateProfile, enableTwoFactor, disableTwoFactor } from "../controllers/user.controller";

const router = Router();

router.use(protect);

router.get("/me", getMe);
router.put("/profile", updateProfile);
router.post("/2fa/enable", enableTwoFactor);
router.post("/2fa/disable", disableTwoFactor);

export default router;
