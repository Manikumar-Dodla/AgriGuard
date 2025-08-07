import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet icon not appearing
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const ColdStorages = () => {
  const [location, setLocation] = useState(null);
  const [coldStorages, setColdStorages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch user's location using the Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          fetchColdStorages(latitude, longitude);
        },
        (err) => {
          console.error("Error getting location:", err.message);
          setError("Error fetching location.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch nearby cold storages using Overpass API
  const fetchColdStorages = async (lat, lon) => {
    const radius = 5000; // 5 km radius
    const query = `
      [out:json];
      node["cold_storage"](around:${radius},${lat},${lon});
      out body;
    `;
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent("https://overpass-api.de/api/interpreter?data=" + query)}`;

    try {
      const response = await axios.get(url, { timeout: 10000 }); // Timeout after 10 seconds
      const data = JSON.parse(response.data.contents); // Parse the response content
      setColdStorages(data.elements || []); // Use the elements from the response data
    } catch (error) {
      console.error("Error fetching cold storages:", error);
      setError("Error fetching cold storages. Please try again later.");
    }
  };

  // Button to search "cold storages nearby" in Google Maps
  const handleMoreClick = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/cold+storages+nearby`;
    window.open(googleMapsUrl, "_blank");
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center">
      <div className="bg-black/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-4xl relative">
        {/* "More" Button placed directly inside the return block */}
        <button
          onClick={handleMoreClick}
          className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-700"
        >
          More
        </button>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Nearby Cold Storages</h2>

        {/* Display map with cold storage markers */}
        {location ? (
          <MapContainer
            center={location}
            zoom={14}
            style={{ height: "400px", width: "100%" }}
          >
            {/* Default Leaflet TileLayer */}
            <TileLayer url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={location}>
              <Popup>Your location</Popup>
            </Marker>
            {coldStorages.map((storage) => (
              <Marker key={storage.id} position={[storage.lat, storage.lon]}>
                <Popup>{storage.tags.name || "Cold Storage"}</Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p className="text-center text-white/60">Loading your location...</p>
        )}

        {/* List of nearby cold storages */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Cold Storages List</h3>
          {coldStorages.length === 0 ? (
            <p className="text-center text-white/60">No cold storages found nearby.</p>
          ) : (
            <ul className="space-y-4">
              {coldStorages.map((storage) => (
                <li
                  key={storage.id}
                  className="bg-black/70 text-white p-4 rounded-lg shadow-lg"
                >
                  <h4 className="text-lg font-semibold">{storage.tags.name || "Unnamed Cold Storage"}</h4>
                  <p>Location: Lat: {storage.lat}, Lon: {storage.lon}</p>
                  <p>{storage.tags.description || "No description available."}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColdStorages;