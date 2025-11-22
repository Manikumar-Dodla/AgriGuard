import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUserAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../pages/firebase";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Gallery', path: '/gallery' },
    { title: 'Contact Us', path: '/contact' },
  ];

  // 🔥 Listen to Firebase login/logout status
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.1 }}
      className={`fixed top-0 left-0 right-0 z-50 mx-4 my-2 sm:mx-8 sm:my-4 transition-all duration-200
                  ${scrolled ? 'bg-black/90' : 'bg-black/75'}
                  backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg`}
    >
      <div className="flex items-center justify-between h-16 px-6 sm:px-8">

        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            AgriGuard
          </Link>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center space-x-12">
          {navLinks.map((link) => (
            <Link
              key={link.title}
              to={link.path}
              className={`text-lg text-white/90 hover:text-green-400 transition-colors duration-300 ${
                location.pathname === link.path ? 'text-green-400' : ''
              }`}
            >
              {link.title}
            </Link>
          ))}

          {/* 🔥 ONLY profile icon */}
          {user ? (
            <Link to="/profile" className="text-white/90 hover:text-green-400 text-xl">
              <FaUserAlt />
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-white bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 rounded-lg hover:opacity-90"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sm:hidden text-white focus:outline-none"
        >
          {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden mt-2 bg-black/90 rounded-lg shadow-lg overflow-hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.title}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-white hover:bg-gray-800"
              >
                {link.title}
              </Link>
            ))}

            {user ? (
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-white hover:bg-gray-800"
              >
                Profile
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-white hover:bg-gray-800"
              >
                Log In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
