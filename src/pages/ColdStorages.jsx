import React, { useState, useEffect } from "react";
import Navbar from '../components/Navbar';

const ColdStorages = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => setError("Error fetching your location.")
      );
    } else {
      setError("Geolocation not supported.");
    }
  }, []);

  // Google Maps "More" redirect
  const handleMoreClick = () => {
    if (location) {
      const link = `https://www.google.com/maps/search/cold+storage/@${location[0]},${location[1]},14z`;
      window.open(link, "_blank");
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center">

      {/* 🎯 Header Box Restored */}
      <div className="bg-black/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-4xl relative">

        {/* More Button */}
        <button
          onClick={handleMoreClick}
          className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full hover:opacity-80"
        >
          More
        </button>

        {/* Title */}
        <h2 className="text-3xl font-semibold text-center text-white mb-6">
          Nearby Cold Storages
        </h2>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        {/* Google Maps Embed With Visual Blue Dot */}
        {location ? (
          <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg">

            {/* Google Maps iFrame */}
            <iframe
              src={`https://maps.google.com/maps?q=cold%20storage%20near%20${location[0]},${location[1]}&z=14&output=embed`}
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>

            {/* Blue Location Dot Overlay */}
            
          </div>
        ) : (
          <p className="text-white/60 text-center">
            Fetching your location...
          </p>
        )}

        {/* Info Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-2">How it works</h3>
          <p className="text-white/70">
            The map shows cold storages around your GPS location.  
            The blue dot marks your position visually.  
            Tap “More” to open full Google Maps.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default ColdStorages;
