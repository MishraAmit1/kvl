import axios from "axios";

export const sendSMS = async (mobile, message) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const url = "https://www.fast2sms.com/dev/bulkV2";

    const response = await axios.post(url, {
      authorization: apiKey,
      message: message,
      language: "english",
      route: "q",
      numbers: mobile,
    });

    if (response.data.return === true) {
      console.log("SMS sent successfully:", mobile);
      return true;
    } else {
      console.error("SMS sending failed:", response.data);
      return false;
    }
  } catch (error) {
    console.error("SMS service error:", error.message);
    return false;
  }
};
