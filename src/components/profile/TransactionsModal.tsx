
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Calendar } from 'lucide-react';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dummyTransactions = [
  {
    id: 1,
    amount: 4000,
    date: '2025-06-01',
    description: 'Monthly Library Fee',
    status: 'Success'
  },
  {
    id: 2,
    amount: 3500,
    date: '2025-05-01',
    description: 'Monthly Library Fee',
    status: 'Success'
  },
  {
    id: 3,
    amount: 5000,
    date: '2025-04-01',
    description: 'Quarterly Library Fee',
    status: 'Success'
  }
];

export const TransactionsModal = ({ isOpen, onClose }: TransactionsModalProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-[#E0E0E0] shadow-xl rounded-xl max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#333333] text-xl font-semibold">My Transactions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {dummyTransactions.map((transaction) => (
            <Card key={transaction.id} className="app-card border border-[#E0E0E0]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00B9F1] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[#333333] font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-[#666666] text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#333333] font-semibold text-lg">₹{transaction.amount}</p>
                    <span className="bg-[#34C759] text-white text-xs px-2 py-1 rounded-full">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {dummyTransactions.length === 0 && (
            <div className="text-center py-8 text-[#666666]">
              No transactions found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
