import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu, X, LogOut, User, HeartHandshake } from 'lucide-react';
import Container from '../common/Container.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import NotificationCenter from './NotificationCenter.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <Container>
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                FoodBridge
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'donor' && (
                  <>
                    <Link to="/donations" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      My Donations
                    </Link>
                    <Link to="/donations/create" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Donate Food
                    </Link>
                    <Link to="/donor/analytics" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Analytics
                    </Link>
                  </>
                )}
                {user?.role === 'ngo' && (
                  <>
                    <Link to="/ngo/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/ngo/nearby" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Browse Nearby
                    </Link>
                    <Link to="/ngo/pickups" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Logistics
                    </Link>
                    <Link to="/ngo/analytics" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Analytics
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Admin Panel
                    </Link>
                    <Link to="/admin/analytics" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                      Analytics
                    </Link>
                  </>
                )}
                {user?.role !== 'donor' && user?.role !== 'ngo' && user?.role !== 'admin' && (
                  <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                <NotificationCenter />
                <div className="h-6 w-px bg-slate-200" />
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 focus:outline-none hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                    aria-label="User profile dropdown"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 hidden lg:inline-block">
                      {user.name}
                    </span>
                  </button>

                  {showDropdown && (
                    <>
                      {/* Backdrop to close dropdown on click outside */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-150 rounded-xl shadow-xl z-40 py-2 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-100">
                        <div className="px-4 py-2.5">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate mb-1.5">{user.email}</p>
                          <Badge status={user.role} className="capitalize">
                            {user.role}
                          </Badge>
                        </div>
                        <div className="py-1">
                            {user?.role === 'donor' ? (
                             <>
                               <Link
                                 to="/donations"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 My Donations
                               </Link>
                               <Link
                                 to="/donor/analytics"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 My Analytics
                               </Link>
                             </>
                           ) : user?.role === 'ngo' ? (
                             <>
                               <Link
                                 to="/ngo/dashboard"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 Dashboard
                               </Link>
                               <Link
                                 to="/ngo/analytics"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 My Analytics
                               </Link>
                             </>
                           ) : user?.role === 'admin' ? (
                             <>
                               <Link
                                 to="/admin/dashboard"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 Admin Panel
                               </Link>
                               <Link
                                 to="/admin/analytics"
                                 onClick={() => setShowDropdown(false)}
                                 className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                               >
                                 Impact Analytics
                               </Link>
                             </>
                           ) : (
                             <Link
                               to="/dashboard"
                               onClick={() => setShowDropdown(false)}
                               className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                             >
                               Dashboard
                             </Link>
                           )}
                          <Link
                            to="/notifications"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Notifications Log
                          </Link>
                          {user?.role === 'ngo' && (
                            <Link
                              to="/ngo/accepted"
                              onClick={() => setShowDropdown(false)}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              My Claims
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/profile/edit"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Settings
                          </Link>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              handleLogout();
                            }}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggler */}
          <div className="flex items-center gap-3.5 md:hidden">
            {isAuthenticated && <NotificationCenter />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4 shadow-inner">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
          >
            Home
          </Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'donor' ? (
                <>
                  <Link
                    to="/donations"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    My Donations
                  </Link>
                  <Link
                    to="/donor/analytics"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    My Analytics
                  </Link>
                </>
              ) : user?.role === 'ngo' ? (
                <>
                  <Link
                    to="/ngo/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/ngo/analytics"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    My Analytics
                  </Link>
                </>
              ) : user?.role === 'admin' ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Admin Panel
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Impact Analytics
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
              >
                Notifications Log
              </Link>
              {user?.role === 'donor' && (
                <Link
                  to="/donations/create"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                >
                  Donate Food
                </Link>
              )}
              {user?.role === 'ngo' && (
                <>
                  <Link
                    to="/ngo/nearby"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Browse Nearby
                  </Link>
                  <Link
                    to="/ngo/accepted"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    My Claims
                  </Link>
                  <Link
                    to="/ngo/pickups"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Logistics
                  </Link>
                </>
              )}
              <div className="h-px bg-slate-100" />
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
              >
                Profile
              </Link>
              <Link
                to="/profile/edit"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 hover:text-primary-600 font-semibold transition-colors"
              >
                Edit Profile
              </Link>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800">{user.name}</span>
                  <div className="text-xs text-slate-500">{user.role.toUpperCase()}</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
