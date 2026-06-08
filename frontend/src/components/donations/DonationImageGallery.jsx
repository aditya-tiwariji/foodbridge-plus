import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const DonationImageGallery = ({ images = [] }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-64 md:h-80 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
        <ImageIcon className="h-12 w-12 mb-2 stroke-1" />
        <span className="text-sm font-semibold">No images uploaded for this listing</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Active Main Image */}
      <div className="h-64 md:h-80 w-full rounded-xl overflow-hidden border border-slate-150 bg-slate-900 flex items-center justify-center shadow-inner relative group">
        <img
          src={images[activeImageIndex]}
          alt={`Donation view ${activeImageIndex + 1}`}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-widest">
          Image {activeImageIndex + 1} of {images.length}
        </span>
      </div>

      {/* Thumbnail Rows */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-500/20 scale-95' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationImageGallery;
