import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Toast from '../../components/ui/Toast.jsx';
import Modal from '../../components/ui/Modal.jsx';
import DonationImageGallery from '../../components/donations/DonationImageGallery.jsx';
import DonationTimeline from '../../components/donations/DonationTimeline.jsx';
import { ChevronLeft, Edit2, Trash2, Calendar, Phone, MapPin, Tag, Box, ArrowRight, Star } from 'lucide-react';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { socket } = useSocket();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ngoLocation, setNgoLocation] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const donorMarkerInstance = useRef(null);
  const ngoMarkerInstance = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) return null;
    const R = 6371; // Earth radius in km
    const lon1 = coords1[0] * Math.PI / 180;
    const lat1 = coords1[1] * Math.PI / 180;
    const lon2 = coords2[0] * Math.PI / 180;
    const lat2 = coords2[1] * Math.PI / 180;
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getETA = (dist) => {
    if (dist === null) return null;
    const minutes = Math.round(dist * 2 + 3);
    return `${minutes} mins`;
  };

  // Load Leaflet dynamically when coordinates are available
  useEffect(() => {
    if (!donation || !donation.location || !donation.location.coordinates) return;
    const [dLng, dLat] = donation.location.coordinates;
    if (dLng === 0 && dLat === 0) return;

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
  }, [donation]);

  // Initialize Map Once
  useEffect(() => {
    if (!leafletLoaded || !donation || !mapRef.current) return;
    const [dLng, dLat] = donation.location.coordinates || [0, 0];
    if (dLng === 0 && dLat === 0) return;

    const L = window.L;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView([dLat, dLng], 15);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const donorIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-500/40">📍</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const donorPopupContent = `
      <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
        <h4 style="margin: 0 0 4px 0; color: #1e293b; font-weight: 700; font-size: 14px;">${donation.donor?.name || 'Donor'}</h4>
        <p style="margin: 0 0 4px 0; color: #64748b;">${donation.location?.address}</p>
        <span style="font-weight: 600; color: #f43f5e;">PIN Code: ${donation.pincode || 'N/A'}</span>
      </div>
    `;

    const donorMarker = L.marker([dLat, dLng], { icon: donorIcon }).addTo(map)
      .bindPopup(donorPopupContent);

    donorMarker.on('mouseover', function () {
      this.openPopup();
    });
    
    donorMarkerInstance.current = donorMarker;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        donorMarkerInstance.current = null;
        ngoMarkerInstance.current = null;
      }
    };
  }, [leafletLoaded]);

  // Manage Markers & Fit Bounds
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current || !donation) return;
    const L = window.L;
    const [dLng, dLat] = donation.location.coordinates || [0, 0];
    if (dLng === 0 && dLat === 0) return;

    // Update donor marker position/content
    if (donorMarkerInstance.current) {
      const donorPopupContent = `
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
          <h4 style="margin: 0 0 4px 0; color: #1e293b; font-weight: 700; font-size: 14px;">${donation.donor?.name || 'Donor'}</h4>
          <p style="margin: 0 0 4px 0; color: #64748b;">${donation.location?.address}</p>
          <span style="font-weight: 600; color: #f43f5e;">PIN Code: ${donation.pincode || 'N/A'}</span>
        </div>
      `;
      donorMarkerInstance.current.setLatLng([dLat, dLng]);
      donorMarkerInstance.current.setPopupContent(donorPopupContent);
    }

    // Handle NGO Marker
    if (ngoLocation && ngoLocation.latitude && ngoLocation.longitude) {
      const ngoLat = ngoLocation.latitude;
      const ngoLng = ngoLocation.longitude;

      const ngoIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/40">🚚</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const ngoName = donation.acceptedBy?.name || donation.claimedBy?.name || 'NGO Partner';
      const ngoAddress = donation.acceptedBy?.location?.address || donation.claimedBy?.location?.address || '';
      const ngoPincode = donation.acceptedBy?.pincode || donation.claimedBy?.pincode || '';

      const ngoPopupContent = `
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
          <h4 style="margin: 0 0 4px 0; color: #1e293b; font-weight: 700; font-size: 14px;">${ngoName}</h4>
          <p style="margin: 0 0 4px 0; color: #64748b;">${ngoAddress || 'Address in transit'}</p>
          <span style="font-weight: 600; color: #3b82f6;">PIN Code: ${ngoPincode || 'N/A'}</span>
        </div>
      `;

      if (ngoMarkerInstance.current) {
        ngoMarkerInstance.current.setLatLng([ngoLat, ngoLng]);
        ngoMarkerInstance.current.setPopupContent(ngoPopupContent);
      } else {
        const ngoMarker = L.marker([ngoLat, ngoLng], { icon: ngoIcon })
          .addTo(mapInstance.current)
          .bindPopup(ngoPopupContent);
        
        ngoMarker.on('mouseover', function () {
          this.openPopup();
        });
        
        ngoMarkerInstance.current = ngoMarker;
      }

      // Adjust map bounds to fit both markers
      const bounds = L.latLngBounds([[dLat, dLng], [ngoLat, ngoLng]]);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // If no ngo location, remove ngo marker and focus on donor
      if (ngoMarkerInstance.current) {
        ngoMarkerInstance.current.remove();
        ngoMarkerInstance.current = null;
      }
      mapInstance.current.setView([dLat, dLng], 15);
      if (donorMarkerInstance.current) {
        donorMarkerInstance.current.openPopup();
      }
    }
  }, [leafletLoaded, donation, ngoLocation]);

  // Socket Tracking Connection Effect
  useEffect(() => {
    if (!donation || donation.status !== 'on the way' || !socket) {
      setNgoLocation(null);
      return;
    }

    console.log('[Socket.io] Joining tracking room:', id);
    socket.emit('join_donation_track', { donationId: id });

    // Set initial NGO coordinates if stored in DB
    if (donation.liveTracking && donation.liveTracking.isActive && donation.liveTracking.ngoLatitude) {
      console.log('[Socket.io] Restoring NGO coordinates from DB:', donation.liveTracking);
      setNgoLocation({
        latitude: donation.liveTracking.ngoLatitude,
        longitude: donation.liveTracking.ngoLongitude,
        lastUpdated: donation.liveTracking.lastUpdated ? new Date(donation.liveTracking.lastUpdated) : new Date(),
      });
    }

    const handleUpdate = (data) => {
      console.log('[Socket.io] Received NGO location update via room:', data);
      setNgoLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      });
    };

    socket.on('donation_location_updated', handleUpdate);

    return () => {
      console.log('[Socket.io] Leaving tracking room:', id);
      socket.emit('leave_donation_track', { donationId: id });
      socket.off('donation_location_updated', handleUpdate);
    };
  }, [donation?.status, socket, id]);

  // Elapsed Seconds Counter
  useEffect(() => {
    if (!ngoLocation || !ngoLocation.lastUpdated) return;
    setSecondsAgo(0);
    const interval = setInterval(() => {
      const elapsed = Math.round((new Date() - new Date(ngoLocation.lastUpdated)) / 1000);
      setSecondsAgo(elapsed > 0 ? elapsed : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [ngoLocation]);

  const fetchDonationDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/donations/${id}`);
      if (response.data.success) {
        setDonation(response.data.donation);
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to load donation details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonationDetails();
  }, [id]);

  // Listen to socket status change events and page focus for offline sync
  useEffect(() => {
    const handleSync = () => {
      fetchDonationDetails();
    };
    window.addEventListener('fb_donation_status_changed', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('fb_donation_status_changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/donations/${id}`);
      if (response.data.success) {
        setToast({ message: 'Donation deleted successfully', type: 'success' });
        setTimeout(() => {
          navigate('/donations');
        }, 1500);
      }
    } catch (error) {
      setToast({ message: error.message || 'Deletion failed. Try again.', type: 'error' });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="bg-slate-50 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary-500" />
      </PageWrapper>
    );
  }

  if (!donation) {
    return (
      <PageWrapper className="bg-slate-50">
        <Container className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-700">Donation Listing Not Found</h2>
          <Link to="/donations" className="mt-4 inline-block">
            <Button variant="primary">Back to Listings</Button>
          </Link>
        </Container>
      </PageWrapper>
    );
  }

  // Parse coords: GeoJSON coordinate order [longitude, latitude] -> coordinates[1] is lat, coordinates[0] is lng
  const [lng, lat] = donation.location?.coordinates || [0, 0];
  const userId = user?.id || user?._id;
  const isOwner = donation.donor === userId || donation.donor?._id === userId;
  const isPending = donation.status === 'pending';
  const canDelete = ['pending', 'expired', 'rejected'].includes(donation.status);
  const isDelivered = donation.status === 'delivered';

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Navigation back and Owner Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 mt-4">
          <Link to="/donations" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold transition-colors text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Listings
          </Link>

          {isOwner && (
            <div className="flex gap-2.5">
              {isPending && (
                <Link to={`/donations/${donation._id}/edit`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Edit2 className="h-4 w-4" /> Edit Listing
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Delete Listing
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Layout grid columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Side (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Gallery card */}
            <Card className="p-6 bg-white border border-slate-100 shadow-md">
              <DonationImageGallery images={donation.images} />
              
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge status={donation.status}>{donation.status.toUpperCase()}</Badge>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full capitalize">
                    {donation.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mt-2">{donation.foodName}</h2>
                <p className="text-sm font-semibold text-slate-500">Listed on: {new Date(donation.createdAt).toLocaleDateString()}</p>
              </div>
            </Card>

            {/* Description details card */}
            <Card className="p-6 bg-white border border-slate-100 shadow-md flex flex-col gap-5">
              <div>
                <h3 className="text-md font-bold text-slate-800 mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{donation.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</p>
                    <p className="text-slate-800 font-semibold mt-0.5">{donation.quantity}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Threshold</p>
                    <p className="text-slate-800 font-semibold mt-0.5">
                      {new Date(donation.expiryDate).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* NGO Feedback Card */}
            {(donation.status === 'picked up' || donation.status === 'delivered') && (
              <Card className="p-6 bg-white border border-slate-100 shadow-md">
                <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> NGO Feedback & Rating
                </h3>
                {donation.feedback && donation.feedback.rating ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <Star
                            key={starVal}
                            className={`h-5 w-5 ${
                              starVal <= donation.feedback.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-slate-700">({donation.feedback.rating} / 5.0)</span>
                    </div>
                    {donation.feedback.comment && (
                      <p className="text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm italic">
                        "{donation.feedback.comment}"
                      </p>
                    )}
                    <span className="text-3xs text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                      Submitted on: {new Date(donation.feedback.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-semibold italic">Awaiting NGO feedback.</p>
                )}
              </Card>
            )}

            {/* Maps and logistics location card */}
            <Card className="p-6 bg-white border border-slate-100 shadow-md">
              <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-1">
                <MapPin className="h-5 w-5 text-primary-500" /> Pickup Logistics
              </h3>

              <div className="flex flex-col gap-4">
                <div className="text-sm">
                  <p className="text-slate-500 font-semibold">Address:</p>
                  <p className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {donation.location.address}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-semibold">Coordinate Latitude:</p>
                    <p className="text-slate-800 font-mono font-medium mt-0.5">{lat}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Coordinate Longitude:</p>
                    <p className="text-slate-800 font-mono font-medium mt-0.5">{lng}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-slate-500 font-semibold">Pickup Time Instructions:</p>
                  <p className="text-slate-800 font-semibold mt-0.5 text-primary-600 bg-primary-50/50 px-3 py-1.5 rounded-lg border border-primary-100 inline-block">
                    {donation.pickupTime}
                  </p>
                </div>

                {donation.status === 'on the way' && ngoLocation && (
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl p-4 shadow-md flex flex-col gap-3 my-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">Live Tracking NGO Vehicle</span>
                      </div>
                      <span className="text-2xs bg-white/25 px-2.5 py-0.5 rounded-full font-semibold">
                        Updated {secondsAgo}s ago
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-1">
                      <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <span className="text-3xs font-bold uppercase tracking-wider block text-pink-200">Distance</span>
                        <span className="text-sm font-black text-white">
                          {calculateDistance(donation.location?.coordinates, [ngoLocation.longitude, ngoLocation.latitude]) !== null
                            ? `${calculateDistance(donation.location?.coordinates, [ngoLocation.longitude, ngoLocation.latitude]).toFixed(2)} km`
                            : '--'}
                        </span>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <span className="text-3xs font-bold uppercase tracking-wider block text-pink-200">Est. ETA</span>
                        <span className="text-sm font-black text-white">
                          {calculateDistance(donation.location?.coordinates, [ngoLocation.longitude, ngoLocation.latitude]) !== null
                            ? getETA(calculateDistance(donation.location?.coordinates, [ngoLocation.longitude, ngoLocation.latitude]))
                            : '--'}
                        </span>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <span className="text-3xs font-bold uppercase tracking-wider block text-pink-200">NGO Partner</span>
                        <span className="text-sm font-black text-white truncate block">
                          {donation.acceptedBy?.name || donation.claimedBy?.name || 'NGO Partner'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Native OpenStreetMap Leaflet Map */}
                {lat !== 0 && lng !== 0 && (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm mt-2">
                    {!leafletLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[2]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                          <span className="text-xs text-slate-500 font-semibold">Configuring Map Layers...</span>
                        </div>
                      </div>
                    )}
                    <div ref={mapRef} className="w-full h-full" style={{ minHeight: '256px', zIndex: 1 }} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Timeline and Contacts Sidebar (1 col) */}
          <div className="flex flex-col gap-6">
            {/* Timeline component */}
            <Card className="p-6 bg-white border border-slate-100 shadow-md">
              <DonationTimeline statusHistory={donation.statusHistory} currentStatus={donation.status} />
            </Card>

            {/* Contacts Info */}
            <Card className="p-6 bg-white border border-slate-100 shadow-md flex flex-col gap-4">
              <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-3">Contact Details</h3>

              {/* Donor Contact */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listed By (Donor)</p>
                <div className="p-3 bg-slate-50 rounded-lg flex flex-col gap-1 border border-slate-100">
                  <span className="text-sm font-bold text-slate-800">{donation.donor?.name || 'Authorized Donor'}</span>
                  {donation.donor?.phone && (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3.5 w-3.5" /> {donation.donor.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* NGO Contact (if accepted) */}
              {donation.acceptedBy && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Claimed By (NGO)</p>
                  <div className="p-3 bg-blue-50/50 rounded-lg flex flex-col gap-1 border border-blue-100">
                    <span className="text-sm font-bold text-blue-800">{donation.acceptedBy.name}</span>
                    {donation.acceptedBy.phone && (
                      <span className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3.5 w-3.5" /> {donation.acceptedBy.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Container>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this surplus food listing? This action is permanent and will destroy associated media assets.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
              Delete Listing
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageWrapper>
  );
};

export default DonationDetails;
