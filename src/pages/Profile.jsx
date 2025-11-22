import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setFirebaseUser(user);
      }
    });

    return () => unsub();
  }, [navigate]);

  // Fetch Firestore user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!firebaseUser) return;

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        console.error("User document not found in Firestore.");
      }
    };

    fetchProfile();
  }, [firebaseUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!firebaseUser || !userData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white text-xl">
        Loading Profile...
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black pt-20"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg text-white"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Your Profile
        </h2>

        <div className="space-y-4 text-white/90 text-lg">
          <p><span className="font-semibold">Email:</span> {userData.email}</p>
          <p><span className="font-semibold">Name:</span> {userData.name}</p>
          <p><span className="font-semibold">Age:</span> {userData.age}</p>
          <p><span className="font-semibold">Locality:</span> {userData.locality}</p>
          <p><span className="font-semibold">Land Owned:</span> {userData.landOwned} acres</p>
          <p><span className="font-semibold">Soil Type:</span> {userData.soilType}</p>
          <p><span className="font-semibold">Crop Planted:</span> {userData.cropPlanted}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-8 py-3 bg-red-500 rounded-lg font-semibold hover:bg-red-400 transition-all text-white"
        >
          Logout
        </button>
      </motion.div>
    </motion.div>
    </>
  );
};

export default Profile;
