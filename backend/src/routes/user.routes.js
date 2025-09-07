import express from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  userProfile,
  resetPassword,
  resetPasswordToken,
  forgotPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  generalRateLimiter,
  loginRateLimiter,
} from "../middlewares/rateLimiting.middleware.js";
const router = express.Router();

// general rate limiting
router.use(generalRateLimiter);

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.post("/login", loginRateLimiter, loginUser);
router.post("/logout", verifyJWT, logOutUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, userProfile);
router.post("/reset-password", loginRateLimiter, verifyJWT, resetPassword);
router.post("/forgot-password", loginRateLimiter, forgotPassword);
router.post("/reset-password-token", loginRateLimiter, resetPasswordToken);
export default router;
