import React, { useEffect, useRef, useState } from 'react';

const DualMap = ({ 
  ngoCoords, 
  donorCoords, 
  distance, 
  donorName = 'Donor', 
  ngoName = 'My NGO',
  ngoAddress = '',
  ngoPincode = '',
  donorAddress = '',
  donorPincode = '',
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

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

  useEffect(() => {
    if (!leafletLoaded || !ngoCoords || !donorCoords || !mapRef.current) return;

    // MongoDB coordinate format is [longitude, latitude]
    // Leaflet coordinates are [latitude, longitude]
    const ngoLat = ngoCoords[1];
    const ngoLng = ngoCoords[0];
    const donorLat = donorCoords[1];
    const donorLng = donorCoords[0];

    const ngoLatLng = [ngoLat, ngoLng];
    const donorLatLng = [donorLat, donorLng];

    // Destroy prior map instance
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const L = window.L;

    // Initialize Map
    const map = L.map(mapRef.current).setView(ngoLatLng, 13);
    mapInstance.current = map;

    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Div Icons to resolve standard Vite Leaflet URL assets bug
    const donorIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-500/40">D</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const ngoIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/40">N</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const ngoPopupContent = `
      <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
        <h4 style="margin: 0 0 4px 0; color: #1e293b; font-weight: 700; font-size: 14px;">${ngoName}</h4>
        <p style="margin: 0 0 4px 0; color: #64748b;">${ngoAddress || 'Address unavailable'}</p>
        <span style="font-weight: 600; color: #3b82f6;">PIN Code: ${ngoPincode || 'N/A'}</span>
      </div>
    `;

    const donorPopupContent = `
      <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
        <h4 style="margin: 0 0 4px 0; color: #1e293b; font-weight: 700; font-size: 14px;">${donorName}</h4>
        <p style="margin: 0 0 4px 0; color: #64748b;">${donorAddress || 'Address hidden/unavailable'}</p>
        <span style="font-weight: 600; color: #f43f5e;">PIN Code: ${donorPincode || 'N/A'}</span>
      </div>
    `;

    // Add markers with hover tooltips and click popups
    const ngoMarker = L.marker(ngoLatLng, { icon: ngoIcon }).addTo(map);
    ngoMarker.bindPopup(ngoPopupContent);
    ngoMarker.bindTooltip(`<b>${ngoName}</b>`, { permanent: false, direction: 'top' });
    ngoMarker.on('mouseover', function () {
      this.openPopup();
    });
      
    const donorMarker = L.marker(donorLatLng, { icon: donorIcon }).addTo(map);
    donorMarker.bindPopup(donorPopupContent);
    donorMarker.bindTooltip(`<b>${donorName}</b>`, { permanent: false, direction: 'top' });
    donorMarker.on('mouseover', function () {
      this.openPopup();
    });

    // Add Connecting Polyline Path
    L.polyline([ngoLatLng, donorLatLng], {
      color: '#6366f1',
      weight: 3.5,
      dashArray: '6, 10',
      opacity: 0.8
    }).addTo(map);

    // Open Proximity details popup at midpoint
    if (distance) {
      const midLat = (ngoLat + donorLat) / 2;
      const midLng = (ngoLng + donorLng) / 2;
      L.popup({ closeOnClick: false, autoClose: false })
        .setLatLng([midLat, midLng])
        .setContent(`Straight-line distance: <b>${parseFloat(distance).toFixed(1)} km</b>`)
        .openOn(map);
    }

    // Auto adjust viewport zoom to encompass both locations
    const bounds = L.latLngBounds([ngoLatLng, donorLatLng]);
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletLoaded, ngoCoords, donorCoords, distance, donorName, ngoName, ngoAddress, ngoPincode, donorAddress, donorPincode]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <span className="text-xs text-slate-500 font-semibold">Configuring Map Layers...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '320px', zIndex: 1 }} />
    </div>
  );
};

export default DualMap;
