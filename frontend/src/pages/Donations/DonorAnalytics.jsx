import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  BarChart2, 
  Award, 
  Clock, 
  TrendingUp, 
  Calendar, 
  ArrowLeft,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { getDonorAnalytics } from '../../services/analyticsService.js';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const DonorAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMonths, setFilterMonths] = useState('6');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getDonorAnalytics();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load contribution metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Calculating your donations history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <HelpCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Metrics</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/donations" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-200">
            Back to Donations
          </Link>
        </div>
      </div>
    );
  }

  const { metrics, monthlyTrend, categoryDistribution } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link to="/donations" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Back to My Donations
            </Link>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-emerald-400" /> Donor Contributions Analytics
            </h1>
            <p className="text-sm text-slate-400">
              Track your community support numbers, total meals served, and item category patterns.
            </p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center gap-2 self-start sm:self-center">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <select
              value={filterMonths}
              onChange={(e) => setFilterMonths(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="6" className="bg-slate-950">Last 6 Months</option>
              <option value="3" className="bg-slate-950">Last 3 Months</option>
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Postings</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-emerald-450 text-emerald-450 text-emerald-400">{metrics.totalDonations}</span>
              <span className="text-xs text-slate-500 font-semibold">listings</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Overall listings posted by your account.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Meals Contributed</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-blue-450 text-blue-400">{metrics.mealsContributed.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-semibold">meals</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Total quantity of delivered drives multiplied.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Success Completion Rate</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-amber-400">{parseFloat(metrics.successRate).toFixed(1)}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Delivered listings vs total items claimed.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Currently Active</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-rose-400">{metrics.activeDonations}</span>
              <span className="text-xs text-slate-500 font-semibold">items</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Drives pending pickup or currently in transit.</p>
          </div>
        </div>

        {/* Charts */}
        {metrics.totalDonations === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-16 text-center text-slate-400 backdrop-blur-xl">
            <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-200">No Contributions Data Yet</h3>
            <p className="text-sm text-slate-500 mt-1.5">Submit food listings to populate your analytics charts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Monthly Trend (Bar chart) */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-450 text-emerald-400" /> Monthly Contributions
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend.slice(-parseInt(filterMonths, 10))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar name="Listings Posted" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-400" /> Category Breakdown
              </h2>
              
              {categoryDistribution.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-650 text-xs">
                  No listings categorizations.
                </div>
              ) : (
                <div className="space-y-4 my-auto">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto px-2">
                    {categoryDistribution.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-slate-400 capitalize truncate">{entry.name}:</span>
                        <strong className="text-slate-200">{entry.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DonorAnalytics;
