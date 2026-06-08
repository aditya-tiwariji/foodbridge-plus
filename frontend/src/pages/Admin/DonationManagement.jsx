import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  Filter, 
  Trash2, 
  Clock, 
  User, 
  MapPin, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminDonations, deleteAdminDonation } from '../../services/adminService.js';

const DonationManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  const fetchDonationsList = async () => {
    setLoading(true);
    try {
      const data = await getAdminDonations({
        search,
        category,
        status,
        page,
        limit: 8
      });
      if (data.success) {
        setDonations(data.donations);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonationsList();
  }, [category, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDonationsList();
  };

  const handleDeleteListing = async (donationId) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing? Associated images will also be removed.')) {
      return;
    }
    setDeleteLoading(donationId);
    try {
      await deleteAdminDonation(donationId);
      await fetchDonationsList();
    } catch (err) {
      alert(err.message || 'Listing deletion failed.');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Heart className="w-8 h-8 text-emerald-400" /> Platform Listings Moderation
            </h1>
            <p className="text-sm text-slate-400">
              Browse food drives posted across the platform and delete spam or expired entries.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm text-slate-450">Active Food listings:</span>
            <span className="text-lg font-bold text-emerald-400">{totalItems}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-455">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search food item name..."
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3 rounded-xl transition outline-none"
              />
            </div>

            {/* Category */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-455">
                <Filter className="w-4 h-4" />
              </span>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition outline-none appearance-none"
              >
                <option value="">All Categories</option>
                <option value="cooked">Cooked Food</option>
                <option value="raw">Raw Materials / Groceries</option>
                <option value="packaged">Packaged Goods</option>
                <option value="canned">Canned Items</option>
                <option value="other">Other Listings</option>
              </select>
            </div>

            {/* Status */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-455">
                <Filter className="w-4 h-4" />
              </span>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition outline-none appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Claim</option>
                <option value="accepted">Accepted / Claims</option>
                <option value="picked up">In Transit / Collected</option>
                <option value="delivered">Delivered / Closed</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-950/20 transition duration-200"
            >
              Filter Search
            </button>
          </form>
        </div>

        {/* Listings Feed */}
        {error && (
          <div className="p-5 bg-red-900/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-60 animate-pulse"></div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-16 text-center text-slate-400 backdrop-blur-xl">
            <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-200">No Food Drives Found</h3>
            <p className="text-sm text-slate-550 mt-1.5">No listing records match the specified filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {donations.map((item) => (
              <div key={item._id} className="bg-slate-900/60 border border-slate-800/85 hover:border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col justify-between shadow-xl hover:shadow-2xl transition duration-250 group">
                
                {/* Visual Header / Banner Image */}
                <div className="relative h-40 bg-slate-950 overflow-hidden border-b border-slate-800/50">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.foodName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900/40 text-slate-650">
                      <Heart className="w-10 h-10 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-950/20 shadow-lg ${
                      item.status === 'delivered' 
                        ? 'bg-emerald-600 text-white' 
                        : item.status === 'picked up' 
                        ? 'bg-violet-650 text-white bg-violet-600' 
                        : item.status === 'accepted' 
                        ? 'bg-sky-600 text-white' 
                        : 'bg-amber-600 text-white'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-800/60 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] text-slate-400 font-mono">
                    ID: {item._id.substring(18)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition">{item.foodName}</h2>
                      <span className="text-xs bg-slate-950/60 border border-slate-800 text-slate-350 px-2.5 py-1 rounded-lg font-semibold">{item.category}</span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{item.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-350 border-t border-b border-slate-800/50 py-3.5 my-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500/80 shrink-0" />
                      <span className="truncate">Donor: <strong className="text-slate-200">{item.donor?.name || 'Deleted User'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500/80 shrink-0" />
                      <span>Expires: <strong className="text-slate-200">{new Date(item.expiryDate).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-455 text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-600" />
                      <span className="truncate max-w-xs">{item.location?.address}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteListing(item._id)}
                      disabled={deleteLoading === item._id || item.status === 'delivered'}
                      className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 p-2.5 rounded-xl transition duration-200 shrink-0 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-red-400"
                      title={item.status === 'delivered' ? 'Cannot delete delivered food listings' : 'Delete listing'}
                    >
                      {deleteLoading === item._id ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block"></span>
                      ) : (
                        <Trash2 className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-6 py-4.5 flex items-center justify-between backdrop-blur-xl">
            <p className="text-xs text-slate-450">
              Showing Page <span className="font-bold text-slate-350">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-950 p-2.5 rounded-xl transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-950 p-2.5 rounded-xl transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DonationManagement;
