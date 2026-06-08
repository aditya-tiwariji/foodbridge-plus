import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor is required'],
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [100, 'Food name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Food category is required'],
      enum: {
        values: ['veg', 'non-veg', 'dairy', 'bakery', 'cooked meals', 'groceries', 'other'],
        message: '{VALUE} is not a valid food category',
      },
    },
    quantity: {
      type: String,
      required: [true, 'Quantity description is required (e.g. 5 kg, 20 packets)'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date and time are required'],
      validate: {
        validator: function (value) {
          // Expiry must be in the future for new donations
          return this.isNew ? value > new Date() : true;
        },
        message: 'Expiry date must be in the future',
      },
    },
    pickupTime: {
      type: String,
      required: [true, 'Pickup time details are required (e.g., Today before 8 PM)'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    address: {
      type: String,
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
      },
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'claimed', 'on the way', 'picked up', 'delivered', 'completed', 'expired', 'deleted'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'accepted', 'claimed', 'on the way', 'picked up', 'delivered', 'completed', 'expired', 'deleted'],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    liveTracking: {
      isActive: {
        type: Boolean,
        default: false,
      },
      ngoLatitude: {
        type: Number,
        default: null,
      },
      ngoLongitude: {
        type: Number,
        default: null,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        trim: true,
        default: '',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized searching and spatial queries
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ donor: 1 });
donationSchema.index({ acceptedBy: 1 });
donationSchema.index({ category: 1 });
donationSchema.index({ expiryDate: 1 });

// Pre-save hook to manage status transition history tracking
donationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // If the status history does not contain the current status yet
    const exists = this.statusHistory.some((history) => history.status === this.status);
    if (!exists) {
      this.statusHistory.push({
        status: this.status,
        changedAt: new Date(),
        // Note: changedBy will be populated manually in the controller route logic
      });
    }
  }
  next();
});

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
