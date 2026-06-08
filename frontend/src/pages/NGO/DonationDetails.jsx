import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import DonationImageGallery from '../../components/donations/DonationImageGallery.jsx';
import DonationTimeline from '../../components/donations/DonationTimeline.jsx';
import DonationStatusBadge from '../../components/donations/DonationStatusBadge.jsx';
import TimeRemainingBadge from '../../components/donations/TimeRemainingBadge.jsx';
import DistanceBadge from '../../components/donations/DistanceBadge.jsx';
import AcceptDonationModal from '../../components/donations/AcceptDonationModal.jsx';
import DualMap from '../../components/maps/DualMap.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { ArrowLeft, Box, Calendar, Phone, MapPin, CheckCircle, Truck, User, Star } from 'lucide-react';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const watchIdRef = useRef(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals / Actions
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  const fetchDonationDetails = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get(`/donations/${id}`);
      if (response.data.success) {
        setDonation(response.data.donation);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to retrieve donation details',
        type: 'error'
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonationDetails(true);
  }, [id]);

  // Listen to socket status change events and page focus for offline sync
  useEffect(() => {
    const handleSync = () => {
      fetchDonationDetails(false);
    };
    window.addEventListener('fb_donation_status_changed', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('fb_donation_status_changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [id]);

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Set up live tracking room and watchPosition when status is 'on the way'
  useEffect(() => {
    if (!donation) return;
    const userId = user?.id || user?._id;
    const isClaimedByMe = (donation.acceptedBy && (donation.acceptedBy._id === userId || donation.acceptedBy === userId)) ||
                          (donation.claimedBy && (donation.claimedBy._id === userId || donation.claimedBy === userId));

    if (donation.status === 'on the way' && isClaimedByMe && socket) {
      console.log('[Socket.io] Joining tracking room for donation:', id);
      socket.emit('join_donation_track', { donationId: id });

      if (watchIdRef.current === null) {
        if (navigator.geolocation) {
          console.log('[Geolocation] Starting watchPosition for NGO live tracking');
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log('[Geolocation] Sending NGO location update via socket:', latitude, longitude);
              socket.emit('ngo_location_update', {
                donationId: id,
                latitude,
                longitude,
              });
            },
            (error) => {
              console.error('[Geolocation] watchPosition error:', error.message);
              setToast({
                message: `GPS tracking error: ${error.message}. Please verify device location permissions.`,
                type: 'warning'
              });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        } else {
          setToast({
            message: 'Geolocation is not supported by your browser.',
            type: 'error'
          });
        }
      }
    } else {
      // Clean up if status is no longer 'on the way' or not claimed by me
      if (watchIdRef.current !== null) {
        console.log('[Geolocation] Stopping watchPosition (status or claim changed)');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socket) {
        socket.emit('leave_donation_track', { donationId: id });
      }
    }
  }, [donation?.status, user, socket, id]);

  const handleAcceptConfirm = async () => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/donations/${id}/accept`);
      if (response.data.success) {
        setToast({ message: 'Claim accepted successfully! Donor details unlocked.', type: 'success' });
        setIsAcceptOpen(false);
        fetchDonationDetails(false); // Refresh details to show unlocked contacts
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to claim donation',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartPickup = async () => {
    setActionLoading(true);
    if (!navigator.geolocation) {
      setToast({ message: 'Geolocation is not supported by your browser.', type: 'error' });
      setActionLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.patch(`/donations/${id}/start-pickup`);
          if (response.data.success) {
            setToast({ message: 'Pickup started! Real-time location tracking activated.', type: 'success' });
            fetchDonationDetails(false);
          }
        } catch (error) {
          setToast({
            message: error.response?.data?.message || 'Failed to start pickup',
            type: 'error'
          });
        } finally {
          setActionLoading(false);
        }
      },
      (error) => {
        console.error('[Geolocation] Permission denied or error:', error);
        setToast({
          message: 'Location access is required to start pickup tracking.',
          type: 'error'
        });
        setActionLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdateStatus = async (endpoint, successMessage) => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/donations/${id}/${endpoint}`);
      if (response.data.success) {
        setToast({ message: successMessage, type: 'success' });
        fetchDonationDetails(false);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to update status',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClaim = async () => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/donations/${id}/cancel-claim`);
      if (response.data.success) {
        setToast({ message: 'Claim cancelled successfully. The listing is now open again.', type: 'success' });
        fetchDonationDetails(false);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to cancel claim',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) return;
    setActionLoading(true);
    try {
      const response = await api.patch(`/donations/${id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment,
      });
      if (response.data.success) {
        setToast({ message: 'Feedback submitted successfully! Thank you.', type: 'success' });
        setFeedbackRating(0);
        setFeedbackComment('');
        fetchDonationDetails(false);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to submit feedback',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader fullPage message="Fetching Listing Details..." />;
  }

  if (!donation) {
    return (
      <PageWrapper className="bg-slate-50">
        <Container className="py-12 max-w-xl text-center">
          <Card className="p-8 bg-white border border-slate-200">
            <h3 className="text-xl font-bold text-slate-700">Listing Not Found</h3>
            <p className="text-slate-500 text-sm mt-2">The food drive listing you requested does not exist or was deleted.</p>
            <Link to="/ngo/nearby" className="mt-6 inline-block">
              <Button variant="primary">Back to Discovery</Button>
            </Link>
          </Card>
        </Container>
      </PageWrapper>
    );
  }

  const userId = user?.id || user?._id;

  // Check relationship constraints
  const isClaimedByMe = (donation.acceptedBy && (donation.acceptedBy._id === userId || donation.acceptedBy === userId)) ||
                        (donation.claimedBy && (donation.claimedBy._id === userId || donation.claimedBy === userId));
  const isPending = donation.status === 'pending';
  const showDonorContacts = isClaimedByMe || (donation.donor && (donation.donor._id === userId || donation.donor === userId));

  // Timeline fallback mapping
  const timelineHistory = donation.statusHistory && donation.statusHistory.length > 0
    ? donation.statusHistory
    : [{ status: 'pending', changedAt: donation.createdAt || new Date() }];

  const isCoordsValid = (coords) => {
    if (!coords || coords.length !== 2) return false;
    const [lng, lat] = coords;
    if (lng === 0 && lat === 0) return false;
    return true;
  };

  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) return null;
    const R = 6371; // Radius of earth in km
    const lon1 = coords1[0] * Math.PI / 180;
    const lat1 = coords1[1] * Math.PI / 180;
    const lon2 = coords2[0] * Math.PI / 180;
    const lat2 = coords2[1] * Math.PI / 180;
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2) * Math.sin(dlon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance on the fly if coordinates exist
  // We can use leaflet distance calculation or the distance returned by the nearby feed
  // But let's check if the coordinates are present on both.
  const ngoCoords = isCoordsValid(user?.location?.coordinates) ? user?.location?.coordinates : null;
  const donorCoords = isCoordsValid(donation?.location?.coordinates) ? donation?.location?.coordinates : null;

  console.log("FRONTEND LOGS - Coordinates Received:");
  console.log("  NGO coordinates (user context):", user?.location?.coordinates);
  console.log("  Donor coordinates (donation payload):", donation?.location?.coordinates);
  console.log("FRONTEND LOGS - Coordinates Passed to Map Component:");
  console.log("  ngoCoords passed:", ngoCoords);
  console.log("  donorCoords passed:", donorCoords);

  const straightLineDistance = calculateDistance(ngoCoords, donorCoords);

  return (
    <PageWrapper className="bg-slate-50">
      <Container className="max-w-5xl py-6">
        {/* Header Action */}
        <Link to="/ngo/nearby" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main info (left 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{donation.foodName}</h2>
                  <div className="flex gap-2 items-center mt-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-slate-900/75 text-white backdrop-blur-sm uppercase tracking-wide">
                      {donation.category}
                    </span>
                    <DonationStatusBadge status={donation.status} />
                    {straightLineDistance && <DistanceBadge distance={straightLineDistance} />}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <TimeRemainingBadge expiryDate={donation.expiryDate} />
                </div>
              </div>

              {/* Image gallery */}
              <div className="my-6">
                <DonationImageGallery images={donation.images} />
              </div>

              {/* Description */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="font-bold text-slate-800 text-base mb-2">Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{donation.description}</p>
              </div>

              {/* Quantitative details */}
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Quantity</span>
                    <p className="text-sm font-bold text-slate-700">{donation.quantity}</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Pickup Timing</span>
                    <p className="text-sm font-bold text-slate-700 truncate">{donation.pickupTime || 'Flexible'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Map Integration */}
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" /> Proximity Mapping
              </h3>
              {ngoCoords && donorCoords ? (
                <DualMap
                  ngoCoords={ngoCoords}
                  donorCoords={donorCoords}
                  distance={straightLineDistance}
                  donorName={donation.donor?.name || 'Donor'}
                  ngoName={user?.name || 'My NGO'}
                  ngoAddress={user?.location?.address}
                  ngoPincode={user?.pincode}
                  donorAddress={donation.location?.address}
                  donorPincode={donation.pincode}
                />
              ) : (
                <div className="h-48 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 text-xs">
                  Map coordinates missing. Please update addresses.
                </div>
              )}
            </Card>

            {/* Feedback Card */}
            {isClaimedByMe && (donation.status === 'picked up' || donation.status === 'delivered') && (
              <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Donation Feedback
                </h3>
                {donation.feedback && donation.feedback.rating ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1">
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
                      <span className="text-sm font-bold text-slate-600 ml-1">
                        {donation.feedback.rating} / 5.0
                      </span>
                    </div>
                    {donation.feedback.comment && (
                      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 italic">
                        "{donation.feedback.comment}"
                      </p>
                    )}
                    <span className="text-3xs text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                      Submitted on: {new Date(donation.feedback.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                        Rate your pickup & delivery experience (1-5 stars)
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            type="button"
                            key={starVal}
                            onClick={() => setFeedbackRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform active:scale-95 animate-none border-none p-0 bg-transparent cursor-pointer"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                starVal <= (hoverRating || feedbackRating)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                        Comments or Notes (Optional)
                      </label>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Share details about the food quality, packaging, or donor coordination..."
                        className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] bg-white text-slate-800"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full font-bold"
                      disabled={!feedbackRating || actionLoading}
                      loading={actionLoading}
                    >
                      Submit Feedback
                    </Button>
                  </form>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar Tracking & Contacts (right 1 col) */}
          <div className="flex flex-col gap-6">
            {/* NGO claim controls */}
            <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-lg">
              <h3 className="font-bold text-base border-b border-slate-800 pb-3 mb-4">Claim Operations</h3>
              {isPending ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This donation drive is pending. Claim this donation to retrieve the donor's exact address and phone number for pickup logistics.
                  </p>
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/10 font-bold"
                    onClick={() => setIsAcceptOpen(true)}
                    loading={actionLoading}
                  >
                    Accept Food Claim
                  </Button>
                </div>
              ) : isClaimedByMe ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 w-fit">
                    <CheckCircle className="h-4 w-4" /> Claimed by Your NGO
                  </div>
                  
                  {(donation.status === 'accepted' || donation.status === 'claimed') && (
                    <>
                      <p className="text-xs text-slate-400 mt-1">
                        Pickup is currently pending. Coordinates are plotted on the map.
                      </p>
                      <div className="flex gap-2.5 mt-2">
                        <Button
                          variant="primary"
                          className="flex-grow flex items-center justify-center gap-1.5 font-bold text-xs"
                          onClick={handleStartPickup}
                          loading={actionLoading}
                        >
                          <Truck className="h-4 w-4" /> Start Pickup
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-grow flex items-center justify-center gap-1.5 font-bold text-xs"
                          onClick={handleCancelClaim}
                          loading={actionLoading}
                        >
                          Cancel Claim
                        </Button>
                      </div>
                    </>
                  )}

                  {donation.status === 'on the way' && (
                    <>
                      <p className="text-xs text-amber-400 font-semibold mt-1 animate-pulse">
                        In transit. Live tracking is active.
                      </p>
                      <Button
                        variant="primary"
                        className="w-full flex items-center justify-center gap-1.5 font-bold mt-2"
                        onClick={() => handleUpdateStatus('pickup', 'Listing marked as Picked Up! Status updated to In Transit.')}
                        loading={actionLoading}
                      >
                        <Truck className="h-4 w-4" /> Mark Picked Up
                      </Button>
                    </>
                  )}

                  {donation.status === 'picked up' && (
                    <>
                      <p className="text-xs text-slate-400 mt-1">
                        Food is currently in transit. Mark as delivered once received at your facility.
                      </p>
                      <Button
                        variant="success"
                        className="w-full flex items-center justify-center gap-1.5 font-bold mt-2"
                        onClick={() => handleUpdateStatus('deliver', 'Listing marked as Delivered successfully!')}
                        loading={actionLoading}
                      >
                        <CheckCircle className="h-4 w-4" /> Mark Delivered
                      </Button>
                    </>
                  )}

                  {donation.status === 'delivered' && (
                    <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-semibold">
                      This donation drive is completed and delivered. Thank you!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  This food drive has already been claimed by another NGO recipient.
                </p>
              )}
            </Card>

            {/* Privacy Shield & Contact Card */}
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Donor Contact Information</h3>
              {showDonorContacts ? (
                <div className="flex flex-col gap-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Donor Name</span>
                      <span className="font-semibold text-slate-800">{donation.donor?.name || 'Anonymous Donor'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
                      <a href={`tel:${donation.phone}`} className="font-semibold text-primary-600 hover:underline">{donation.phone}</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                    <div>
                      <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Exact Pickup Address</span>
                      <span className="font-semibold text-slate-800 leading-relaxed text-xs block">{donation.location?.address}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center flex flex-col items-center">
                  <div className="h-10 w-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Contact Details Redacted</h4>
                  <p className="text-slate-400 text-2xs mt-1.5 leading-normal max-w-xs">
                    Privacy protection active. Claim this donation to unlock the exact location and coordinates, donor name, phone number, and pickup logistics details.
                  </p>
                </div>
              )}
            </Card>

            {/* Audit History Timeline */}
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <DonationTimeline
                statusHistory={timelineHistory}
                currentStatus={donation.status}
              />
            </Card>
          </div>
        </div>
      </Container>

      {/* Confirmation Modal */}
      <AcceptDonationModal
        isOpen={isAcceptOpen}
        onClose={() => setIsAcceptOpen(false)}
        onConfirm={handleAcceptConfirm}
        donationName={donation.foodName}
        isLoading={actionLoading}
      />

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
