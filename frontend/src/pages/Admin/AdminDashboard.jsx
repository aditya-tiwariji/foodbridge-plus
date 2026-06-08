import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Heart, 
  ShieldAlert, 
  CheckCircle, 
  UserX, 
  Truck, 
  Package, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { getAdminStats } from '../../services/adminService.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        setError(err.message || 'Failed to load administration stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-550 flex items-center justify-center p-6 bg-slate-900 text-white">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading administration overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied / Error</h2>
          <p className="text-slate-350 text-slate-355 mb-6">{error}</p>
          <Link to="/" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-200">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/50 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" /> Platform Control Panel
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Welcome back, Administrator
            </h1>
            <p className="text-slate-400 max-w-xl">
              Monitor user accounts, verify registered NGOs, manage food listing distributions, and review platform activities.
            </p>
          </div>
        </div>

        {/* Pending Tasks Highlight */}
        {stats?.pendingNGOVerifications > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-200">Pending NGO Approvals</h3>
                <p className="text-sm text-slate-400">
                  There are {stats.pendingNGOVerifications} NGOs awaiting credentials review.
                </p>
              </div>
            </div>
            <Link 
              to="/admin/ngos" 
              className="flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition"
            >
              Review Verification Queue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* User Stats Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-blue-400" /> User Accounts
              </h2>
              <span className="text-3xl font-extrabold text-blue-400">{stats?.users?.total || 0}</span>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
                <span className="text-slate-400 text-sm">Donors Registered</span>
                <span className="font-semibold text-slate-200">{stats?.users?.donors || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
                <span className="text-slate-400 text-sm">NGOs Registered</span>
                <span className="font-semibold text-slate-200">{stats?.users?.ngos || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/30">
                <span className="text-slate-400 text-sm">Recipients Registered</span>
                <span className="font-semibold text-slate-200">{stats?.users?.recipients || 0}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2">
                <div className="text-center bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                  <p className="text-xs text-slate-450">Active</p>
                  <p className="font-bold text-emerald-400 text-lg">{stats?.users?.active || 0}</p>
                </div>
                <div className="text-center bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                  <p className="text-xs text-slate-450">Suspended</p>
                  <p className="font-bold text-red-400 text-lg">{stats?.users?.suspended || 0}</p>
                </div>
              </div>
            </div>

            <Link to="/admin/users" className="flex items-center justify-between text-sm text-blue-400 hover:text-blue-300 font-semibold transition group">
              Manage User Accounts 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Donation Stats Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Heart className="w-5.5 h-5.5 text-emerald-400" /> Donation Drives
              </h2>
              <span className="text-3xl font-extrabold text-emerald-400">{stats?.donations?.total || 0}</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-450" />
                <div>
                  <p className="text-[11px] text-slate-450 uppercase tracking-wider font-semibold">Pending</p>
                  <p className="font-bold text-slate-200 text-lg">{stats?.donations?.pending || 0}</p>
                </div>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30 flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-sky-400" />
                <div>
                  <p className="text-[11px] text-slate-450 uppercase tracking-wider font-semibold">Accepted</p>
                  <p className="font-bold text-slate-200 text-lg">{stats?.donations?.accepted || 0}</p>
                </div>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30 flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-violet-405 text-violet-400" />
                <div>
                  <p className="text-[11px] text-slate-450 uppercase tracking-wider font-semibold">In Transit</p>
                  <p className="font-bold text-slate-200 text-lg">{stats?.donations?.pickedUp || 0}</p>
                </div>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/30 flex items-center gap-2.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[11px] text-slate-450 uppercase tracking-wider font-semibold">Delivered</p>
                  <p className="font-bold text-slate-200 text-lg">{stats?.donations?.delivered || 0}</p>
                </div>
              </div>
            </div>

            <Link to="/admin/donations" className="flex items-center justify-between text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition group pt-2.5">
              Moderate Food Listings 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Quick Access Admin Navigation Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-200">Quick Operations</h2>
              <p className="text-slate-400 text-sm">
                Access direct action centers for platform maintenance.
              </p>
              
              <div className="space-y-3 pt-2">
                <Link to="/admin/ngos" className="flex items-center gap-3 p-3.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/50 rounded-xl transition text-left group">
                  <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 group-hover:bg-amber-500/25 transition">
                    <ShieldAlert className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition">NGO Verification Queue</p>
                    <p className="text-xs text-slate-450">Review credentials of registered NGOs</p>
                  </div>
                </Link>

                <Link to="/admin/users" className="flex items-center gap-3 p-3.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/50 rounded-xl transition text-left group">
                  <div className="bg-red-500/10 p-2 rounded-lg text-red-400 group-hover:bg-red-500/25 transition">
                    <UserX className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition">User Moderation Center</p>
                    <p className="text-xs text-slate-450">Suspend or reactivate user profiles</p>
                  </div>
                </Link>
              </div>
            </div>

            <Link to="/notifications" className="flex items-center justify-between text-sm text-slate-400 hover:text-slate-350 font-semibold transition group pt-4 mt-4 border-t border-slate-800/60">
              View Your System Alerts Log 
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
