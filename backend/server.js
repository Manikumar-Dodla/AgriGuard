const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Added CORS for cross-origin requests
const { SMTPServer } = require('smtp-server');
const nodemailer = require('nodemailer');

// Start a local SMTP server
const smtpServer = new SMTPServer({
  secure: false, // Disable TLS for simplicity (not secure for production)
  authOptional: true, // Allow sending without authentication
});

smtpServer.listen(1025, () => {
  console.log('SMTP server running on port 1025');
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: 'localhost', // Point to your local SMTP server
  port: 1025,
  secure: false, // Disable TLS
  enable_starttls_auto: false, // Disable STARTTLS
  tls: {
    rejectUnauthorized: false,  // Disable certificate validation (for self-signed certs)
  },
});

 

dotenv.config(); // To load environment variables from .env file

const app = express();
app.use(cors()); // Enable CORS for frontend-backend communication
app.use(express.json()); // To parse incoming JSON requests

// Routes for user requests
const userRoutes = require('./routes/userRoutes'); // Use userRoutes for handling user-related requests

// Use the userRoutes for /api/users endpoint
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

// MongoDB connection function
const connectDB = async () => {
  try {
    // Connect to MongoDB for users
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for users');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const mailOptions = {
    from: 'dodlahemanthreddy2004@gmail.com',
    to: 'dodlahemanthreddy2004@gmail.com',
    subject: `Contact Form: ${subject}`,
    text: `You have received a new message from ${name} (${email}):\n\n${message}`,
  };

  console.log('Attempting to send email with following options:', mailOptions);

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(200).json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send the email. Please try again later.' });
  }
});




// Call the connectDB function to initiate connections
connectDB();

// Home route (for testing)
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(PORT, () => {
  console.log('Server is running on port ${PORT}');
});