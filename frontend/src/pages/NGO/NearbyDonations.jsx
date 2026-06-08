import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import NearbyDonationCard from '../../components/donations/NearbyDonationCard.jsx';
import AcceptDonationModal from '../../components/donations/AcceptDonationModal.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import { Map, Search, Filter, Compass } from 'lucide-react';

const NearbyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Accept Claim states
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);

  const fetchNearbyDonations = async () => {
    setLoading(true);
    try {
      if (!user?.pincode) {
        setToast({
          message: 'Please update your organizational profile PIN Code to unlock matching searches.',
          type: 'warning'
        });
        setLoading(false);
        return;
      }

      // Call nearby API
      const params = new URLSearchParams({
        page,
        limit: 6,
      });

      if (category) params.append('category', category);
      if (search) params.append('search', search);

      console.log("TRACE FRONTEND: Fetch parameters:", params.toString());
      const response = await api.get(`/donations/nearby?${params.toString()}`);
      if (response.data.success) {
        console.log("TRACE FRONTEND: Received payload:", JSON.stringify(response.data));
        console.log("TRACE FRONTEND: Rendered list count:", response.data.donations?.length);
        setDonations(response.data.donations);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || response.data.donations.length);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to search matching listings',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyDonations();
  }, [page, category, user?.pincode]); // Refetch on pagination, category, or user pincode change

  // Listen to socket notification for new nearby listings and window focus
  useEffect(() => {
    const handleSync = () => {
      fetchNearbyDonations();
    };
    window.addEventListener('fb_donation_created', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('fb_donation_created', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [page, category, user?.pincode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNearbyDonations();
  };

  const handleAcceptClick = (donation) => {
    setSelectedDonation(donation);
  };

  const handleAcceptConfirm = async () => {
    if (!selectedDonation) return;
    setAcceptLoading(true);
    try {
      const response = await api.patch(`/donations/${selectedDonation._id}/accept`);
      if (response.data.success) {
        setToast({
          message: `Food drive "${selectedDonation.foodName}" claimed successfully!`,
          type: 'success'
        });
        setSelectedDonation(null);
        // Refresh feed list
        fetchNearbyDonations();
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Claim submission failed. Try again.',
        type: 'error'
      });
    } finally {
      setAcceptLoading(false);
    }
  };

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Matching Donations</h2>
              <p className="text-slate-500 text-sm mt-0.5">Discover fresh excess food listed in your PIN Code ({user?.pincode})</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <Card className="p-5 mb-6 bg-white border border-slate-100 flex flex-col md:flex-row gap-5 items-center">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-1/3 gap-2">
            <input
              type="text"
              placeholder="Search by food name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-grow px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Button type="submit" variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="h-4 w-4" /> Find
            </Button>
          </form>

          {/* Filtering row */}
          <div className="flex w-full md:w-2/3 flex-wrap md:justify-end gap-5 items-center">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value);
                }}
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="dairy">Dairy</option>
                <option value="bakery">Bakery</option>
                <option value="cooked meals">Cooked Meals</option>
                <option value="groceries">Groceries</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Content Listings Grid */}
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl h-[340px] animate-pulse p-5 flex flex-col gap-4">
                <div className="bg-slate-200 h-44 rounded-xl w-full" />
                <div className="bg-slate-200 h-6 w-3/4 rounded" />
                <div className="bg-slate-200 h-4 w-1/2 rounded" />
                <div className="flex gap-2 mt-auto">
                  <div className="bg-slate-200 h-8 flex-grow rounded" />
                  <div className="bg-slate-200 h-8 flex-grow rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : donations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((donation) => (
                <div key={donation._id}>
                  <NearbyDonationCard
                    donation={donation}
                    onAcceptClick={handleAcceptClick}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 bg-white px-6 py-4 border border-slate-150 rounded-xl shadow-sm">
                <span className="text-sm text-slate-500 font-medium">
                  Showing Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalItems} items found)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white border border-slate-150 rounded-3xl flex flex-col items-center justify-center max-w-lg mx-auto mt-12 px-6">
            <Compass className="h-16 w-16 text-slate-350 stroke-1 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Food Listings Found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              We couldn't find any pending surplus food listed matching your PIN Code. Try changing your search queries.
            </p>
          </div>
        )}
      </Container>

      {/* Confirmation Modal */}
      {selectedDonation && (
        <AcceptDonationModal
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
          onConfirm={handleAcceptConfirm}
          donationName={selectedDonation.foodName}
          isLoading={acceptLoading}
        />
      )}

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

export default NearbyDonations;
