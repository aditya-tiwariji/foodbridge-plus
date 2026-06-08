import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { Search, MapPin, Loader } from 'lucide-react';

const MapPicker = ({ value = { address: '', coordinates: [0, 0] }, onChange }) => {
  const [addressInput, setAddressInput] = useState(value.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [lng, lat] = value.coordinates || [0, 0];

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const scriptId = 'leaflet-js-cdn';
    const cssId = 'leaflet-css-cdn';

    let cssLink = document.getElementById(cssId);
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = cssId;
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    let jsScript = document.getElementById(scriptId);
    if (!jsScript) {
      jsScript = document.createElement('script');
      jsScript.id = scriptId;
      jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      jsScript.onload = () => setLeafletLoaded(true);
      document.body.appendChild(jsScript);
    } else {
      if (window.L) {
        setLeafletLoaded(true);
      } else {
        jsScript.addEventListener('load', () => setLeafletLoaded(true));
      }
    }
  }, []);

  // Update Leaflet Map and Marker coordinates when they change
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || (lat === 0 && lng === 0)) return;

    const L = window.L;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([lat, lng], 15);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-500/40">📍</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      markerInstance.current = marker;
    } else {
      mapInstance.current.setView([lat, lng], 15);
      if (markerInstance.current) {
        markerInstance.current.setLatLng([lat, lng]);
      }
    }
  }, [leafletLoaded, lat, lng]);

  // Clean up Leaflet Map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!addressInput.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await api.post('/location/geocode', { address: addressInput });
      if (response.data.success) {
        const { formattedAddress, latitude, longitude } = response.data;
        
        // Update the form controller state
        onChange({
          address: formattedAddress,
          coordinates: [longitude, latitude], // [lng, lat] for GeoJSON
        });
        setAddressInput(formattedAddress);
      }
    } catch (error) {
      setSearchError(error.message || 'Geocoding failed. Try a different address.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCoordinateChange = (index, val) => {
    const parsedVal = parseFloat(val);
    if (isNaN(parsedVal)) return;

    const newCoordinates = [...value.coordinates];
    newCoordinates[index] = parsedVal;

    onChange({
      ...value,
      coordinates: newCoordinates,
    });
  };

  return (
    <div className="flex flex-col gap-4 border border-slate-150 p-4 rounded-xl bg-slate-50/50">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary-500" />
        <span className="text-sm font-bold text-slate-800">Location Picker & Address Search</span>
      </div>

      {/* Address Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="e.g. 123 Main St, New York"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="flex-grow px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        />
        <Button
          type="button"
          onClick={handleSearch}
          isLoading={isSearching}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          {!isSearching && <Search className="h-4 w-4" />} Search
        </Button>
      </div>
      
      {searchError && (
        <span className="text-xs font-semibold text-red-500">{searchError}</span>
      )}

      {/* Map display and coordinate adjusts */}
      {lat !== 0 || lng !== 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Native OpenStreetMap Leaflet Map */}
          <div className="relative h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            {!leafletLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[2]">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                  <span className="text-[10px] text-slate-500 font-semibold">Configuring Map...</span>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" style={{ minHeight: '192px', zIndex: 1 }} />
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <div className="text-xs font-semibold text-slate-500">
              <p className="font-bold text-slate-700">Selected Address:</p>
              <p className="mt-0.5 text-slate-600 italic bg-white p-2 border border-slate-100 rounded">
                {value.address || 'Custom Location Coordinates'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Latitude"
                type="number"
                step="0.000001"
                value={lat} // coordinates[1] is Latitude
                onChange={(e) => handleCoordinateChange(1, e.target.value)}
                className="text-xs py-1.5 px-3"
              />
              <Input
                label="Longitude"
                type="number"
                step="0.000001"
                value={lng} // coordinates[0] is Longitude
                onChange={(e) => handleCoordinateChange(0, e.target.value)}
                className="text-xs py-1.5 px-3"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-48 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-white">
          <MapPin className="h-8 w-8 mb-2 stroke-1" />
          <p className="text-sm">Search address to place location pin on map</p>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
