import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import Container from '../components/common/Container.jsx';
import PageWrapper from '../components/common/PageWrapper.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Toast from '../components/ui/Toast.jsx';
import Loader from '../components/ui/Loader.jsx';
import DonationStatusBadge from '../components/donations/DonationStatusBadge.jsx';
import { 
  PlusCircle, 
  Heart, 
  Clock, 
  CheckCircle, 
  Gift, 
  Star, 
  ArrowRight, 
  TrendingUp, 
  Award,
  Calendar
} from 'lucide-react';

const DashboardPlaceholder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not donor
  useEffect(() => {
    if (user?.role === 'ngo' || user?.role === 'recipient') {
      navigate('/ngo/dashboard', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [stats, setStats] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDonorDashboardData = async () => {
    if (!user || user.role !== 'donor') return;
    setLoading(true);
    try {
      // 1. Fetch donor analytics metrics
      const statsRes = await api.get('/analytics/donor');
      if (statsRes.data.success) {
        setStats(statsRes.data.metrics);
      }

      // 2. Fetch recent donation postings for the donor
      const listingsRes = await api.get(`/donations?donor=${user._id || user.id}&limit=5`);
      if (listingsRes.data.success) {
        setRecentListings(listingsRes.data.donations);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to populate donor dashboard',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorDashboardData();
  }, [user]);

  if (loading) {
    return <Loader fullPage message="Loading Donor Dashboard..." />;
  }

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Donor Dashboard</h2>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Track your donation listings and positive social impact.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link to="/donations/create">
              <Button variant="primary" className="flex items-center gap-1.5 shadow-md shadow-primary-500/10 font-bold">
                <PlusCircle className="h-4 w-4" /> Create Donation Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-primary-50 rounded-full group-hover:scale-125 transition-transform" />
            <div>
              <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-wider block">Total Postings</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{stats?.totalDonations || 0}</span>
            </div>
            <div className="flex items-center gap-1 mt-3 text-2xs font-bold text-primary-600">
              <Heart className="h-3.5 w-3.5" /> overall listed
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-amber-50 rounded-full group-hover:scale-125 transition-transform" />
            <div>
              <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-wider block">Active Listings</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{stats?.activeDonations || 0}</span>
            </div>
            <div className="flex items-center gap-1 mt-3 text-2xs font-bold text-amber-600">
              <Clock className="h-3.5 w-3.5" /> in progress
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-emerald-50 rounded-full group-hover:scale-125 transition-transform" />
            <div>
              <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-wider block">Completed Handouts</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{stats?.deliveredDonations || 0}</span>
            </div>
            <div className="flex items-center gap-1 mt-3 text-2xs font-bold text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" /> successfully delivered
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-indigo-50 rounded-full group-hover:scale-125 transition-transform" />
            <div>
              <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-wider block">Estimated Meals</span>
              <span className="text-2xl font-black text-slate-800 mt-2 block">{stats?.mealsContributed || 0}</span>
            </div>
            <div className="flex items-center gap-1 mt-3 text-2xs font-bold text-indigo-600">
              <Gift className="h-3.5 w-3.5" /> meals saved
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-rose-50 rounded-full group-hover:scale-125 transition-transform" />
            <div>
              <span className="text-slate-400 text-2xs font-extrabold uppercase tracking-wider block">NGO Feedbacks</span>
              <span className={`${stats?.avgRating !== null && stats?.avgRating !== undefined ? 'text-2xl font-black text-slate-800' : 'text-xs font-bold text-slate-400'} mt-2 block`}>
                {stats?.avgRating !== null && stats?.avgRating !== undefined
                  ? `${stats.avgRating} / 5.0`
                  : 'Awaiting NGO feedback.'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-3 text-2xs font-bold text-rose-600">
              <Star className={`h-3.5 w-3.5 ${stats?.avgRating !== null && stats?.avgRating !== undefined ? 'fill-rose-600' : ''}`} />
              {stats?.avgRating !== null && stats?.avgRating !== undefined ? 'outstanding donor rating' : 'awaiting reviews'}
            </div>
          </Card>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Listings Section */}
          <Card className="col-span-2 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Recent Donation Postings
              </h3>
              <Link to="/donations" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentListings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {recentListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {listing.images && listing.images[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.foodName}
                          className="h-12 w-12 rounded-lg object-cover bg-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-250 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                          Food
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{listing.foodName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Quantity: {listing.quantity} | Category: <span className="capitalize">{listing.category}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <DonationStatusBadge status={listing.status} />
                      <Link to={`/donations/${listing._id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Heart className="h-12 w-12 text-slate-350 stroke-1 mb-3 text-slate-300" />
                <h4 className="font-bold text-slate-600 text-sm">No Listings Posted Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 text-center">
                  You haven't listed any surplus food drives yet. Create a food listing to support local charities and food banks.
                </p>
                <Link to="/donations/create" className="mt-4">
                  <Button variant="primary" size="sm">Create First Listing</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Quick Operations Sidebar */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Operations Center</h3>
              <div className="flex flex-col gap-2.5">
                <Link to="/donations/create" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <PlusCircle className="h-5 w-5 text-emerald-500" /> Create Food Listing
                  </Button>
                </Link>
                <Link to="/donor/analytics" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <Award className="h-5 w-5 text-indigo-500" /> View Contribution Impact
                  </Button>
                </Link>
                <Link to="/donations" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <Calendar className="h-5 w-5 text-indigo-500 text-amber-500" /> My Listing History
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg text-white">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Award className="h-4 w-4" /> Global Impact Badge
              </div>
              <h4 className="font-bold text-base">Elite Food Savior</h4>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                Thank you for preventing food waste! Your account actively contributes to neighborhood distributions and carbon footprint reductions.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Verification:</span>
                <span className="font-semibold text-emerald-400">Certified Donor</span>
              </div>
            </Card>
          </div>
        </div>
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

export default DashboardPlaceholder;
