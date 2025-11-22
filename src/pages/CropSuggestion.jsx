// CropSuggestion.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { FaSeedling, FaThermometerHalf, FaWater, FaCloudRain } from "react-icons/fa";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

/**
 * Full rewrite: weighted crop suitability scoring, NASA POWER (PRECTOTCORR, T2M, GWETROOT)
 * Years: 2023 - 2025
 *
 * How scoring works (brief):
 * - temperatureScore: how close avgTemp is to crop mid-range (normalized)
 * - rainfallScore: how close yearlyRain is to crop ideal range
 * - moistureScore: how close soilMoisture is to crop ideal range (soil moisture in [0..1])
 * - finalScore = weighted sum (temp 40%, rain 40%, moisture 20%)
 *
 * Crops returned sorted by score descending. Threshold used to show "suitable".
 */

const CropSuggestion = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);

  // ---------------------------------------------------------------------
  // Crop database (with ideal moisture ranges)
  // Values: minTemp/maxTemp in °C, minRain/maxRain yearly in mm, moistureIdeal [0..1]
  // Add/adjust crops as needed
  // ---------------------------------------------------------------------
  const cropDatabase = {
    rice: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 1200,
      maxRain: 2400,
      moistureIdealMin: 0.5,
      moistureIdealMax: 0.9,
      description: "Staple grain crop, needs consistent water",
      season: "Kharif",
      tips: "Plant in standing water, maintain water level",
    },
    wheat: {
      minTemp: 10,
      maxTemp: 25,
      minRain: 300,
      maxRain: 1200,
      moistureIdealMin: 0.15,
      moistureIdealMax: 0.35,
      description: "Winter cereal crop, moderate water needs",
      season: "Rabi",
      tips: "Sow seeds 2-3 cm deep, needs well-drained soil",
    },
    cotton: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 500,
      maxRain: 1000,
      moistureIdealMin: 0.2,
      moistureIdealMax: 0.45,
      description: "Fiber crop, needs warm climate",
      season: "Kharif",
      tips: "Plant in full sun, avoid waterlogging",
    },
    maize: {
      minTemp: 16,
      maxTemp: 32,
      minRain: 500,
      maxRain: 1100,
      moistureIdealMin: 0.25,
      moistureIdealMax: 0.5,
      description: "Grain crop, needs well-drained soil",
      season: "Kharif",
      tips: "Plant in blocks for pollination, water regularly",
    },
    sugarcane: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 750,
      maxRain: 2000,
      moistureIdealMin: 0.4,
      moistureIdealMax: 0.8,
      description: "Tropical crop, high water needs",
      season: "Kharif",
      tips: "Plant in rows, needs rich soil",
    },
    potato: {
      minTemp: 8,
      maxTemp: 25,
      minRain: 300,
      maxRain: 800,
      moistureIdealMin: 0.25,
      moistureIdealMax: 0.6,
      description: "Root crop, grows in cool weather",
      season: "Rabi",
      tips: "Plant in trenches, hill up soil around plants",
    },
    tomato: {
      minTemp: 15,
      maxTemp: 30,
      minRain: 400,
      maxRain: 1000,
      moistureIdealMin: 0.25,
      moistureIdealMax: 0.6,
      description: "Warm-season crop, needs full sun",
      season: "Kharif",
      tips: "Stake plants, water at base to avoid leaf diseases",
    },
    chilli: {
      minTemp: 20,
      maxTemp: 32,
      minRain: 400,
      maxRain: 1000,
      moistureIdealMin: 0.25,
      moistureIdealMax: 0.6,
      description: "Spice crop, grows in hot climate",
      season: "Kharif",
      tips: "Mulch soil, avoid overwatering",
    },
    onion: {
      minTemp: 10,
      maxTemp: 25,
      minRain: 300,
      maxRain: 800,
      moistureIdealMin: 0.2,
      moistureIdealMax: 0.5,
      description: "Bulb crop, grows in cool weather",
      season: "Rabi",
      tips: "Plant in rows, water moderately",
    },
    banana: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 1000,
      maxRain: 2000,
      moistureIdealMin: 0.5,
      moistureIdealMax: 0.85,
      description: "Tropical fruit crop, high water needs",
      season: "Kharif",
      tips: "Plant in rich soil, water regularly",
    },
    mango: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 800,
      maxRain: 2000,
      moistureIdealMin: 0.35,
      moistureIdealMax: 0.7,
      description: "Tropical fruit crop, high water needs",
      season: "Kharif",
      tips: "Prune trees, water deeply but infrequently",
    },
    coconut: {
      minTemp: 20,
      maxTemp: 35,
      minRain: 1500,
      maxRain: 3000,
      moistureIdealMin: 0.5,
      moistureIdealMax: 0.9,
      description: "Tropical crop, high water needs",
      season: "Kharif",
      tips: "Plant in sandy soil, water regularly",
    },
    tea: {
      minTemp: 12,
      maxTemp: 28,
      minRain: 1500,
      maxRain: 3000,
      moistureIdealMin: 0.5,
      moistureIdealMax: 0.9,
      description: "Beverage crop, needs humid climate",
      season: "Kharif",
      tips: "Plant in shade, water regularly",
    },
    coffee: {
      minTemp: 15,
      maxTemp: 30,
      minRain: 1500,
      maxRain: 3000,
      moistureIdealMin: 0.45,
      moistureIdealMax: 0.9,
      description: "Beverage crop, needs humid climate",
      season: "Kharif",
      tips: "Plant in shade, water regularly",
    },
    sunflower: {
      minTemp: 18,
      maxTemp: 35,
      minRain: 400,
      maxRain: 900,
      moistureIdealMin: 0.15,
      moistureIdealMax: 0.4,
      description: "Oilseed crop, grows in hot climate",
      season: "Kharif",
      tips: "Plant in full sun, water regularly",
    },
  };

  // ---------------------------------------------------------------------
  // Helper: clamp
  // ---------------------------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------------------------------------------------------------------
  // Fetch geocoding (Open-Meteo) for name -> lat/lon
  // ---------------------------------------------------------------------
  const searchByLocation = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=1`
      );
      if (!resp.ok) throw new Error("Location search failed");
      const json = await resp.json();
      const top = json.results?.[0];
      if (!top) throw new Error("Location not found");
      const { latitude, longitude, name, country } = top;
      setCurrentLocation({ latitude, longitude, name, country });
      await fetchWeatherData(latitude, longitude);
    } catch (err) {
      setError(err.message || "Location search error");
      setWeatherData(null);
      setRecommendations([]);
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // Fetch NASA POWER monthly data (2023-2025) for point
  // Parameters: PRECTOTCORR (monthly precipitation mm), T2M (monthly mean temperature °C), GWETROOT (root-zone soil moisture [0..1])
  // ---------------------------------------------------------------------
  const fetchWeatherData = useCallback(async (latitude, longitude) => {
    if (latitude == null || longitude == null) {
      setError("Invalid coordinates");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const start = 2023;
      const end = 2025;
      const params = ["PRECTOTCORR", "T2M", "GWETROOT"].join(",");
      const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?start=${start}&end=${end}&latitude=${latitude}&longitude=${longitude}&community=AG&parameters=${params}&format=JSON`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Weather data fetch failed");
      const json = await resp.json();

      const parameter = json.properties?.parameter;
      if (!parameter) throw new Error("Unexpected API response");

      // Collect yearly sums/averages for 2023..2025
      const years = {};
      for (let y = start; y <= end; y++) {
        years[y] = { rainSum: 0, tempSum: 0, tempCount: 0, moistureVals: [] };
      }

      // PRECTOTCORR: keys like "202301" => monthly precipitation in mm
      Object.entries(parameter.PRECTOTCORR || {}).forEach(([date, val]) => {
        const year = Number(date.substring(0, 4));
        if (years[year] && typeof val === "number" && val >= 0) {
          years[year].rainSum += val;
        }
      });

      // T2M: mean monthly temperature (°C)
      Object.entries(parameter.T2M || {}).forEach(([date, val]) => {
        const year = Number(date.substring(0, 4));
        if (years[year] && typeof val === "number" && val > -80 && val < 80) {
          years[year].tempSum += val;
          years[year].tempCount += 1;
        }
      });

      // GWETROOT: monthly root-zone wetness [0..1] (if absent, try GWETPROF or fallback)
      const moistureSource = parameter.GWETROOT ? "GWETROOT" : parameter.GWETPROF ? "GWETPROF" : null;
      if (moistureSource) {
        Object.entries(parameter[moistureSource] || {}).forEach(([date, val]) => {
          const year = Number(date.substring(0, 4));
          if (years[year] && typeof val === "number" && val >= 0 && val <= 1.5) {
            // clamp a little if values slightly over 1
            years[year].moistureVals.push(clamp(val, 0, 1));
          }
        });
      }

      // Compute multi-year averages
      const yearKeys = Object.keys(years);
      const avgYearlyRain =
        yearKeys.reduce((s, y) => s + (years[y].rainSum || 0), 0) / yearKeys.length;

      const avgTemp =
        yearKeys.reduce(
          (s, y) => s + (years[y].tempCount > 0 ? years[y].tempSum / years[y].tempCount : 0),
          0
        ) / yearKeys.length;

      const avgSoilMoisture =
        yearKeys.reduce((s, y) => {
          const arr = years[y].moistureVals || [];
          const yAvg = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
          return s + yAvg;
        }, 0) / yearKeys.length;

      const processed = {
        avgTemp: Number.isFinite(avgTemp) && avgTemp !== 0 ? avgTemp : 25,
        yearlyRain: Number.isFinite(avgYearlyRain) && avgYearlyRain !== 0 ? avgYearlyRain : 500,
        soilMoisture: Number.isFinite(avgSoilMoisture) && avgSoilMoisture !== 0 ? avgSoilMoisture : 0.4,
      };

      setWeatherData(processed);
      computeRecommendations(processed);
      setError(null);
    } catch (err) {
      console.error("fetchWeatherData error:", err);
      setError(err.message || "Unable to fetch historical weather data");
      // fallback
      const fallback = { avgTemp: 25, yearlyRain: 500, soilMoisture: 0.4 };
      setWeatherData(fallback);
      computeRecommendations(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // Suitability scoring helpers
  // ---------------------------------------------------------------------
  const normalizedDistanceScore = (value, min, max) => {
    // If within [min, max], score close to 1. If outside, decays smoothly.
    if (min === undefined || max === undefined) return 0.5;
    const mid = (min + max) / 2;
    const halfRange = Math.max(1e-6, (max - min) / 2);
    // distance in terms of halfRange
    const dist = Math.abs(value - mid) / halfRange; // 0 => perfect, 1 => boundary
    // convert to score: 1 at dist=0, 0 at dist >= 2 (tunable)
    const score = clamp(1 - dist / 2, 0, 1);
    return score;
  };

  const rangeCoverageScore = (value, min, max) => {
    // If inside [min,max] => 1. If outside => gradually decrease.
    if (min === undefined || max === undefined) return 0.5;
    if (value >= min && value <= max) return 1;
    // distance beyond edge (as fraction of range)
    const range = Math.max(1e-6, max - min);
    const d = value < min ? (min - value) / range : (value - max) / range;
    // convert to score with exponential decay
    const score = clamp(Math.exp(-d * 1.5), 0, 1);
    return score;
  };

  // Main compute recommendations using weighted scoring
  const computeRecommendations = (data) => {
    if (!data) {
      setRecommendations([]);
      return;
    }
    try {
      const scored = Object.entries(cropDatabase).map(([cropName, reqs]) => {
        const tempScore = normalizedDistanceScore(data.avgTemp, reqs.minTemp, reqs.maxTemp);
        const rainScore = rangeCoverageScore(data.yearlyRain, reqs.minRain, reqs.maxRain);
        const moistureScore = normalizedDistanceScore(
          data.soilMoisture,
          reqs.moistureIdealMin,
          reqs.moistureIdealMax
        );

        // weights: temp 40%, rain 40%, moisture 20%
        const finalScore = tempScore * 0.4 + rainScore * 0.4 + moistureScore * 0.2;

        return { cropName, reqs, scores: { tempScore, rainScore, moistureScore }, finalScore };
      });

      // Sort desc by finalScore
      scored.sort((a, b) => b.finalScore - a.finalScore);

      // Choose threshold; also include top N if desired. Here: score >= 0.45 or top-6
      const threshold = 0.45;
      const filtered = scored.filter((s, idx) => s.finalScore >= threshold || idx < 6);

      setRecommendations(filtered);
    } catch (err) {
      console.error("computeRecommendations error:", err);
      setRecommendations([]);
    }
  };

  // ---------------------------------------------------------------------
  // Initial: try geolocation (non-blocking)
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCurrentLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            name: "Your Location",
            country: "",
          });
          fetchWeatherData(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          // user denied or unavailable -> show idle UI until they search
          console.warn("Geolocation error:", err.message || err.code);
          setLoading(false);
        },
        { maximumAge: 1000 * 60 * 10, timeout: 8000 }
      );
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [fetchWeatherData]);

  // ---------------------------------------------------------------------
  // UI render
  // ---------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black"
    >
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Smart Crop Recommendations
          </h1>
          <p className="text-xl text-white/60">Based on multi-year local climate data (NASA POWER)</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl mx-auto mb-8">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <FaMapMarkerAlt className="text-2xl text-purple-500" />
              <h2 className="text-xl font-semibold text-white">Location Search</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchLocation.trim()) {
                  searchByLocation(searchLocation.trim());
                }
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter city name (eg. Hyderabad) or coordinates"
                className="flex-1 bg-black/50 border border-white/10 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg px-6 py-2">
                <FaSearch />
              </motion.button>
            </form>

            {currentLocation && (
              <div className="mt-4 text-white/60">
                Currently showing data for:
                <span className="text-white ml-2">{currentLocation.name}{currentLocation.country ? `, ${currentLocation.country}` : ""}</span>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-center">
            {error}
          </motion.div>
        ) : (
          <>
            {/* Weather Overview */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FaThermometerHalf className="text-2xl text-orange-500" />
                  <h3 className="text-lg font-semibold text-white">Temperature</h3>
                </div>
                <p className="text-3xl font-bold text-white">{weatherData?.avgTemp?.toFixed(1)}°C</p>
                <p className="text-white/60">Multi-year average (2023–2025)</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FaCloudRain className="text-2xl text-blue-500" />
                  <h3 className="text-lg font-semibold text-white">Yearly Rainfall</h3>
                </div>
                <p className="text-3xl font-bold text-white">{weatherData?.yearlyRain?.toFixed(1)} mm</p>
                <p className="text-white/60">Average yearly precipitation (2023–2025)</p>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FaWater className="text-2xl text-cyan-500" />
                  <h3 className="text-lg font-semibold text-white">Soil Moisture</h3>
                </div>
                <p className="text-3xl font-bold text-white">{(weatherData?.soilMoisture * 100).toFixed(1)}%</p>
                <p className="text-white/60">Root-zone average saturation</p>
              </div>
            </motion.div>

            {/* Crop Recommendations */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Recommended Crops (ranked)</h2>
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map(({ cropName, reqs, scores, finalScore }) => (
                    <motion.div key={cropName} whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <FaSeedling className="text-2xl text-green-500" />
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white capitalize">{cropName}</h3>
                          <div className="text-sm text-white/60">Suitability: {(finalScore * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-white/80">{reqs.description}</p>
                        <div className="bg-black/30 rounded-lg p-3">
                          <p className="text-white/60">Season: <span className="text-white">{reqs.season}</span></p>
                          <p className="text-white/60">Temperature: <span className="text-white">{reqs.minTemp}°C - {reqs.maxTemp}°C</span></p>
                          <p className="text-white/60">Yearly Rainfall: <span className="text-white">{reqs.minRain} - {reqs.maxRain} mm</span></p>
                          <p className="text-white/60">Soil moisture ideal: <span className="text-white">{(reqs.moistureIdealMin * 100).toFixed(0)}% - {(reqs.moistureIdealMax * 100).toFixed(0)}%</span></p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-green-400">{reqs.tips}</p>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-sm text-white/60">Temp score</div>
                            <div className="font-bold text-white">{(scores.tempScore * 100).toFixed(0)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-white/60">Rain score</div>
                            <div className="font-bold text-white">{(scores.rainScore * 100).toFixed(0)}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-white/60">Moisture score</div>
                            <div className="font-bold text-white">{(scores.moistureScore * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8 bg-white/5 rounded-2xl border border-white/10">
                  No suitable crops found for current conditions
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CropSuggestion;
