import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import DistanceBadge from './DistanceBadge.jsx';
import TimeRemainingBadge from './TimeRemainingBadge.jsx';
import { ArrowRight, Box } from 'lucide-react';

const NearbyDonationCard = ({ donation, onAcceptClick }) => {
  const { user } = useAuth();
  const {
    _id,
    foodName,
    quantity,
    category,
    images = [],
    distance,
    expiryDate,
    location = {},
    status
  } = donation;

  const mainImage = images[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60';
  const displayAddress = location.address || 'Address hidden until accepted';

  const ngoCoords = user?.location?.coordinates;
  const donorCoords = location?.coordinates;

  const isCoordsValid = (coords) => {
    if (!coords || coords.length !== 2) return false;
    const [lng, lat] = coords;
    if (lng === 0 && lat === 0) return false;
    return true;
  };

  const isDistanceAvailable = isCoordsValid(ngoCoords) && isCoordsValid(donorCoords);
  const displayDistance = isDistanceAvailable ? distance : null;

  return (
    <Card className="flex flex-col bg-white border border-slate-100 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden h-full group">
      {/* Listing Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={mainImage}
          alt={foodName}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-slate-900/75 text-white backdrop-blur-sm uppercase tracking-wide">
            {category}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 items-end">
          <DistanceBadge distance={displayDistance} />
          <TimeRemainingBadge expiryDate={expiryDate} />
        </div>
      </div>

      {/* Listing Description Body */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {foodName}
          </h4>
          
          <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
            <Box className="h-4 w-4 text-slate-400" />
            <span>Quantity: <strong className="text-slate-700 font-semibold">{quantity}</strong></span>
          </div>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
            Location: {displayAddress}
          </p>
          {(donation.pincode || donation.location?.pincode) && (
            <p className="text-xs text-slate-400 mt-1">
              PIN Code: <strong className="text-slate-700 font-semibold">{donation.pincode || donation.location.pincode}</strong>
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
          <Link to={`/ngo/donations/${_id}`} className="flex-grow">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-1 text-slate-600 hover:text-slate-800"
            >
              Details <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          
          <Button
            variant="primary"
            size="sm"
            className="flex-grow"
            disabled={status !== 'pending'}
            onClick={() => onAcceptClick(donation)}
          >
            {status === 'pending' ? 'Accept Claim' : 'Claimed'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NearbyDonationCard;
