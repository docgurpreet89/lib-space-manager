import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PendingBookings = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [form, setForm] = useState({
    amount: "",
    receipt: null,
    remarks: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadPending();
    loadSeatMap();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seat_bookings")
      .select("*")
      .eq("status", "pending");
    setPending(data || []);
    setLoading(false);
  };

  const loadSeatMap = async () => {
    const { data, error } = await supabase.from("seats").select("seat_id, seat_label");
    if (!error && data) {
      const map = data.reduce((acc, seat) => {
        acc[seat.seat_id] = seat.seat_label;
        return acc;
      }, {});
      setSeatMap(map);
    }
  };

  const openApproveModal = (booking: any) => {
    setEditBooking(booking);
    setForm({
      amount: booking.price || "",
      receipt: null,
      remarks: "",
    });
    setModalType("approve");
  };

  const openRejectModal = (booking: any) => {
    setEditBooking(booking);
    setRejectReason("");
    setModalType("reject");
  };

  const handleApprove = async () => {
    setModalLoading(true);
    let receiptUrl = editBooking.receipt_url || null;
    if (form.receipt) {
      const file = form.receipt;
      const fileExt = file.name.split(".").pop();
      const filePath = `receipts/${editBooking.id}-${Date.now()}.${fileExt}`;
      let { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(filePath);
        receiptUrl = publicUrlData.publicUrl;
      }
    }

    await supabase.from("seat_bookings").update({
      price: form.amount,
      receipt_url: receiptUrl,
      status: "approved",
    }).eq("id", editBooking.id);

    await supabase.from("approved_transactions").insert({
      booking_id: editBooking.id,
      user_id: editBooking.user_id,
      name: editBooking.user_name,
      user_email: editBooking.user_email,
      user_phone: editBooking.user_phone,
      amount: form.amount,
      receipt_url: receiptUrl,
      remarks: form.remarks,
      approved_at: new Date().toISOString(),
    });

    setModalLoading(false);
    closeModal();
    await loadPending();
  };

  const handleReject = async () => {
    setModalLoading(true);
    await supabase
      .from("seat_bookings")
      .update({
        status: "rejected",
        rejection_reason: rejectReason,
      })
      .eq("id", editBooking.id);
    setModalLoading(false);
    closeModal();
    await loadPending();
  };

  const closeModal = () => {
    setModalType(null);
    setEditBooking(null);
    setForm({
      amount: "",
      receipt: null,
      remarks: "",
    });
    setRejectReason("");
    setModalLoading(false);
  };

  const filtered = pending.filter(p =>
    p.user_name.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pending Bookings</h1>
        <Input
          className="w-64"
          placeholder="Search by user name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Card className="border border-gray-300 rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Seat</th>
                <th className="text-left py-2 px-3">Created At</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    No pending bookings.
                  </td>
                </tr>
              ) : (
                paginated.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
                  >
                    <td className="py-2 px-3">{booking.user_name}</td>
                    <td className="py-2 px-3">₹{booking.price}</td>
                    <td className="py-2 px-3">{seatMap[booking.seat_id] || booking.seat_id}</td>
                    <td className="py-2 px-3">{new Date(booking.created_at).toLocaleString()}</td>
                    <td className="py-2 px-3 space-x-2">
                      <Button size="sm" onClick={() => openApproveModal(booking)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => openRejectModal(booking)}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex justify-between items-center px-4 py-3">
            <Button
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <div className="text-gray-600 text-sm">Page {currentPage}</div>
            <Button
              size="sm"
              disabled={currentPage * itemsPerPage >= filtered.length}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {modalType && editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {modalType === "approve" ? "Approve Booking" : "Reject Booking"}
            </h2>

            {modalType === "approve" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">User Email</label>
                  <div className="p-2 bg-gray-100 rounded text-sm">{editBooking.user_email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone Number</label>
                  <div className="p-2 bg-gray-100 rounded text-sm">{editBooking.user_phone}</div>
                </div>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
                <Input
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setForm({ ...form, receipt: e.target.files[0] })}
                />
                <div className="flex justify-end gap-2">
                  <Button onClick={handleApprove} disabled={modalLoading}>
                    {modalLoading ? "Approving..." : "Approve & Save"}
                  </Button>
                  <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={handleReject}
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingBookings;
