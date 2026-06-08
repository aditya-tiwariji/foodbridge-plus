import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { MapPin, Calendar, Compass, Edit2, ArrowRight } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

const DonationCard = ({ donation }) => {
  const { user } = useAuth();
  
  const {
    _id,
    foodName,
    category,
    quantity,
    status,
    expiryDate,
    location,
    images = [],
  } = donation;

  const isOwner = donation.donor === user?.id || donation.donor?._id === user?.id;
  const isPending = status === 'pending';

  // Format date nicely
  const formattedExpiry = new Date(expiryDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white group border border-slate-100 overflow-hidden rounded-xl">
      {/* Thumbnail Frame */}
      <div className="h-44 w-full bg-slate-100 overflow-hidden relative border-b border-slate-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt={foodName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 bg-slate-50">
            <Compass className="h-12 w-12 stroke-1" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          <Badge status={status}>{status.toUpperCase()}</Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 bg-black/60 text-white rounded backdrop-blur-sm uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>

      {/* Listing Content */}
      <div className="p-5 flex-grow flex flex-col gap-3">
        <div>
          <h4 className="text-md font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {foodName}
          </h4>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Quantity: {quantity}</p>
        </div>

        {/* Details Row */}
        <div className="flex flex-col gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Expires: <strong className="text-slate-700">{formattedExpiry}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{location?.address || donation?.address || 'No address'}</span>
          </div>
          {(donation?.pincode || donation?.location?.pincode) && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                PIN Code: {donation.pincode || donation.location.pincode}
              </span>
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <Link to={`/donations/${_id}`} className="flex-grow">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-1 text-xs py-2"
            >
              Details <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>

          {isOwner && isPending && (
            <Link to={`/donations/${_id}/edit`}>
              <Button
                variant="primary"
                size="sm"
                className="flex items-center justify-center p-2 text-xs py-2"
                aria-label="Edit donation"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DonationCard;
