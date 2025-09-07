import { User } from "../models/user.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions, generateTokens } from "../utils/generateTokens.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  validateResetPasswordInput,
  validateUserInput,
} from "../validation/validateUserInput.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadToSupabase } from "../utils/superbase.js";

export const registerUser = asyncHandler(async (req, res) => {
  // Get data from body
  const { username, email, fullname, password } = req.body;

  // Validate data
  const validationErrors = validateUserInput({
    username,
    email,
    fullname,
    password,
  });
  if (validationErrors.length > 0) {
    throw throwApiError(400, validationErrors.join(", "));
  }
  // user already exists or not
  const existingUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existingUser) {
    throw throwApiError(409, "User with this email or username already exists");
  }
  // handle file upload if present
  const index = Math.floor(Math.random() * 100) + 1;
  const randomAvatar = `https://avatar.iran.liara.run/public/${index}.png`;
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const avatarFile = req.files?.avatar?.[0];
  let avatarUrl = randomAvatar;

  if (avatarLocalPath && avatarFile) {
    const uploadResult = await uploadToSupabase(avatarFile, "avatars");
    if (uploadResult?.url) {
      avatarUrl = uploadResult.url;
    } else {
      console.warn("Supabase upload failed, assigning random avatar");
    }
  }

  // Create user
  try {
    const user = await User.create({
      fullname,
      avatar: avatarUrl,
      email,
      password,
      username: username.toLowerCase(),
    });
    const createdUser = user.toObject();
    delete createdUser.password;
    delete createdUser.refreshToken;

    return sendResponse(res, 201, createdUser, "User Registered Successfully");
  } catch (error) {
    console.log(error.message, "Error while registering the user");

    throw throwApiError(500, "Something went wrong while creating the user");
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username && !email) {
    throw throwApiError(400, "Username or email is required");
  }
  if (!password) {
    throw throwApiError(400, "Password is required");
  }

  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: email?.toLowerCase() }],
    });

    if (!user) {
      console.log(
        `Failed login attempt - user not found: ${username || email} `
      );
      throw throwApiError(404, "User does not exist");
    }

    if (!user.isActive) {
      console.log(
        `Failed login attempt - account deactivated: ${username || email} `
      );
      throw throwApiError(403, "Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(String(password));
    if (!isPasswordValid) {
      console.log(
        `Failed login attempt - invalid password: ${username || email} `
      );
      throw throwApiError(401, "Invalid user credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Prepare user object (remove sensitive data)
    const loginUser = user.toObject();
    delete loginUser.password;
    delete loginUser.refreshToken;

    console.log(`Successful login: ${username || email} `);

    return sendResponse(
      res
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions),
      200,
      { user: loginUser },
      "Login successful"
    );
  } catch (error) {
    // Log the error with reCAPTCHA info
    console.error(`Login Error for ${username || email}: ${error.message}`);

    // Re-throw the error (it will be handled by global error handler)
    throw error;
  }
});

export const logOutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { refreshToken: undefined },
      },
      { new: true }
    );

    return sendResponse(
      res
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions),
      200,
      {},
      "User logged out successfully"
    );
  } catch (error) {
    console.error("Logout error:", error);
    throw throwApiError(500, "Something went wrong during logout");
  }
});

// In user.controller.js
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  console.log("Incoming refreshToken:", incomingRefreshToken);
  if (!incomingRefreshToken) {
    throw throwApiError(401, "Refresh token is required");
  }
  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodeToken?._id);
    console.log("Stored refreshToken:", user?.refreshToken);
    console.log("Tokens match?:", incomingRefreshToken === user?.refreshToken);
    if (!user) {
      throw throwApiError(401, "Invalid refresh token - User not found");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw throwApiError(401, "Refresh token is invalid or expired");
    }
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user._id
    );
    return sendResponse(
      res
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions),
      200,
      { accessToken, refreshToken: newRefreshToken },
      "Access token refreshed successfully"
    );
  } catch (error) {
    console.error("Refresh token error:", error.message);
    if (error.name === "JsonWebTokenError") {
      throw throwApiError(401, "Invalid refresh token format");
    } else if (error.name === "TokenExpiredError") {
      throw throwApiError(401, "Refresh token expired");
    }
    throw throwApiError(401, "Invalid refresh token");
  }
});
export const userProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw throwApiError(404, "User not found");
  }
  sendResponse(res, 200, user, "User details fetched successfully");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  const validationErrors = validateResetPasswordInput({
    oldPassword,
    newPassword,
    confirmPassword,
  });
  if (validationErrors.length > 0) {
    throw throwApiError(400, validationErrors.join(", "));
  }

  // Find user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw throwApiError(404, "User not found");
  }

  // Verify old password
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    console.log(
      `Failed password reset attempt for user ${req.user._id}: Invalid old password`
    );
    throw throwApiError(401, "Old password is incorrect");
  }

  // Check if new password is same as old
  if (oldPassword === newPassword) {
    throw throwApiError(
      400,
      "New password must be different from old password"
    );
  }

  // Update password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Send email with CAN-SPAM compliant footer
  const emailText = `Dear ${user.fullname},\n\nYour password for Admin Dashboard has been successfully reset. If you did not initiate this change, please contact our support team at support@admindashboard.com immediately.\n\nBest regards,\nAdmin Dashboard Team\n\nAmit Mishra\n407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village\nChanod Vapi, Gujarat 396191, India`;
  const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Password Reset Confirmation</h2>
    <p>Dear ${user.fullname},</p>
    <p>Your password for <strong>Admin Dashboard</strong> has been successfully reset. If you did not initiate this change, please contact our support team at <a href="mailto:support@admindashboard.com">support@admindashboard.com</a> immediately.</p>
    <p>Best regards,<br>Admin Dashboard Team</p>
    <hr style="border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #666;">
      Amit Mishra<br>
      407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village<br>
      Chanod Vapi, Gujarat 396191, India
    </p>
  </div>
`;

  try {
    await sendEmail(
      user.email,
      "Admin Dashboard: Your Password Reset Confirmation",
      emailText,
      emailHtml
    );
    console.log(`Password reset successfully for user ${req.user._id}`);
    return sendResponse(res, 200, null, "Password reset successfully");
  } catch (error) {
    console.error(
      `Failed to send email for user ${req.user._id}: ${error.message}`
    );
    throw throwApiError(
      500,
      "Password reset failed due to email delivery issue"
    );
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw throwApiError(400, "Valid email is required");
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw throwApiError(404, "User with this email does not exist");
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpires = Date.now() + 3600000; // 1 hour

  // Save token and expiry
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save({ validateBeforeSave: false });

  // Send email
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  const emailText = `Dear ${user.fullname},\n\nYou requested a password reset. Click the link below to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nBest regards,\nAdmin Dashboard Team\n\nAmit Mishra\n407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village\nChanod Vapi, Gujarat 396191, India`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Dear ${user.fullname},</p>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>Best regards,<br>Admin Dashboard Team</p>
      <hr style="border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Amit Mishra<br>
        407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village<br>
        Chanod Vapi, Gujarat 396191, India
      </p>
    </div>
  `;

  try {
    await sendEmail(user.email, "Password Reset Request", emailText, emailHtml);
    return sendResponse(
      res,
      200,
      null,
      "Password reset email sent successfully"
    );
  } catch (error) {
    // Clear token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.error(`Failed to send email to ${user.email}: ${error.message}`);
    throw throwApiError(500, "Failed to send password reset email");
  }
});

// Reset password token controller
export const resetPasswordToken = asyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  // Hash the token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token and expiry
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+password");
  if (!user) {
    throw throwApiError(400, "Invalid or expired reset token");
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Send confirmation email
  const emailText = `Dear ${user.fullname},\n\nYour password has been successfully reset. If you did not initiate this change, please contact support immediately.\n\nBest regards,\nAdmin Dashboard Team\n\nAmit Mishra\n407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village\nChanod Vapi, Gujarat 396191, India`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Confirmation</h2>
      <p>Dear ${user.fullname},</p>
      <p>Your password has been successfully reset. If you did not initiate this change, please contact support immediately.</p>
      <p>Best regards,<br>Admin Dashboard Team</p>
      <hr style="border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        Amit Mishra<br>
        407- Vishuddha Appartment, Nilkanth Nagar, Chanod Village<br>
        Chanod Vapi, Gujarat 396191, India
      </p>
    </div>
  `;

  try {
    await sendEmail(
      user.email,
      "Password Reset Confirmation",
      emailText,
      emailHtml
    );
    console.log(`Password reset successfully for user ${user._id}`);
    return sendResponse(res, 200, null, "Password reset successfully");
  } catch (error) {
    console.error(
      `Failed to send confirmation email to ${user.email}: ${error.message}`
    );
    // Still return success since password is already reset
    return sendResponse(res, 200, null, "Password reset successfully");
  }
});
