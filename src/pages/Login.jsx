import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Login = () => {
  // States for form input values, errors, user data, and login errors
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState(null); // Track the logged-in user
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required.';
    if (!formData.password.trim()) newErrors.password = 'Password is required.';
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        console.log('Sending login request:', formData);
        const response = await axios.post('http://localhost:5000/api/users/login', {
          username: formData.username,
          password: formData.password,
        });

        console.log('Login Response:', response.data);

        // If login is successful, save the token in localStorage and update user state
        if (response.data.token) {
          localStorage.setItem('token', response.data.token); // Save token in localStorage
          setUser({ username: formData.username }); // Set logged-in user
          navigate('/'); // Redirect to home after successful login
        }
      } catch (error) {
        console.error('Login error:', error.response ? error.response.data : error.message);
        setLoginError('Invalid username or password.'); // Set login error if credentials are wrong
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative">
      {/* Pass user and setUser as props to Navbar to reflect login status */}
      <Navbar user={user} setUser={setUser} /> 

      <div className="bg-black/80 p-8 rounded-2xl shadow-xl border border-white/10 w-full max-w-md mt-10">
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Log In</h2>
        
        {/* Display login error message if any */}
        {loginError && <p className="text-red-500 text-center mb-4">{loginError}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm text-white/80 mb-2">
              Username<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
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
          New user?{' '}
          <Link to="/signup" className="text-green-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
