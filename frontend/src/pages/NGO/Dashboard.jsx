import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import NGOStatsCard from '../../components/donations/NGOStatsCard.jsx';
import DonationStatusBadge from '../../components/donations/DonationStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import {
  Map,
  ClipboardList,
  Truck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  User,
  Clock,
  Percent
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch stats
      const statsRes = await api.get('/donations/ngo/stats');
      let statsObj = {};
      if (statsRes.data.success) {
        statsObj = { ...statsRes.data.stats };
      }

      // 2. Fetch performance stats
      const performanceRes = await api.get('/analytics/ngo');
      if (performanceRes.data.success) {
        statsObj = { ...statsObj, ...performanceRes.data.metrics };
      }

      setStats(statsObj);

      // 3. Fetch recent accepted donations (limit 3)
      const claimsRes = await api.get('/donations/ngo/accepted?limit=3');
      if (claimsRes.data.success) {
        setRecentClaims(claimsRes.data.donations);
      }
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to populate NGO dashboard stats',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to socket triggers and page focus to auto-refresh stats
  useEffect(() => {
    const handleSync = () => {
      fetchDashboardData();
    };
    window.addEventListener('fb_donation_created', handleSync);
    window.addEventListener('fb_donation_status_changed', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('fb_donation_created', handleSync);
      window.removeEventListener('fb_donation_status_changed', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  return (
    <PageWrapper className="bg-slate-50">
      <Container>
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">NGO Dashboard</h2>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Discover surplus food drives in your locality.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link to="/ngo/nearby">
              <Button variant="primary" className="flex items-center gap-1.5 shadow-md">
                <Map className="h-4 w-4" /> Discover Nearby Food
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading / KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-28 animate-pulse border border-slate-100 p-5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <NGOStatsCard
              title="Nearby Active"
              count={stats?.nearbyDonations || 0}
              icon={Map}
              color="primary"
            />
            <NGOStatsCard
              title="Total Claims"
              count={stats?.claimedDonations || 0}
              icon={ClipboardList}
              color="purple"
            />
            <NGOStatsCard
              title="Pickups Pending"
              count={stats?.pendingPickups || 0}
              icon={Truck}
              color="warning"
            />
            <NGOStatsCard
              title="Completed"
              count={stats?.deliveriesCompleted || 0}
              icon={CheckCircle}
              color="success"
            />
            <NGOStatsCard
              title="Success Rate"
              count={`${parseFloat(stats?.completionRate || 0).toFixed(1)}%`}
              icon={Percent}
              color="info"
            />
            <NGOStatsCard
              title="Avg Claim Time"
              count={`${stats?.avgResponseTime || 0} min`}
              icon={Clock}
              color="danger"
            />
          </div>
        )}

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Claims Section */}
          <Card className="col-span-2 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Recent Claims Activity
              </h3>
              <Link to="/ngo/accepted" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentClaims.length > 0 ? (
              <div className="flex flex-col gap-4">
                {recentClaims.map((claim) => (
                  <div
                    key={claim._id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {claim.images && claim.images[0] ? (
                        <img
                          src={claim.images[0]}
                          alt={claim.foodName}
                          className="h-12 w-12 rounded-lg object-cover bg-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                          Food
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{claim.foodName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Quantity: {claim.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <DonationStatusBadge status={claim.status} />
                      <Link to={`/ngo/donations/${claim._id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <ClipboardList className="h-12 w-12 text-slate-300 stroke-1 mb-3" />
                <h4 className="font-bold text-slate-600 text-sm">No Claims Registered</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  You haven't claimed any active food drives yet. Browse nearby food donations to get started.
                </p>
                <Link to="/ngo/nearby" className="mt-4">
                  <Button variant="outline" size="sm">Browse Food Drives</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Quick Action Pane */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Operations</h3>
              <div className="flex flex-col gap-2.5">
                <Link to="/ngo/nearby" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50">
                    <Map className="h-5 w-5 text-indigo-500" /> Discover Nearby Food
                  </Button>
                </Link>
                <Link to="/ngo/pickups" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50">
                    <Truck className="h-5 w-5 text-amber-500" /> Manage Pickups
                  </Button>
                </Link>
                <Link to="/ngo/accepted" className="w-full">
                  <Button variant="outline" className="w-full justify-start text-left gap-3 text-slate-700 font-semibold border-slate-200 py-3.5 rounded-xl hover:bg-slate-50">
                    <ClipboardList className="h-5 w-5 text-purple-500" /> My Claims History
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg text-white">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                <User className="h-4 w-4" /> Profile Info
              </div>
              <h4 className="font-bold text-base">{user?.name}</h4>
              <p className="text-slate-400 text-xs mt-1 truncate">{user?.email}</p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Address:</span>
                <span className="font-semibold text-slate-200 text-right truncate max-w-xs">{user?.location?.address || 'Not Configured'}</span>
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

export default Dashboard;
