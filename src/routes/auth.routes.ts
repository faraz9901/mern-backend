import { Router } from "express";
import { register, verifyEmail, login, verifyTwoFactor, logout } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/verify-2fa", verifyTwoFactor);
router.post("/logout", logout);

export default router;
