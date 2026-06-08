import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Card from '../../components/ui/Card.jsx';
import Toast from '../../components/ui/Toast.jsx';
import DonationForm from '../../components/donations/DonationForm.jsx';
import { PlusCircle } from 'lucide-react';

const CreateDonation = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setToast(null);
    try {
      const response = await api.post('/donations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setToast({ message: 'Food donation listed successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/donations');
        }, 1500);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to list food donation. Try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="bg-slate-50">
      <Container className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6 mt-4">
          <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">List Surplus Food</h2>
            <p className="text-slate-500 text-sm mt-0.5">List fresh or cooked food to redirect to local NGOs</p>
          </div>
        </div>

        <Card className="shadow-lg border border-slate-100 p-8 bg-white">
          <DonationForm onSubmit={handleFormSubmit} isLoading={isLoading} />
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

export default CreateDonation;
