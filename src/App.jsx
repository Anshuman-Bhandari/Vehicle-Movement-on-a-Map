import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from '@mapbox/polyline';
import { getDistance } from 'geolib';
import './App.css';

const encodedRoutes = {
  route1: 'q{cxDan~zMdAiBfBqCXKJ[hA_BzAsBx@kAx@aArAiBr@s@AaDIcGGyEMaEBeMYmCYsLt@StCS`CCdCKvCEFfCzAxApACHjCBbCx@Bt@EEwCG_CiBH??sA@{ADB`C@dA@`ACv@t@PdAz@n@`@r@l@bAt@LL',
  route2: 'mdezDwlhsM|AjDI`EdANfAEvA?fBH|AB^E`@aALwB?_CHkD@gC}@yAB_ED}C@kC@{@?aAOIHSs@sAg@^_An@s@f@y@l@_Ap@mA~@y@p@u@d@s@h@o@\\q@b@_An@m@`@{@j@w@t@{@h@a@Xk@d@s@`@_@\\SvAK|@b@`A^r@^p@\\n@^n@`@r@f@~@f@|@YVw@Dk@Cw@?_ACiBEiB?aBAcB?a@D?|@@xA@z@C`AB^p@Bj@?HDAbB?l@A`@?f@Ad@@~@Az@o@?c@?QAGPm@A_AAs@ACnCGhBJ\\uADm@b@}AnAz@fBnAnBvA~C|AtCrApBpAvChDvF`CnEjAtBdBjD|@dB`ARTl@Az@z@dBj@lA|@hB|@tAtAvBpCzEpBvD`BzCn@vA~AbDfBjDfDpFfBjDlA`CfAxBTXfA}@pAcAxAgAhAaAjA_A^UeAaBq@qAg@{@u@cA_B?_A[k@_@u@Yg@q@YGe@}@[{@c@wAYaBSuAE_AAiAD}BFiCHsABgA\\mAj@y@BeA{@iB]cBy@iBqA_BcA{@m@cAc@aAi@iAg@}@e@aAWm@Se@rAs@zAiAnAoAxAiA@sCFmAcAkBeAoBs@cB{@kAg@cAi@iAWc@uAdA][]EyBGwBDgBAsACwA@mBCmB?qA@eBAiAE@sBA_B@_BAyAAiAQWo@\\[\\]D'
};

const speedOptions = {
  Low: 1000,
  Medium: 500,
  High: 200
};

const carIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/car--v1.png',
  iconSize: [30, 30]
});

// Utility component to center map on route
function FlyToCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export function App() {
  const [selectedRoute, setSelectedRoute] = useState('route1');
  const [decodedRoute, setDecodedRoute] = useState([]);
  const [carIndex, setCarIndex] = useState(0);
  const [speed, setSpeed] = useState('Medium');
  const [isRunning, setIsRunning] = useState(false);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [carPosition, setCarPosition] = useState(null);
  
  const intervalRef = useRef(null);

  // Decode route when changed
  useEffect(() => {
    const decoded = polyline.decode(encodedRoutes[selectedRoute]).map(([lat, lng]) => ({ lat, lng }));
    setDecodedRoute(decoded);
    setCarIndex(0);
    setDistanceCovered(0);
    setIsRunning(false); 
    setCarPosition(decoded[0]);
    clearInterval(intervalRef.current);
  }, [selectedRoute]);

  useEffect(() => {
    if (!isRunning || decodedRoute.length === 0) return;

    let i = carIndex;
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= decodedRoute.length) {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }
      setCarPosition(decodedRoute[i]);
      setCarIndex(i);

      if (carIndex < i) {
        const dist = getDistance(decodedRoute[carIndex], decodedRoute[i]); // in meters
        setDistanceCovered(prev => prev + dist);
      }
    }, speedOptions[speed]);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, carIndex, speed, decodedRoute]);

  const progress = ((carIndex + 1) / decodedRoute.length) * 100;
  const centerPosition = decodedRoute[Math.floor(decodedRoute.length / 2)];

  const toggleRunning = () => {
    if (carIndex >= decodedRoute.length - 1) {
      setCarIndex(0);
      setDistanceCovered(0);
    }
    setIsRunning(prev => !prev);
  };

  return (
    <div className="app">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h2 style={{textAlign: 'center', textDecoration: 'underline'}}>Vehicle Route Tracker</h2>
          <a href="https://github.com/Anshuman-Bhandari/Vehicle-Movement-on-a-Map" target='_blank'>
            <img src="https://logos-world.net/wp-content/uploads/2020/11/GitHub-Logo.png" alt="" width={80} />
          </a>
      </div>

      <div className="controls">
        <label>
          Choose Route:
          <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)}>
            <option value="route1">Route 1</option>
            <option value="route2">Route 2</option>
          </select>
        </label>

        <label>
          Speed:
          <select value={speed} onChange={e => setSpeed(e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <button onClick={toggleRunning}>
          {isRunning ? 'Pause Vehicle' : 'Start Vehicle'}
        </button>
      </div>

      <hr />

      <MapContainer center={[30.2844, 78.0701]} zoom={14} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {decodedRoute.length > 0 && (
          <>
            <Polyline positions={decodedRoute} color="blue" />
            <Marker
              position={decodedRoute[carIndex]}
              icon={carIcon}
            />
            <FlyToCenter position={centerPosition} />
          </>
        )}
      </MapContainer>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <hr />

      {carPosition && (
        <div>
          <h3>Vehicle Info:</h3>
          <ul>
            <li><b>📍 Location: {carPosition.lat.toFixed(5)}, {carPosition.lng.toFixed(5)}</b></li>
            <li><b>🚗 Speed: {speed}</b></li>
            <li><b>📏 Distance Covered: {(distanceCovered / 1000).toFixed(2)} km</b></li>
          </ul>
        </div>
      )}


    </div>
  );
}
