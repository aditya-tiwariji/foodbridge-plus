import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  Heart, 
  Award, 
  Download, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  ArrowLeft,
  ChevronRight,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { getAdminAnalytics, downloadCSVExport } from '../../services/analyticsService.js';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#374151', '#06b6d4'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('12'); // Months
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await getAdminAnalytics();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve platform analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await downloadCSVExport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'foodbridge-platform-monthly-report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(err.message || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium animate-pulse">Computing database aggregations and analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Analytics</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/admin/dashboard" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { metrics, trends, distributions, leaderboards } = data;

  return (
    <div className="min-h-screen bg-slate-955 bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Back to Panel
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
              <BarChart2 className="w-9 h-9 text-emerald-400" /> Platform Impact & Analytics
            </h1>
            <p className="text-slate-400 text-sm">
              Compute platform food volumes, distribution efficiency ratios, user registration growths, and top operational performers.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="12" className="bg-slate-950">Last 12 Months</option>
                <option value="6" className="bg-slate-950">Last 6 Months</option>
                <option value="3" className="bg-slate-950">Last 3 Months</option>
              </select>
            </div>
            
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-55 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-emerald-950/20 transition duration-200"
            >
              {exporting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Analytics (CSV)
            </button>
          </div>
        </div>

        {/* Impact Numbers Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-450 text-slate-400">Total Food Quantity Listed</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-emerald-400">{metrics.impact.totalFoodDonations.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-semibold">units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Combined weight/volumes of all food listing postings.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-450 text-slate-400">Completed Deliveries</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-blue-400">{metrics.impact.totalSuccessfulDeliveries.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-semibold">listings</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Surplus food listings successfully routed to NGO centers.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-450 text-slate-400">Delivery Success Rate</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-amber-450 text-amber-400">{parseFloat(metrics.impact.deliverySuccessRate).toFixed(1)}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Ratio of completed deliveries relative to claims.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-450 text-slate-400">Estimated Meals Served</p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-extrabold text-purple-400">{metrics.impact.estimatedMealsServed.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-semibold">meals</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Computed value: Successful Deliveries × config multiplier.</p>
          </div>
        </div>

        {/* User and Donation Base Counts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* User Registration Details */}
          <div className="bg-slate-900/60 border border-slate-800/85 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-4.5 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> User Registrations breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-400">Total Donors</span>
                <p className="text-2xl font-bold mt-1 text-slate-100">{metrics.users.donors}</p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-400">NGOs Awaiting</span>
                <p className="text-2xl font-bold mt-1 text-slate-105 text-slate-200">{metrics.users.ngos - metrics.users.verifiedNGOs}</p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-400">Verified NGOs</span>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{metrics.users.verifiedNGOs}</p>
              </div>
            </div>
          </div>

          {/* Donation Status breakdown */}
          <div className="bg-slate-900/60 border border-slate-800/85 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-4.5 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-400" /> Platform Listing statuses</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-2xs text-slate-400 uppercase tracking-wider">Pending</span>
                <p className="text-xl font-bold mt-0.5 text-amber-400">{metrics.donations.pending}</p>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-2xs text-slate-400 uppercase tracking-wider">Claimed</span>
                <p className="text-xl font-bold mt-0.5 text-sky-400">{metrics.donations.accepted}</p>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-2xs text-slate-400 uppercase tracking-wider">Transit</span>
                <p className="text-xl font-bold mt-0.5 text-violet-400">{metrics.donations.pickedUp}</p>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-2xs text-slate-400 uppercase tracking-wider">Expired</span>
                <p className="text-xl font-bold mt-0.5 text-red-400">{metrics.donations.expired}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Chart section 1: Monthly activities */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
              <TrendingUp className="w-5.5 h-5.5 text-emerald-400" /> Monthly Trends Overview
            </h2>
            <span className="text-xs text-slate-455 text-slate-400 italic">Timeline matches last {dateRange} months query datasets.</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={trends.donationsTrend.slice(-parseInt(dateRange, 10))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" name="Donations Posted" dataKey="count" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line 
                  type="monotone" 
                  name="Deliveries Completed" 
                  data={trends.deliveriesTrend.slice(-parseInt(dateRange, 10))} 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                />
                <Line 
                  type="monotone" 
                  name="User Registrations" 
                  data={trends.usersTrend.slice(-parseInt(dateRange, 10))} 
                  dataKey="count" 
                  stroke="#f59e0b" 
                  strokeWidth={3.5} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart section 2: Pie distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Category Distribution */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-400" /> Food Category Distributions
            </h2>

            {distributions.categoryDistribution.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
                No category data recorded.
              </div>
            ) : (
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="h-full w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributions.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributions.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {distributions.categoryDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-350 capitalize font-medium">{entry.name}:</span>
                      <strong className="text-slate-100">{entry.value} listings</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-amber-500" /> Donation Status breakdown
            </h2>

            {distributions.statusDistribution.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
                No status data recorded.
              </div>
            ) : (
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="h-full w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributions.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distributions.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {distributions.statusDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}></span>
                      <span className="text-slate-350 capitalize font-medium">{entry.name}:</span>
                      <strong className="text-slate-100">{entry.value} listings</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Donors */}
          <div className="bg-slate-900/60 border border-slate-800/85 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            <div className="p-6 border-b border-slate-800/60">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 animate-pulse" /> Top 10 Donors Leaderboard
              </h2>
            </div>
            
            {leaderboards.topDonors.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No donor activity records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-455 text-slate-400 text-xs font-bold border-b border-slate-800 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Rank</th>
                      <th className="px-6 py-3.5">Donor Name</th>
                      <th className="px-6 py-3.5">Created</th>
                      <th className="px-6 py-3.5">Delivered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                    {leaderboards.topDonors.map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-950/20 transition">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-500 truncate font-mono">{item.email}</p>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-100">{item.donationsCreated}</td>
                        <td className="px-6 py-3.5 text-emerald-400 font-bold">{item.successfulDeliveries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top NGOs */}
          <div className="bg-slate-900/60 border border-slate-800/85 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
            <div className="p-6 border-b border-slate-800/60">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400 animate-pulse" /> Top 10 NGOs Leaderboard
              </h2>
            </div>
            
            {leaderboards.topNGOs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No NGO activity records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-455 text-slate-400 text-xs font-bold border-b border-slate-800 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Rank</th>
                      <th className="px-6 py-3.5">NGO Name</th>
                      <th className="px-6 py-3.5">Claimed</th>
                      <th className="px-6 py-3.5">Delivered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                    {leaderboards.topNGOs.map((item, idx) => (
                      <tr key={item._id} className="hover:bg-slate-950/20 transition">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-500 truncate font-mono">{item.email}</p>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-100">{item.donationsClaimed}</td>
                        <td className="px-6 py-3.5 text-emerald-400 font-bold">{item.deliveriesCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
