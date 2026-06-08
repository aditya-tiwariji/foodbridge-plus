import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, Mail, Phone, MapPin, Compass, Settings, Hash } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <PageWrapper className="bg-slate-50 py-10">
      <Container className="max-w-2xl">
        <Card className="shadow-xl border border-slate-100 p-8 bg-white transition-all duration-300 hover:shadow-2xl">
          {/* Header Profile Photo / Role */}
          <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
            <div className="relative group">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary-100 shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-extrabold text-4xl shadow-inner border-4 border-primary-100 transition-transform duration-300 group-hover:scale-105">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mt-4">{user.name}</h2>
            <Badge status={user.role} className="mt-2 text-sm uppercase px-3.5 py-1 font-semibold tracking-wider">
              {user.role}
            </Badge>
          </div>

          {/* Details list */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Personal Information
              </h3>
            </div>

            {/* Email Field (Read Only) */}
            <div className="flex items-start gap-4 p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.email}</p>
                <span className="text-xs text-slate-400 font-medium">Verified Account Email</span>
              </div>
            </div>

            {/* Phone Field */}
            <div className="flex items-start gap-4 p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Phone</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.phone}</p>
              </div>
            </div>

            {/* Address Field */}
            <div className="flex items-start gap-4 p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Physical Address</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {user.location?.address || 'No physical address listed'}
                </p>
              </div>
            </div>

            {/* Pincode Field */}
            <div className="flex items-start gap-4 p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                <Hash className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PIN Code</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.pincode}</p>
              </div>
            </div>

            {/* Coordinates Field */}
            <div className="flex items-start gap-4 p-3.5 hover:bg-slate-50/50 rounded-xl transition-colors">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-500">
                <Compass className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Geospatial Coordinates</p>
                <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">
                  {user.location?.coordinates
                    ? `[Lng: ${user.location.coordinates[0]}, Lat: ${user.location.coordinates[1]}]`
                    : 'Coordinates not resolved'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <Link to="/profile/edit">
              <Button variant="primary" className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                <Settings className="h-4 w-4" /> Edit Profile Details
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </PageWrapper>
  );
};

export default Profile;
