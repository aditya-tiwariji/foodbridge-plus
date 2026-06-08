import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

const Home = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage message="Restoring session..." />;
  }

  if (isAuthenticated) {
    if (user?.role === 'ngo' || user?.role === 'recipient') {
      return <Navigate to="/ngo/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <PageWrapper className="pt-4 bg-slate-50">
      {/* Hero Section */}
      <Container className="relative py-20 lg:py-32 flex flex-col items-center text-center overflow-hidden">
        {/* Background Gradients for Aesthetics */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-96 bg-gradient-to-r from-emerald-100/30 via-emerald-200/20 to-teal-100/30 blur-3xl rounded-full" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="h-4 w-4" /> Bridging Surplus Food to Local Needs
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight max-w-4xl tracking-tight">
          Don't Let Good Food Go To Waste,{' '}
          <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Share the Surplus
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-medium leading-relaxed">
          FoodBridge+ connects local food businesses, supermarkets, and hospitality partners directly with NGOs and community shelters to feed those in need in real-time.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button variant="primary" size="lg">Join as Donor / NGO</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
      </Container>

      {/* Feature Sections */}
      <Container className="py-20 border-t border-slate-100">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          How FoodBridge+ Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col items-center text-center p-8 bg-white hover:translate-y-[-4px] transition-transform duration-200">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-6">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. List Surplus</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Donors list active surplus cooked meals, bakery products, groceries, or dairy items, detailing expiry and collection times.
            </p>
          </Card>

          <Card className="flex flex-col items-center text-center p-8 bg-white hover:translate-y-[-4px] transition-transform duration-200">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 mb-6">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. Proximity Matching</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Recipients filter live donation listings by proximity and instantly claim nearby active listings using real-time geolocation.
            </p>
          </Card>

          <Card className="flex flex-col items-center text-center p-8 bg-white hover:translate-y-[-4px] transition-transform duration-200">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 mb-6">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">3. Safe Delivery</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              NGOs pick up donations directly and mark updates on transit, culminating in successful local community delivery.
            </p>
          </Card>
        </div>
      </Container>
    </PageWrapper>
  );
};

export default Home;
