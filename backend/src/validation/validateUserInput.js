export const validateUserInput = (userInput) => {
  const { username, email, fullname, password } = userInput;
  const errors = [];
  if (username && !username.trim()) errors.push("Username is required");
  if (email && !email.trim()) errors.push("Email is required");
  if (fullname && !fullname.trim()) errors.push("Full name is required");
  if (password && !password.trim()) errors.push("Password is required");
  return errors;
};
export const validateResetPasswordInput = (userInput) => {
  const { oldPassword, newPassword, confirmPassword } = userInput;
  const errors = [];

  if (!oldPassword?.trim()) errors.push("Old password is required");
  if (!newPassword?.trim()) errors.push("New password is required");
  if (!confirmPassword?.trim()) errors.push("Confirm password is required");
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push("New password and confirm password must match");
  }
  if (newPassword && newPassword.length < 6) {
    errors.push("New password must be at least 6 characters long");
  }
  return errors;
};
