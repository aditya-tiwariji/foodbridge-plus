import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import DonationCard from '../../components/donations/DonationCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import { ShoppingBag, Search, Filter, Plus } from 'lucide-react';

const MyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filter and pagination states
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMyDonations = async () => {
    setLoading(true);
    try {
      // Build API request query string (restricting to current donor user ID)
      const params = new URLSearchParams({
        donor: user.id || user._id,
        page,
        limit: 6,
      });

      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await api.get(`/donations?${params.toString()}`);
      if (response.data.success) {
        setDonations(response.data.donations);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.totalItems);
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to fetch donations list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, [page, status, category]); // fetch on page/filter change

  // Listen to socket status change events and page focus for offline sync
  useEffect(() => {
    const handleSync = () => {
      fetchMyDonations();
    };
    window.addEventListener('fb_donation_status_changed', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('fb_donation_status_changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [page, status, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMyDonations();
  };

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">My Listings</h2>
              <p className="text-slate-500 text-sm mt-0.5">Manage and track your active surplus food drives</p>
            </div>
          </div>

          <Link to="/donations/create">
            <Button variant="primary" className="flex items-center gap-1.5 shadow-md">
              <Plus className="h-4 w-4" /> List Surplus Food
            </Button>
          </Link>
        </div>

        {/* Filter Controls Row */}
        <Card className="p-4 mb-6 bg-white border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-1/3 gap-2">
            <input
              type="text"
              placeholder="Search food item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-grow px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <Button type="submit" variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="h-4 w-4" /> Find
            </Button>
          </form>

          {/* Filters Selectors */}
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
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="claimed">Claimed</option>
                <option value="delivered">Delivered</option>
                <option value="expired">Expired</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <select
              value={category}
              onChange={(e) => {
                setPage(1);
                setCategory(e.target.value);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
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
        </Card>

        {/* Content Listings Grid */}
        {loading ? (
          /* Skeleton Card Grid */
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
              {donations.map((donation) => (
                <div key={donation._id}>
                  <DonationCard donation={donation} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 bg-white px-6 py-4 border border-slate-100 rounded-xl shadow-sm">
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
          /* Empty State Block */
          <div className="text-center py-20 bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center max-w-lg mx-auto mt-12 px-6">
            <ShoppingBag className="h-16 w-16 text-slate-300 stroke-1 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Donations Found</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              You haven't listed any surplus food donation drives matching your query yet. Help reduce food waste by posting your first listing!
            </p>
            <Link to="/donations/create" className="mt-6">
              <Button variant="primary">Create First Listing</Button>
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

export default MyDonations;
