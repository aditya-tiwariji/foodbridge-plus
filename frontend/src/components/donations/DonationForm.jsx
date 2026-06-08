import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Upload, X, AlertCircle } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';
import Button from '../ui/Button.jsx';
import MapPicker from '../maps/MapPicker.jsx';

const DonationForm = ({ initialValues, onSubmit, isLoading }) => {
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [retainedImages, setRetainedImages] = useState(initialValues?.images || []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      foodName: initialValues?.foodName || '',
      category: initialValues?.category || 'veg',
      quantity: initialValues?.quantity || '',
      description: initialValues?.description || '',
      expiryDate: initialValues?.expiryDate
        ? new Date(initialValues.expiryDate).toISOString().substring(0, 16)
        : '',
      pickupTime: initialValues?.pickupTime || '',
      phone: initialValues?.phone || '',
      location: initialValues?.location || { address: '', coordinates: [0, 0] },
    },
  });

  // Clean up file object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Enforce max 5 images limit (combining retained and new files)
    if (retainedImages.length + selectedFiles.length + files.length > 5) {
      alert('You can upload a maximum of 5 images per donation.');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Create object URLs for dynamic preview
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeNewFile = (idx) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(idx, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[idx]);
    newPreviews.splice(idx, 1);
    setImagePreviews(newPreviews);
  };

  const removeRetainedImage = (idx) => {
    const newRetained = [...retainedImages];
    newRetained.splice(idx, 1);
    setRetainedImages(newRetained);
  };

  const onFormSubmit = (data) => {
    // Compile multipart form data
    const formData = new FormData();
    formData.append('foodName', data.foodName);
    formData.append('category', data.category);
    formData.append('quantity', data.quantity);
    formData.append('description', data.description);
    formData.append('expiryDate', new Date(data.expiryDate).toISOString());
    formData.append('pickupTime', data.pickupTime);
    formData.append('phone', data.phone);
    formData.append('location', JSON.stringify(data.location));

    // Append new files
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    // Pass retained images JSON string so backend knows what to keep
    formData.append('images', JSON.stringify(retainedImages));

    onSubmit(formData);
  };

  const categoryOptions = [
    { value: 'veg', label: 'Vegetarian' },
    { value: 'non-veg', label: 'Non-Vegetarian' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'bakery', label: 'Bakery Products' },
    { value: 'cooked meals', label: 'Cooked Meals' },
    { value: 'groceries', label: 'Raw Groceries / Materials' },
    { value: 'other', label: 'Other Items' },
  ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6">
      {/* Grid details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Food Item Name"
          type="text"
          placeholder="e.g. Fresh Garden Salad"
          error={errors.foodName?.message}
          {...register('foodName', { required: 'Food name is required' })}
        />

        <Select
          label="Category"
          options={categoryOptions}
          error={errors.category?.message}
          {...register('category', { required: 'Category is required' })}
        />

        <Input
          label="Quantity / Volume"
          type="text"
          placeholder="e.g. 10 kg, 3 large boxes"
          error={errors.quantity?.message}
          {...register('quantity', { required: 'Quantity description is required' })}
        />

        <Input
          label="Expiry Date & Time"
          type="datetime-local"
          error={errors.expiryDate?.message}
          {...register('expiryDate', {
            required: 'Expiry date is required',
            validate: (value) => {
              const selectedDate = new Date(value);
              return selectedDate > new Date() || 'Expiry date must be in the future';
            },
          })}
        />
      </div>

      <Textarea
        label="Description & Allergen Details"
        placeholder="Provide preparation timestamps, storage details, and any allergen listings."
        error={errors.description?.message}
        {...register('description', { required: 'Description is required' })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Pickup Time Details"
          type="text"
          placeholder="e.g. Today between 5 PM and 8 PM"
          error={errors.pickupTime?.message}
          {...register('pickupTime', { required: 'Pickup details are required' })}
        />

        <Input
          label="Contact Phone Number"
          type="tel"
          placeholder="e.g. +19998887777"
          error={errors.phone?.message}
          {...register('phone', { required: 'Phone number is required' })}
        />
      </div>

      {/* Geospatial Address and Map coordinates picker */}
      <Controller
        name="location"
        control={control}
        rules={{
          validate: (value) => {
            if (!value.address || value.coordinates[0] === 0) {
              return 'Please search and select a valid address location coordinates';
            }
            return true;
          },
        }}
        render={({ field: { value, onChange } }) => (
          <div className="flex flex-col gap-1.5">
            <MapPicker value={value} onChange={onChange} />
            {errors.location?.message && (
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.location.message}
              </span>
            )}
          </div>
        )}
      />

      {/* Image Upload Area */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-700">Donation Images (Max 5)</label>
        
        {/* Upload Box */}
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
              <Upload className="h-8 w-8 mb-2 stroke-1" />
              <p className="text-xs font-semibold">Click to upload JPG, PNG, or WEBP (Max 5MB)</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Thumbnail Preview Area */}
        {(retainedImages.length > 0 || imagePreviews.length > 0) && (
          <div className="flex flex-wrap gap-3 mt-2">
            {/* Display Retained/Existing Images (when editing) */}
            {retainedImages.map((img, idx) => (
              <div key={`retained-${idx}`} className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 relative group">
                <img src={img} alt="Retained preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeRetainedImage(idx)}
                  className="absolute inset-0 bg-black/40 items-center justify-center text-white hidden group-hover:flex transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}

            {/* Display New Previews */}
            {imagePreviews.map((url, idx) => (
              <div key={`new-${idx}`} className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 relative group">
                <img src={url} alt="New preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(idx)}
                  className="absolute inset-0 bg-black/40 items-center justify-center text-white hidden group-hover:flex transition-opacity"
                  aria-label="Remove uploaded image"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full mt-4"
        isLoading={isLoading}
      >
        Save Listing
      </Button>
    </form>
  );
};

export default DonationForm;
