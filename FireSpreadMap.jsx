import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon issues with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const FireSpreadMap = () => {
  // Parameters
  const windSpeed = 15; // m/s
  const windDir = 45; // degrees, NE
  const humidity = 30; // %
  const temperature = 35; // °C
  const fuelLoad = 3; // scale 1–5

  // Ignition point (Perth)
  const ignitionPoint = [-31.95, 115.86]; // [lat, lon]

  // ROS formula components
  const baseRate = 5;
  const windFactor = 1 + windSpeed / 20;
  const humidityFactor = 1 - humidity / 100;
  const fuelFactor = fuelLoad / 5;

  // Calculate Rate of Spread (m/min)
  const ROS = baseRate * windFactor * humidityFactor * fuelFactor;

  // Simulation time horizon and steps
  const timeHorizon = 60; // minutes
  const stepInterval = 5; // minutes
  const numSteps = timeHorizon / stepInterval;

  const [firePerimeters, setFirePerimeters] = useState([]);

  useEffect(() => {
    const perimeters = [];
    for (let i = 1; i <= numSteps; i++) {
      const elapsedMinutes = i * stepInterval;
      const majorAxis = ROS * elapsedMinutes; // meters
      const minorAxis = majorAxis / 2; // meters

      // Convert meters to kilometers for turf.ellipse
      const majorAxisKm = majorAxis / 1000;
      const minorAxisKm = minorAxis / 1000;

      const center = turf.point([ignitionPoint[1], ignitionPoint[0]]); // turf expects [lon, lat]
      const options = {
        steps: 64,
        units: 'kilometers',
        orientation: windDir, // Rotate ellipse by wind direction
      };
      const ellipse = turf.ellipse(center, majorAxisKm, minorAxisKm, options);
      perimeters.push(ellipse);
    }
    setFirePerimeters(perimeters);
  }, [ROS, numSteps, windDir, ignitionPoint]);

  const geoJsonStyle = {
    fillColor: 'red',
    weight: 2,
    opacity: 1,
    color: 'red',
    fillOpacity: 0.3,
  };

  return (
    <MapContainer
      center={ignitionPoint}
      zoom={10}
      style={{ height: '100vh', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={ignitionPoint}>
        <Popup>
          Ignition Point: Perth
          <br />
          Lat: {ignitionPoint[0]}, Lon: {ignitionPoint[1]}
        </Popup>
      </Marker>
      {firePerimeters.map((perimeter, index) => (
        <GeoJSON key={index} data={perimeter} style={geoJsonStyle} />
      ))}
    </MapContainer>
  );
};

export default FireSpreadMap;
