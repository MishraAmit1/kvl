import sgMail from "@sendgrid/mail";
import { throwApiError } from "./apiError.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html,
    };
    const info = await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw throwApiError(500, "Failed to send email");
  }
};
