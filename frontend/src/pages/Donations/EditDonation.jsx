import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import DonationForm from '../../components/donations/DonationForm.jsx';
import { Edit2, ChevronLeft } from 'lucide-react';

const EditDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const response = await api.get(`/donations/${id}`);
        if (response.data.success) {
          const d = response.data.donation;
          
          // Verify Ownership
          const isOwner = d.donor === user?.id || d.donor?._id === user?.id;
          if (!isOwner) {
            alert('Not authorized. Only the owner can edit this donation listing.');
            navigate('/donations');
            return;
          }

          // Verify Status is Pending
          if (d.status !== 'pending') {
            alert(`Cannot edit donation. Current status is already '${d.status}'.`);
            navigate(`/donations/${id}`);
            return;
          }

          setDonation(d);
        }
      } catch (error) {
        setToast({ message: error.message || 'Failed to load donation listing', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id, navigate, user]);

  const handleFormSubmit = async (formData) => {
    setIsUpdating(true);
    setToast(null);
    try {
      const response = await api.put(`/donations/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setToast({ message: 'Donation listing updated successfully!', type: 'success' });
        setTimeout(() => {
          navigate(`/donations/${id}`);
        }, 1500);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to update donation listing. Try again.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="bg-slate-50 flex items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary-500" />
      </PageWrapper>
    );
  }

  if (!donation) return null;

  return (
    <PageWrapper className="bg-slate-50">
      <Container className="max-w-3xl">
        {/* Back Link */}
        <div className="mb-4 mt-2">
          <Link to={`/donations/${id}`} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold transition-colors text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Details
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
            <Edit2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Edit Donation</h2>
            <p className="text-slate-500 text-sm mt-0.5">Modify details of your listed surplus food item</p>
          </div>
        </div>

        <Card className="shadow-lg border border-slate-100 p-8 bg-white">
          <DonationForm
            initialValues={donation}
            onSubmit={handleFormSubmit}
            isLoading={isUpdating}
          />
        </Card>
      </Container>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </PageWrapper>
  );
};

export default EditDonation;
