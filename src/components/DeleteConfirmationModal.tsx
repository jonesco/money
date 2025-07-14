import { XMarkIcon } from '@heroicons/react/24/outline';
import ModalPortal from './ModalPortal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, symbol }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed z-50 bg-[#181A20] border-b border-gray-700 p-6 overflow-y-auto shadow-lg" style={{
        top: '64px',
        left: 0,
        right: 0,
        width: '100vw',
        maxWidth: '100vw',
        height: 'auto',
        maxHeight: 'calc(100vh - 64px)',
        position: 'fixed',
      }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Delete Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Are you sure you want to remove {symbol} from your watchlist? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-[#6b21a8] text-white rounded-lg hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </ModalPortal>
  );
} 