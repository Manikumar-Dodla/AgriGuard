// DisasterAlerts.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaWater,
  FaThermometerHalf,
  FaSnowflake,
  FaWind,
  FaCloudRain,
  FaLeaf,
  FaSmog,
  FaLocationArrow,
} from "react-icons/fa";

/**
 * Domain-aware agricultural risk scoring (Option B)
 * - Six hazards: Flood, Drought, Cyclone/Typhoon (treated as Wind/Cyclone risk), Tornado-like (wind/thunder), Heatwave, Cold wave / Frost
 * - Uses Open-Meteo:
 *   * flood-api.open-meteo.com (river_discharge)
 *   * api.open-meteo.com/v1/forecast (temps, precip, wind, hourly AQ)
 *   * api.open-meteo.com/v1/agrometeorology (soil moisture, et0, vpd)
 *
 * Notes:
 * - Formulas are intentionally conservative and tunable. I added comments for each formula.
 * - All scores are 0..100 (clamped). Colors scale with severity.
 * - If any data is missing, that hazard shows N/A and a 0% score by default.
 */

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const pct = (v) => Math.round(clamp(v, 0, 1) * 100);

const DisasterAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // scores object: { flood:0..100, drought:0..100, heat:0..100, cold:0..100, wind:0..100, rain:0..100, air:0..100 }
  const [scores, setScores] = useState({
    flood: null,
    drought: null,
    heat: null,
    cold: null,
    wind: null,
    rain: null,
    air: null,
  });

  // raw values for details (optional)
  const [raw, setRaw] = useState({});

  // safe number parser
  const safeNum = (v, fallback = null) => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fetchAndScore = async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      // FLOOD: river discharge (m3/s) + recent precipitation -> flood risk
      // Flood formula: floodScore = 0.6 * (discharge/threshold) + 0.4 * (precip/precipThreshold)
      // threshold values chosen as reasonable defaults; you can tune:
      const dischargeThreshold = 50; // m3/s typical moderate threshold (domain-dependent)
      const precipThresholdForFlood = 50; // mm/day considered heavy

      const floodURL = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge`;
      const floodResp = await fetch(floodURL);
      const floodJson = floodResp.ok ? await floodResp.json() : {};
      const discharge = safeNum(floodJson?.daily?.river_discharge?.slice(-1)?.[0], 0);

      // WEATHER (Open-Meteo forecast)
      // daily: temperature_2m_max, temperature_2m_min, precipitation_sum, windgusts_10m_max, windspeed_10m_max, uv_index_max
      // hourly: pm2_5, pm10, ozone
      const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windgusts_10m_max,windspeed_10m_max,heavy_precipitation_hours,uv_index_max&hourly=pm2_5,pm10,ozone&timezone=auto`;
      const weatherResp = await fetch(weatherURL);
      const weatherJson = weatherResp.ok ? await weatherResp.json() : {};

      // AGRO (soil moisture, et0, vpd)
      const agroURL = `https://api.open-meteo.com/v1/agrometeorology?latitude=${lat}&longitude=${lon}&daily=soil_moisture_0_7cm,soil_moisture_7_28cm,et0_fao_evapotranspiration,vapor_pressure_deficit&timezone=auto`;
      const agroResp = await fetch(agroURL);
      const agroJson = agroResp.ok ? await agroResp.json() : {};

      // parse key values (use first / latest daily as representative)
      const daily = weatherJson?.daily || {};
      const agroDaily = agroJson?.daily || {};

      const maxTemp = safeNum(daily?.temperature_2m_max?.[0], null);
      const minTemp = safeNum(daily?.temperature_2m_min?.[0], null);
      const precip = safeNum(daily?.precipitation_sum?.[0], 0);
      const heavyPrecipHours = safeNum(daily?.heavy_precipitation_hours?.[0], 0);
      const windGust = safeNum(daily?.windgusts_10m_max?.[0], 0);
      const windSpeed = safeNum(daily?.windspeed_10m_max?.[0], 0);
      const et0 = safeNum(agroDaily?.et0_fao_evapotranspiration?.[0], null);
      const sm0 = safeNum(agroDaily?.soil_moisture_0_7cm?.[0], null); // surface
      const sm1 = safeNum(agroDaily?.soil_moisture_7_28cm?.[0], null); // root zone
      const vpd = safeNum(agroDaily?.vapor_pressure_deficit?.[0], null);

      // air quality: last hourly values
      const hourly = weatherJson?.hourly || {};
      const pm25 = safeNum(hourly?.pm2_5?.slice(-1)?.[0], 0);
      const pm10 = safeNum(hourly?.pm10?.slice(-1)?.[0], 0);
      const o3 = safeNum(hourly?.ozone?.slice(-1)?.[0], 0);

      // ---- F L O O D  S C O R E ----
      // If discharge is present, weight it more; else rely on heavy precipitation.
      const dischargeRatio = discharge / dischargeThreshold; // can be >1
      const precipRatio = precip / precipThresholdForFlood;
      const floodRawScore = clamp(0.6 * dischargeRatio + 0.4 * precipRatio, 0, 4); // allow >1 before clamp to spread
      const floodPct = pct(clamp(floodRawScore, 0, 1)); // clamp to 100%

      // ---- D R O U G H T  S C O R E ----
      // Drought characterized by low soil moisture + high ET0 demand.
      // We assume typical "safe" surface SM ~0.2 (20%), critical dryness <0.12 — tuneable.
      // Formula: dryness = (0.25 - sm0) / 0.25 (so 0 means wet, 1 means extremely dry)
      // ET contribution normalized with max ET ~6 mm/day (depending on crop/region).
      let droughtScore = 0;
      if (sm0 !== null && sm1 !== null && et0 !== null) {
        const surfaceSafe = 0.25;
        const surfDryness = clamp((surfaceSafe - sm0) / surfaceSafe, 0, 1); // 0..1
        const rootDryness = clamp((surfaceSafe - sm1) / surfaceSafe, 0, 1);
        const etFactor = clamp(et0 / 6, 0, 1); // 6 mm/day is high ET
        // give root zone slightly more weight
        const droughtRaw = 0.55 * rootDryness + 0.30 * surfDryness + 0.15 * etFactor;
        droughtScore = pct(droughtRaw);
      } else {
        droughtScore = 0; // insufficient data -> show 0 (safe) but UI will indicate N/A if raw missing
      }

      // ---- H E A T W A V E  S C O R E ----
      // Heat stress relevant threshold depends on crop, but 30°C+ stresses many crops; 40°C is severe.
      // Use maxTemp and VPD (vapor pressure deficit increases stress).
      let heatScore = 0;
      if (maxTemp !== null) {
        const t0 = 30; // start of stress
        const tMax = 45; // extreme
        const tRatio = clamp((maxTemp - t0) / (tMax - t0), 0, 1);
        const vpdNorm = vpd !== null ? clamp(vpd / 6, 0, 1) : 0; // vpd~6 kPa extreme
        const raw = 0.75 * tRatio + 0.25 * vpdNorm;
        heatScore = pct(raw);
      } else {
        heatScore = 0;
      }

      // ---- C O L D  /  F R O S T  S C O R E ----
      // Many crops damaged when minima fall below ~8°C and severe damage <0-2°C.
      let coldScore = 0;
      if (minTemp !== null) {
        const tSafe = 8;
        const tCritical = -2; // severe frost
        // map: minTemp >= tSafe => 0 ; minTemp <= tCritical => 1
        const raw = clamp((tSafe - minTemp) / (tSafe - tCritical), 0, 1);
        coldScore = pct(raw);
      } else {
        coldScore = 0;
      }

      // ---- W I N D  /  C Y C L O N E  S C O R E ----
      // Use wind gust as primary metric; cyclone risk also increases with gusts and sustained wind.
      // Map gust 0..100 km/h to 0..1; weight gust more.
      const gustMax = 120; // extreme gust scale; 120 km/h => near 100%
      const gustRaw = clamp(windGust / gustMax, 0, 1);
      const windRaw = clamp(0.7 * gustRaw + 0.3 * clamp(windSpeed / 80, 0, 1), 0, 1);
      const windPct = pct(windRaw);

      // ---- H E A V Y  R A I N  /  C L O U D B U R S T  S C O R E ----
      // Rain severity uses precipitation amount and heavy precipitation hours.
      const precipMax = 100; // mm/day extreme
      const precipRatio2 = clamp(precip / precipMax, 0, 1);
      const heavyHoursFactor = clamp(heavyPrecipHours / 6, 0, 1); // many hours => seriousness
      const rainRaw = 0.8 * precipRatio2 + 0.2 * heavyHoursFactor;
      const rainPct = pct(rainRaw);

      // ---- A I R  Q U A L I T Y  S T R E S S  S C O R E ----
      // Weighted PM2.5, PM10, O3 against guideline thresholds (tunable)
      // WHO guideline: PM2.5 24h ~ 15 µg/m3 (we use higher thresholds for "stress")
      const pm25Ref = 60; // µg/m3 -> high stress
      const pm10Ref = 120;
      const o3Ref = 180;
      const pm25Score = clamp(pm25 / pm25Ref, 0, 2); // can exceed 1
      const pm10Score = clamp(pm10 / pm10Ref, 0, 2);
      const o3Score = clamp(o3 / o3Ref, 0, 2);
      const airRaw = clamp((0.6 * pm25Score + 0.3 * pm10Score + 0.1 * o3Score) / 2, 0, 1); // normalize range
      const airPct = pct(airRaw);

      // Save raw and scores
      setRaw({
        discharge,
        precip,
        maxTemp,
        minTemp,
        windGust,
        windSpeed,
        sm0,
        sm1,
        et0,
        vpd,
        pm25,
        pm10,
        o3,
      });

      setScores({
        flood: floodJson?.daily?.river_discharge ? pct(clamp(floodRawScore, 0, 1)) : 0,
        drought: droughtScore,
        heat: heatScore,
        cold: coldScore,
        wind: windPct,
        rain: rainPct,
        air: airPct,
      });

      setError(null);
    } catch (err) {
      console.error("Fetch/score error:", err);
      setError("Failed to fetch or score weather data: " + (err?.message || "unknown"));
      setScores({
        flood: 0,
        drought: 0,
        heat: 0,
        cold: 0,
        wind: 0,
        rain: 0,
        air: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getLocationAndRun = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        fetchAndScore(lat, lon);
      },
      (err) => {
        setError("Geolocation error: " + err?.message);
        setLoading(false);
      },
      { timeout: 20000 }
    );
  };

  useEffect(() => {
    getLocationAndRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to choose color class for bar
  const barColorClass = (value) => {
    if (value === null) return "from-gray-500 to-gray-600";
    if (value >= 75) return "from-red-500 to-red-600";
    if (value >= 50) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-green-600";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Agricultural Risk — Percent Scores
          </h1>
          <p className="text-xl text-white/60">Domain-aware crop impact percentages (local, Open-Meteo)</p>
        </motion.div>

        <div className="max-w-4xl mx-auto mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={getLocationAndRun}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-3 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <FaLocationArrow /> Update Local Scores
              </>
            )}
          </motion.button>

          {error && <div className="mt-4 text-red-400 bg-red-500/10 p-3 rounded">{error}</div>}
        </div>

        {/* Grid of risk cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <RiskCard
            title="Flood Risk"
            icon={<FaWater className="text-3xl" />}
            percent={scores.flood}
            colorClass={barColorClass(scores.flood)}
            note={`River discharge: ${raw.discharge ?? "N/A"} m³/s • Precip: ${raw.precip ?? "N/A"} mm`}
          />

          <RiskCard
            title="Drought Risk"
            icon={<FaLeaf className="text-3xl" />}
            percent={scores.drought}
            colorClass={barColorClass(scores.drought)}
            note={`Soil(S): ${raw.sm0 != null ? raw.sm0.toFixed(3) : "N/A"} • Root: ${raw.sm1 != null ? raw.sm1.toFixed(3) : "N/A"} • ET0: ${raw.et0 ?? "N/A"}`}
          />

          <RiskCard
            title="Cyclone / Severe Wind Risk"
            icon={<FaWind className="text-3xl" />}
            percent={scores.wind}
            colorClass={barColorClass(scores.wind)}
            note={`Gust: ${raw.windGust ?? "N/A"} km/h • Wind: ${raw.windSpeed ?? "N/A"} km/h`}
          />

          <RiskCard
            title="Tornado-like / Severe Thunder"
            icon={<FaCloudRain className="text-3xl" />}
            percent={scores.rain}
            colorClass={barColorClass(scores.rain)}
            note={`Precip: ${raw.precip ?? "N/A"} mm • Heavy hours: ${raw.heavyPrecipHours ?? "N/A"}`}
          />

          <RiskCard
            title="Heatwave Risk"
            icon={<FaThermometerHalf className="text-3xl" />}
            percent={scores.heat}
            colorClass={barColorClass(scores.heat)}
            note={`Max T: ${raw.maxTemp ?? "N/A"}°C • VPD: ${raw.vpd ?? "N/A"}`}
          />

          <RiskCard
            title="Cold / Frost Risk"
            icon={<FaSnowflake className="text-3xl" />}
            percent={scores.cold}
            colorClass={barColorClass(scores.cold)}
            note={`Min T: ${raw.minTemp ?? "N/A"}°C`}
          />

          <RiskCard
            title="Air Quality Stress"
            icon={<FaSmog className="text-3xl" />}
            percent={scores.air}
            colorClass={barColorClass(scores.air)}
            note={`PM2.5: ${raw.pm25 ?? "N/A"} • PM10: ${raw.pm10 ?? "N/A"} • O₃: ${raw.o3 ?? "N/A"}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

/* ----- Presentational components ----- */

const RiskCard = ({ title, icon, percent, colorClass, note }) => {
  // percent may be null -> show N/A
  const displayPct = typeof percent === "number" ? percent : 0;
  const isNA = percent === null || percent === undefined;

  const barStyle = { width: `${Math.min(Math.max(displayPct, 0), 100)}%` };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center text-white/90">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/60 mt-1">{note}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white">{isNA ? "N/A" : `${displayPct}%`}</div>
          <div className="text-xs text-white/50 mt-1">{isNA ? "Insufficient data" : "Percent risk"}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
          <div style={barStyle} className={`h-full ${colorClass}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default DisasterAlerts;
