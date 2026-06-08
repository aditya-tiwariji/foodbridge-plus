import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone,
  Mail,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getNGORequests, verifyNGO } from '../../services/adminService.js';

const NGOManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  const fetchNGORequestsList = async () => {
    setLoading(true);
    try {
      const data = await getNGORequests({
        status,
        page,
        limit: 10
      });
      if (data.success) {
        setRequests(data.requests);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve NGO requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGORequestsList();
  }, [status, page]);

  const handleVerify = async (ngoId, action) => {
    setActionLoading(`${ngoId}-${action}`);
    try {
      await verifyNGO(ngoId, action);
      // Refresh listing
      await fetchNGORequestsList();
    } catch (err) {
      alert(err.message || 'Verification update failed.');
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
              <ShieldAlert className="w-8 h-8 text-amber-500" /> NGO Verification Queue
            </h1>
            <p className="text-sm text-slate-400">
              Verify legal credentials, addresses, and activate NGO roles for surplus food acquisition.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setStatus('pending'); setPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-xl border transition ${
                status === 'pending'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pending Reviews
            </button>
            <button
              onClick={() => { setStatus('approved'); setPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-xl border transition ${
                status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Approved NGOs
            </button>
            <button
              onClick={() => { setStatus('rejected'); setPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-xl border transition ${
                status === 'rejected'
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Rejected Profiles
            </button>
          </div>
        </div>

        {/* Requests Feed Grid */}
        {error && (
          <div className="p-5 bg-red-900/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-52 animate-pulse"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-16 text-center text-slate-400 backdrop-blur-xl">
            <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4 animate-spin-slow" />
            <h3 className="text-xl font-bold text-slate-200">Queue is Clear</h3>
            <p className="text-sm text-slate-550 mt-1.5">No NGO profiles match status '{status}' at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((item) => (
              <div key={item._id} className="bg-slate-900/60 border border-slate-800/85 hover:border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-6 hover:shadow-2xl transition duration-200">
                <div className="space-y-4">
                  
                  {/* Name and Status Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{item.name}</h2>
                      <span className="text-xs text-slate-500 font-mono">ID: {item._id}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                      item.ngoVerificationStatus === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : item.ngoVerificationStatus === 'rejected'
                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                        : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    }`}>
                      {item.ngoVerificationStatus === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                      {item.ngoVerificationStatus === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {item.ngoVerificationStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      {item.ngoVerificationStatus}
                    </span>
                  </div>

                  {/* NGO Credentials Body */}
                  <div className="space-y-2.5 text-sm text-slate-350">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-emerald-500/80" />
                      <span className="text-xs font-mono">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-500/80" />
                      <span>{item.phone}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4.5 h-4.5 text-emerald-500/80 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.location?.address}</span>
                    </div>
                  </div>
                </div>

                {/* Operations Actions Footer */}
                {item.ngoVerificationStatus === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-800/60">
                    <button
                      onClick={() => handleVerify(item._id, 'approve')}
                      disabled={actionLoading === `${item._id}-approve` || actionLoading === `${item._id}-reject`}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-950/20 transition flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === `${item._id}-approve` ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Approve NGO
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleVerify(item._id, 'reject')}
                      disabled={actionLoading === `${item._id}-approve` || actionLoading === `${item._id}-reject`}
                      className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold px-5 py-3 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === `${item._id}-reject` ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" /> Reject
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
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

export default NGOManagement;
