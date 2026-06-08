import React from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const AcceptDonationModal = ({ isOpen, onClose, onConfirm, donationName, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accept Food Donation" className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 stroke-[2]" />
        </div>
        
        <h4 className="text-base font-bold text-slate-800 mb-2">
          Claim "{donationName}"?
        </h4>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          By accepting this donation, you agree to coordinate and pick up the food from the donor. Please ensure you can fulfill this pickup before it expires.
        </p>

        <div className="w-full flex gap-3 mt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 font-semibold"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1 font-semibold flex items-center justify-center gap-1.5 shadow-md"
            loading={isLoading}
          >
            Accept Claim
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AcceptDonationModal;
