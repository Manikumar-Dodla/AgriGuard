const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Gmail SMTP Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // yourgmail@gmail.com
    pass: process.env.APP_PASSWORD    // Google App Password
  }
});

// CONTACT FORM ROUTE
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Missing fields." });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "adamuserone@gmail.com",
      subject: subject || "AgriGuard Support Message",
      text: `Message from ${name} (${email}):\n\n${message}`
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// Testing route
app.get("/", (req, res) => res.send("Backend Running"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
