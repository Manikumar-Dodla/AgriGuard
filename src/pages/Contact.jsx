import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { FaPaperPlane } from 'react-icons/fa';

import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Contact = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [message, setMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Listen to user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch Firestore profile
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      } else {
        setUser(null);
      }
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setSubmitError("Message cannot be empty");
      return;
    }

    try {
      const payload = {
        name: userProfile.name,
        email: userProfile.email,
        subject: "User Message",
        message: message,
      };

      console.log("Sending:", payload);

      await axios.post("http://localhost:5000/api/contact", payload);

      setSubmitSuccess("Your message has been sent successfully!");
      setSubmitError("");
      setMessage("");

    } catch (error) {
      console.error("Error:", error);
      setSubmitSuccess("");
      setSubmitError("Something went wrong. Try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black"
    >
      <Navbar />

      <div className="container mx-auto px-4 py-8">

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-white/60">
            Get in touch with our agricultural experts
          </p>
        </motion.div>

        {/* NOT LOGGED IN */}
        {!user && (
          <div className="max-w-xl mx-auto text-center text-white">
            <p className="text-lg mb-4">You must be logged in to send a message.</p>
            <a
              href="/login"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
            >
              Log In
            </a>
          </div>
        )}

        {/* LOGGED IN USER FORM */}
        {user && userProfile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto backdrop-blur-xl bg-white/5 p-8 rounded-2xl border border-white/10"
          >
            {submitSuccess && <p className="text-green-500 text-center mb-4">{submitSuccess}</p>}
            {submitError && <p className="text-red-500 text-center mb-4">{submitError}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Name (READ ONLY) */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  readOnly
                  className="w-full px-4 py-3 bg-white/10 rounded-lg text-white opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Email (READ ONLY) */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={userProfile.email}
                  readOnly
                  className="w-full px-4 py-3 bg-white/10 rounded-lg text-white opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Message</label>
                <textarea
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                         text-white placeholder-white/40 focus:outline-none focus:border-purple-500
                         transition-colors resize-none"
                  placeholder="Your message"
                ></textarea>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r 
                       from-purple-500 to-pink-500 text-white rounded-lg font-medium 
                       hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                <FaPaperPlane />
                Send Message
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Contact;
