
import { X, CreditCard } from 'lucide-react';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dummy transaction data
const dummyTransactions = [
  {
    id: '1',
    amount: 4000,
    date: '2025-06-01',
    description: 'Monthly Membership Fee',
    status: 'completed'
  },
  {
    id: '2',
    amount: 3500,
    date: '2025-05-01',
    description: 'Monthly Membership Fee',
    status: 'completed'
  },
  {
    id: '3',
    amount: 5000,
    date: '2025-04-01',
    description: 'Monthly Membership Fee + Seat Change',
    status: 'completed'
  },
  {
    id: '4',
    amount: 4000,
    date: '2025-03-01',
    description: 'Monthly Membership Fee',
    status: 'completed'
  }
];

export const TransactionsModal = ({ isOpen, onClose }: TransactionsModalProps) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="app-card w-full max-w-md border-0 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-xl font-semibold text-white">My Transactions</h2>
          <button
            onClick={onClose}
            className="text-[#CCCCCC] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {dummyTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-[#2A2A2E] rounded-xl p-4 border border-[#333]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFFF] to-[#00CED1] flex items-center justify-center">
                      <CreditCard size={18} className="text-black" />
                    </div>
                    <div>
                      <p className="text-white font-medium">₹{transaction.amount}</p>
                      <p className="text-[#CCCCCC] text-sm">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-[#CCCCCC] text-sm">{transaction.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-[#333]">
          <button
            onClick={onClose}
            className="cred-button-secondary w-full h-12"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
