import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

// Firebase imports
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    locality: '',
    landOwned: '',
    soilType: '',
    cropPlanted: '',
  });

  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    if (!formData.password.trim()) newErrors.password = 'Password is required.';
    if (formData.password !== formData.confirmPassword) newErrors.passwordMatch = 'Passwords do not match.';
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.age.trim()) newErrors.age = 'Age is required.';
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required.';
    if (!formData.landOwned.trim()) newErrors.landOwned = 'Land Owned is required.';
    if (!formData.soilType.trim()) newErrors.soilType = 'Soil Type is required.';
    if (!formData.cropPlanted.trim()) newErrors.cropPlanted = 'Crop Planted is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Firebase signup
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const uid = userCred.user.uid;

      // Save extra fields in Firestore
      await setDoc(doc(db, "users", uid), {
        email: formData.email,
        name: formData.name,
        age: formData.age,
        locality: formData.locality,
        landOwned: formData.landOwned,
        soilType: formData.soilType,
        cropPlanted: formData.cropPlanted,
        createdAt: new Date(),
      });

      alert("Signup successful!");
      setUser({ email: formData.email });
      navigate('/');

    } catch (error) {
      console.error("Firebase signup error:", error);
      alert(error.message || "Signup failed.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <Navbar user={user} setUser={setUser} />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md"
      >
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Create an Account</h2>
        <p className="text-center text-white/60 mb-8">Sign up to access your AgroTech dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm text-white/80 mb-2">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm text-white/80 mb-2">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm text-white/80 mb-2">
              Age<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="age"
              id="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Locality */}
          <div>
            <label htmlFor="locality" className="block text-sm text-white/80 mb-2">
              Locality<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="locality"
              id="locality"
              value={formData.locality}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.locality && <p className="text-red-500 text-sm mt-1">{errors.locality}</p>}
          </div>

          {/* Land Owned */}
          <div>
            <label htmlFor="landOwned" className="block text-sm text-white/80 mb-2">
              Land Owned (in acres)<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="landOwned"
              id="landOwned"
              value={formData.landOwned}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.landOwned && <p className="text-red-500 text-sm mt-1">{errors.landOwned}</p>}
          </div>

          {/* Soil Type */}
          <div>
            <label htmlFor="soilType" className="block text-sm text-white/80 mb-2">
              Soil Type<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="soilType"
              id="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.soilType && <p className="text-red-500 text-sm mt-1">{errors.soilType}</p>}
          </div>

          {/* Crop Planted */}
          <div>
            <label htmlFor="cropPlanted" className="block text-sm text-white/80 mb-2">
              Crop Planted<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cropPlanted"
              id="cropPlanted"
              value={formData.cropPlanted}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.cropPlanted && <p className="text-red-500 text-sm mt-1">{errors.cropPlanted}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm text-white/80 mb-2">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-white/80 mb-2">
              Confirm Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {errors.passwordMatch && <p className="text-red-500 text-sm mt-1">{errors.passwordMatch}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-500 transition-all"
          >
            Sign Up
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Signup;
