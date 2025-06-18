
import jsPDF from 'jspdf';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface InvoiceData extends Transaction {
  user_name?: string;
  seat_label?: string;
}

export const generateInvoicePDF = (transaction: InvoiceData, userProfile: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('LIBRARY SEAT BOOKING INVOICE', 20, 30);
  
  // Invoice details
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice ID: ${transaction.transaction_id}`, 20, 50);
  doc.text(`Date: ${new Date(transaction.created_at).toLocaleDateString('en-IN')}`, 20, 60);
  doc.text(`Status: ${transaction.status.toUpperCase()}`, 20, 70);
  
  // Customer details
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 20, 90);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${userProfile?.full_name || 'N/A'}`, 20, 100);
  doc.text(`Email: ${userProfile?.email || 'N/A'}`, 20, 110);
  doc.text(`Phone: ${userProfile?.phone || 'N/A'}`, 20, 120);
  
  // Transaction details
  doc.setFont(undefined, 'bold');
  doc.text('Transaction Details:', 20, 140);
  doc.setFont(undefined, 'normal');
  doc.text(`Description: ${transaction.description || 'Seat booking payment'}`, 20, 150);
  doc.text(`Amount: ₹${transaction.amount.toFixed(2)}`, 20, 160);
  
  if (transaction.seat_label) {
    doc.text(`Seat: ${transaction.seat_label}`, 20, 170);
  }
  
  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for using our library services!', 20, 200);
  doc.text('This is a computer generated invoice.', 20, 210);
  
  // Download the PDF
  doc.save(`invoice_${transaction.transaction_id}.pdf`);
};
