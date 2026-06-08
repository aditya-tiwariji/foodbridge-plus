import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUsers, suspendUser, activateUser } from '../../services/adminService.js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        search,
        role,
        status,
        page,
        limit: 10
      });
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [role, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsersList();
  };

  const handleToggleSuspension = async (userId, isActive) => {
    setActionLoading(userId);
    try {
      if (isActive) {
        await suspendUser(userId);
      } else {
        await activateUser(userId);
      }
      // Refresh user listing
      await fetchUsersList();
    } catch (err) {
      alert(err.message || 'Suspension toggle failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link and Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-400" /> User Accounts Moderation
            </h1>
            <p className="text-sm text-slate-400">
              Search profiles, modify login access, and suspend/reactivate platform users.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm text-slate-450">Total Profiles Registered:</span>
            <span className="text-lg font-bold text-emerald-400">{totalItems}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3 rounded-xl transition outline-none"
              />
            </div>

            {/* Role Filter Selector */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                <Filter className="w-4 h-4" />
              </span>
              <select
                value={role}
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition outline-none appearance-none"
              >
                <option value="">All Roles</option>
                <option value="donor">Donors</option>
                <option value="ngo">NGOs</option>
                <option value="recipient">Recipients</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            {/* Status Filter Selector */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 hover:bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition outline-none appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-950/20 transition duration-200"
            >
              Apply Filter Search
            </button>
          </form>
        </div>

        {/* User Table Grid Container */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="p-6 bg-red-900/10 border-b border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex gap-4 animate-pulse">
                  <div className="h-10 bg-slate-800 rounded-lg flex-1"></div>
                  <div className="h-10 bg-slate-800 rounded-lg w-32"></div>
                  <div className="h-10 bg-slate-800 rounded-lg w-20"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-slate-455 text-slate-400">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-bold">No Users Found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/65 text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4.5 font-bold">Full Name</th>
                    <th className="px-6 py-4.5 font-bold">Email Address</th>
                    <th className="px-6 py-4.5 font-bold">Phone Number</th>
                    <th className="px-6 py-4.5 font-bold">Platform Role</th>
                    <th className="px-6 py-4.5 font-bold">Access Status</th>
                    <th className="px-6 py-4.5 font-bold text-right">Moderator Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-900/30 transition text-sm">
                      <td className="px-6 py-4 font-bold text-slate-100">{item.name}</td>
                      <td className="px-6 py-4 text-slate-350 text-slate-300 font-mono text-xs">{item.email}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{item.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                          item.role === 'admin' 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                            : item.role === 'ngo' 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          item.isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {item.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.role === 'admin' ? (
                          <span className="text-xs text-slate-500 font-semibold italic">Protected Account</span>
                        ) : (
                          <button
                            onClick={() => handleToggleSuspension(item._id, item.isActive)}
                            disabled={actionLoading === item._id}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl transition ${
                              item.isActive
                                ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30'
                            }`}
                          >
                            {actionLoading === item._id ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : item.isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Suspend
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Activate
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-slate-950/65 px-6 py-4.5 flex items-center justify-between border-t border-slate-800">
              <p className="text-xs text-slate-450">
                Showing Page <span className="font-bold text-slate-300">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 p-2.5 rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-slate-900 border border-slate-800 text-slate-350 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 p-2.5 rounded-xl transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserManagement;
