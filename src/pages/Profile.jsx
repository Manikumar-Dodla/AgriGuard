import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    age: '',
    locality: '',
    landOwned: '',
    soilType: '',
    cropPlanted: '',
  });
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const navigate = useNavigate();

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
        setFormData({
          username: response.data.username,
          name: response.data.name,
          age: response.data.age,
          locality: response.data.locality,
          landOwned: response.data.landOwned,
          soilType: response.data.soilType,
          cropPlanted: response.data.cropPlanted,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Error fetching profile data. Please try again later.');
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle form data change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle profile update
  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:5000/api/users/edit',
        { ...formData }, // Send updated form data
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Profile updated successfully');
        setUserData(response.data.user);
        setIsEditing(false); // Exit edit mode
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error updating profile. Please try again later.');
    }
  };

  // Toggle between Edit and Save mode
  const handleEdit = () => setIsEditing(true);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="bg-black/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Profile</h2>
        {userData ? (
          <form onSubmit={isEditing ? handleSave : (e) => e.preventDefault()} className="space-y-6">
            {/* Username (readonly) */}
            <div>
              <label htmlFor="username" className="block text-sm text-white/80 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                readOnly
              />
            </div>

            {/* Editable Fields */}
            {['name', 'age', 'locality', 'landOwned', 'soilType', 'cropPlanted'].map((field) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm text-white/80 mb-2">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'age' ? 'number' : 'text'}
                  name={field}
                  id={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  readOnly={!isEditing} // Make input fields readonly if not in edit mode
                />
              </div>
            ))}

            {/* Edit/Save and Logout Buttons */}
            <div className="flex justify-between items-center mt-6">
              {isEditing ? (
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full ml-4 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-white/60">Loading your profile...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
