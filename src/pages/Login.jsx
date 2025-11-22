import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Firebase imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const Login = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email.trim()) return false;
    if (!formData.password.trim()) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setLoginError("Email and password are required.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      setUser(result.user);

      navigate("/", { replace: true });

    } catch (error) {
      console.error("Login error:", error.message);
      setLoginError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative">
      
      <Navbar user={user} setUser={setUser} />

      <div className="bg-black/80 p-8 rounded-2xl shadow-xl border border-white/10 w-full max-w-md mt-10">
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Log In</h2>

        {loginError && <p className="text-red-500 text-center mb-4">{loginError}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">

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
          </div>

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
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Log In
          </button>
        </form>

        <p className="text-white/60 text-center mt-6">
          New user?{" "}
          <Link to="/signup" className="text-green-400 hover:underline">
            Create an account
          </Link>
        </p>

      </div>

    </div>
  );
};

export default Login;
