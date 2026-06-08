import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import DonationStatusBadge from '../../components/donations/DonationStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import { ClipboardList, Search, Filter, ArrowRight, Calendar, MapPin, Box } from 'lucide-react';

const AcceptedDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAcceptedDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 6,
      });

      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const response = await api.get(`/donations/ngo/accepted?${params.toString()}`);
      if (response.data.success) {
        setDonations(response.data.donations);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || response.data.donations.length);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to retrieve accepted claims',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedDonations();
  }, [page, status]); // fetch on page or status change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAcceptedDonations();
  };

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">My Claimed Food</h2>
              <p className="text-slate-500 text-sm mt-0.5">Track and update the status of your claimed food donations</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 bg-white border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
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

          {/* Status Filter */}
          <div className="flex w-full md:w-2/3 flex-wrap md:justify-end gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">All Claims</option>
                <option value="claimed">Claimed</option>
                <option value="picked up">Picked Up</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Content Listings Grid */}
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-xl h-96 animate-pulse p-5 flex flex-col gap-4">
                <div className="bg-slate-200 h-44 rounded-lg w-full" />
                <div className="bg-slate-200 h-6 w-3/4 rounded" />
                <div className="bg-slate-200 h-4 w-1/2 rounded mt-2" />
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 mt-auto">
                  <div className="bg-slate-200 h-3 w-full rounded" />
                  <div className="bg-slate-200 h-3 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : donations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((donation) => {
                const mainImage = donation.images && donation.images[0]
                  ? donation.images[0]
                  : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60';
                
                return (
                  <Card key={donation._id} className="hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white group border border-slate-100 overflow-hidden rounded-2xl">
                    <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={mainImage}
                        alt={donation.foodName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <DonationStatusBadge status={donation.status} />
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-1 bg-black/60 text-white rounded backdrop-blur-sm uppercase tracking-wider">
                          {donation.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col gap-4 justify-between">
                      <div>
                        <h4 className="text-md font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {donation.foodName}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                          <Box className="h-4 w-4 text-slate-400" />
                          <span>Quantity: <strong className="text-slate-700 font-semibold">{donation.quantity}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">Expires: <strong className="text-slate-700">{new Date(donation.expiryDate).toLocaleDateString()}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{donation.location?.address}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link to={`/ngo/donations/${donation._id}`}>
                          <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
                            Claim Management <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 bg-white px-6 py-4 border border-slate-150 rounded-xl shadow-sm">
                <span className="text-sm text-slate-500 font-medium">
                  Showing Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalItems} items)
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
            <ClipboardList className="h-16 w-16 text-slate-350 stroke-1 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Claimed Food Found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              You haven't claimed any active food drives yet. Browse nearby food donations to claim listed resources.
            </p>
            <Link to="/ngo/nearby" className="mt-6">
              <Button variant="primary">Discover Food Drives</Button>
            </Link>
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

export default AcceptedDonations;
