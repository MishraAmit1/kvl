import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log("SendGrid API key not configured. Email sending skipped.");
      return true; // Return true to avoid breaking flow
    }

    // Use SendGrid SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "apikey", // This is always 'apikey' for SendGrid
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@kvl.com",
      to,
      subject,
      text,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Email service error:", error.message);
    // Don't throw error, just log it and return true to keep system flow intact
    return true;
  }
};
