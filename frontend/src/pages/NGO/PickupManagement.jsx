import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import DonationStatusBadge from '../../components/donations/DonationStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import { Truck, Calendar, MapPin, CheckCircle, PackageOpen, Inbox } from 'lucide-react';

const PickupManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Tab State: 'pickup' = Ready For Pickup, 'transit' = In Transit
  const [activeTab, setActiveTab] = useState('pickup');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      // Query accepted donations of the NGO
      // We will filter on the frontend for active statuses to maintain simplicity
      const response = await api.get('/donations/ngo/accepted?limit=100');
      if (response.data.success) {
        setDonations(response.data.donations);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to fetch active claims list',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id, endpoint, successMessage) => {
    setActionLoading(true);
    try {
      const response = await api.patch(`/donations/${id}/${endpoint}`);
      if (response.data.success) {
        setToast({ message: successMessage, type: 'success' });
        // Refresh claims list
        fetchClaims();
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to update claim state',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list based on active tab
  const filteredDonations = donations.filter((donation) => {
    if (activeTab === 'pickup') {
      return donation.status === 'accepted';
    } else {
      return donation.status === 'picked up';
    }
  });

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Logistics & Pickups</h2>
              <p className="text-slate-500 text-sm mt-0.5">Manage food collections and final destination deliveries</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="border-b border-slate-200 mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pickup'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <PackageOpen className="h-4 w-4" /> Ready For Pickup ({donations.filter(d => d.status === 'accepted').length})
          </button>
          <button
            onClick={() => setActiveTab('transit')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'transit'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Truck className="h-4 w-4" /> In Transit ({donations.filter(d => d.status === 'picked up').length})
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-xl h-36 border border-slate-100 animate-pulse p-6" />
            ))}
          </div>
        ) : filteredDonations.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredDonations.map((donation) => (
              <Card
                key={donation._id}
                className="p-6 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Details */}
                <div className="flex-grow flex flex-col sm:flex-row gap-5 items-start">
                  {donation.images && donation.images[0] ? (
                    <img
                      src={donation.images[0]}
                      alt={donation.foodName}
                      className="h-20 w-20 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-350 text-xs font-bold">
                      Food
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-base">{donation.foodName}</h4>
                      <DonationStatusBadge status={donation.status} />
                    </div>
                    
                    <span className="text-xs text-slate-500 font-semibold">
                      Category: <span className="text-slate-700 capitalize">{donation.category}</span> | Quantity: <span className="text-slate-700 font-bold">{donation.quantity}</span>
                    </span>

                    <div className="flex flex-col gap-1 text-slate-400 text-xs mt-1.5">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-350 flex-shrink-0" />
                        {donation.location?.address}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-350 flex-shrink-0" />
                        Pickup Timing: {donation.pickupTime || 'Flexible'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch md:items-center border-t md:border-t-0 pt-4 md:pt-0">
                  <Link to={`/ngo/donations/${donation._id}`} className="flex-grow sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold px-4 py-2">
                      View Logistics
                    </Button>
                  </Link>

                  {activeTab === 'pickup' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex items-center justify-center gap-1 text-xs font-bold px-5 py-2 shadow-md shadow-primary-500/10"
                      onClick={() => handleUpdateStatus(donation._id, 'pickup', 'Marked Picked Up successfully!')}
                      loading={actionLoading}
                    >
                      <Truck className="h-4 w-4" /> Collected Food
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      className="flex items-center justify-center gap-1 text-xs font-bold px-5 py-2 shadow-md shadow-emerald-500/10"
                      onClick={() => handleUpdateStatus(donation._id, 'deliver', 'Marked Delivered successfully! Confirmed.')}
                      loading={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4" /> Delivered Food
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty tab state */
          <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center max-w-md mx-auto mt-6 px-6">
            <Inbox className="h-14 w-14 text-slate-300 stroke-1 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Active Actions</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
              {activeTab === 'pickup'
                ? "You don't have any accepted food claims ready for pickup. Head to nearby food drives to accept new listings."
                : "You don't have any food claims currently in transit (picked up). Claimed items must be collected before final delivery."}
            </p>
            {activeTab === 'pickup' && (
              <Link to="/ngo/nearby" className="mt-5">
                <Button variant="primary" size="sm">Discover Food</Button>
              </Link>
            )}
          </div>
        )}
      </Container>

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

export default PickupManagement;
