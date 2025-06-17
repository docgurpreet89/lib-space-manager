
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dummyTransactions = [
  {
    id: 1,
    amount: 4000,
    date: '01-June-2025',
    status: 'Completed',
    type: 'Monthly Payment'
  },
  {
    id: 2,
    amount: 3500,
    date: '01-May-2025',
    status: 'Completed',
    type: 'Monthly Payment'
  },
  {
    id: 3,
    amount: 5000,
    date: '01-April-2025',
    status: 'Completed',
    type: 'Security Deposit'
  }
];

export const TransactionsModal = ({ isOpen, onClose }: TransactionsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">My Transactions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
          {dummyTransactions.map((transaction) => (
            <Card key={transaction.id} className="glass-card border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-white font-semibold">₹{transaction.amount.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{transaction.type}</p>
                    <p className="text-gray-500 text-xs">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
