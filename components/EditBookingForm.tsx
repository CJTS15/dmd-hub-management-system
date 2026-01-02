"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns"; // Import format

type Booking = {
  id: string;
  customer_name: string;
  seat_number: string;
  package_type: string;
  amount_paid: number;
  status: string;
  notes: string;
  check_in_time: string; // Added
  check_out_time: string; // Added
};

export default function EditBookingForm({
  booking,
  onSuccess,
}: {
  booking: Booking;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // Helper to format DB date (ISO) to Input date (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
  };

  const [formData, setFormData] = useState({
    customer_name: booking.customer_name,
    seat_number: booking.seat_number || "",
    package_type: booking.package_type,
    amount_paid: booking.amount_paid,
    status: booking.status,
    notes: booking.notes || "",
    // Initialize times
    check_in_time: formatDateForInput(booking.check_in_time),
    check_out_time: formatDateForInput(booking.check_out_time),
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("dmd_bookings")
      .update({
        customer_name: formData.customer_name,
        seat_number: formData.seat_number,
        package_type: formData.package_type,
        amount_paid: formData.amount_paid,
        status: formData.status,
        notes: formData.notes,
        // Convert back to ISO string for Supabase
        check_in_time: new Date(formData.check_in_time).toISOString(),
        check_out_time: formData.check_out_time 
          ? new Date(formData.check_out_time).toISOString() 
          : null,
      })
      .eq("id", booking.id);

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      alert("Error updating booking");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer Name</Label>
          <Input
            value={formData.customer_name}
            onChange={(e) =>
              setFormData({ ...formData, customer_name: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Seat Number</Label>
          <Input
            value={formData.seat_number}
            onChange={(e) =>
              setFormData({ ...formData, seat_number: e.target.value })
            }
          />
        </div>
      </div>

      {/* NEW: Date/Time Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in Time</Label>
          <Input
            type="datetime-local"
            required
            value={formData.check_in_time}
            onChange={(e) =>
              setFormData({ ...formData, check_in_time: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Check-out Time</Label>
          <Input
            type="datetime-local"
            value={formData.check_out_time}
            onChange={(e) =>
              setFormData({ ...formData, check_out_time: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Package Type</Label>
          <Select
            value={formData.package_type}
            onValueChange={(val) =>
              setFormData({ ...formData, package_type: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hourly Rate">Hourly Rate</SelectItem>
              <SelectItem value="Focus Saver">Focus Saver</SelectItem>
              <SelectItem value="Power Saver">Power Saver</SelectItem>
              <SelectItem value="DMD Squad Saver">DMD Squad Saver</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount Paid (₱)</Label>
          <Input
            type="number"
            value={formData.amount_paid}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount_paid: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(val) => setFormData({ ...formData, status: val })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes / Rentals</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <DialogFooter>
        <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}