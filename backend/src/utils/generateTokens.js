import { User } from "../models/user.model.js";

export const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const accessToken = await user.generateToken();
    const refreshToken = await user.generateRefreshToken();
    if (!accessToken || !refreshToken) {
      throw new Error("Failed to generate tokens: Invalid token output");
    }
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error.message);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

export const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
