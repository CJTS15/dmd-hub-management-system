"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { addHours, format, parse } from "date-fns";

type ExclusiveBooking = {
  id: string;
  client_name: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  pax: number;
  amount_paid: number;
  notes: string;
  guest_list: string;
};

// Add 'booking' prop for editing
export default function ExclusiveBookingForm({ 
  booking, 
  onSuccess 
}: { 
  booking?: ExclusiveBooking; 
  onSuccess: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  
  // Initialize State (Default vs Edit Data)
  const [formData, setFormData] = useState({
    client_name: booking?.client_name || "",
    booking_date: booking?.booking_date || format(new Date(), "yyyy-MM-dd"),
    // Slice(0,5) converts "09:00:00" to "09:00" for input[type="time"]
    start_time: booking?.start_time ? booking.start_time.slice(0,5) : "09:00", 
    duration_hours: booking?.duration_hours || 3,
    pax: booking?.pax || 10,
    guest_list: booking?.guest_list || "",
    notes: booking?.notes || ""
  });

  const [calculation, setCalculation] = useState({
    ratePerHour: 999,
    discountApplied: false,
    totalAmount: booking?.amount_paid || 0,
    endTime: ""
  });

  // Auto-Count Pax based on Guest List lines
  const handleGuestListChange = (val: string) => {
    const lines = val.split("\n").filter(line => line.trim() !== "");
    setFormData({
        ...formData, 
        guest_list: val,
        pax: lines.length > 0 ? lines.length : 1
    });
  };

  // Auto-Calculate Price & End Time
  useEffect(() => {
    const BASE_RATE = 999;
    const hour = parseInt(formData.start_time.split(":")[0]);
    const isMorning = hour < 12;
    
    let finalRate = BASE_RATE;
    if (isMorning) {
        finalRate = BASE_RATE - (BASE_RATE * 0.18); // 18% Discount
    }

    const total = Math.round(finalRate * formData.duration_hours);

    // Calculate End Time
    const dummyDate = parse(formData.start_time, "HH:mm", new Date());
    const endDate = addHours(dummyDate, formData.duration_hours);

    setCalculation({
        ratePerHour: Math.round(finalRate),
        discountApplied: isMorning,
        totalAmount: total,
        endTime: format(endDate, "h:mm a")
    });

  }, [formData.start_time, formData.duration_hours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endTime24 = parse(calculation.endTime, "h:mm a", new Date());
    const payload = {
        client_name: formData.client_name,
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: format(endTime24, "HH:mm"),
        duration_hours: formData.duration_hours,
        pax: formData.pax,
        guest_list: formData.guest_list,
        amount_paid: calculation.totalAmount, // Uses auto-calculated amount
        status: "Confirmed", // Or keep existing status if we wanted more complex logic
        notes: formData.notes
    };
    
    toast.promise(
        async () => {
            if (booking) {
                // UPDATE
                const { error } = await supabase
                    .from("dmd_exclusive_bookings")
                    .update(payload)
                    .eq("id", booking.id);
                if (error) throw error;
            } else {
                // INSERT
                const { error } = await supabase
                    .from("dmd_exclusive_bookings")
                    .insert([payload]);
                if (error) throw error;
            }
            onSuccess();
        },
        {
            loading: booking ? "Updating booking..." : "Booking exclusive space...",
            success: booking ? "Booking updated successfully!" : "Exclusive booking confirmed!",
            error: "Operation failed"
        }
    );
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Client / Organization Name</Label>
        <Input 
            required 
            value={formData.client_name}
            onChange={e => setFormData({...formData, client_name: e.target.value})}
            placeholder="e.g. Code Geass Team"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Date</Label>
            <Input 
                type="date"
                required
                value={formData.booking_date}
                onChange={e => setFormData({...formData, booking_date: e.target.value})}
            />
        </div>
        <div className="space-y-2">
            <Label>Start Time</Label>
            <Input 
                type="time"
                required
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
            />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Duration (Hours)</Label>
            <Input 
                type="number"
                min=".5"
                value={formData.duration_hours}
                onChange={e => setFormData({...formData, duration_hours: parseFloat(e.target.value) || 0})}
            />
        </div>
        <div className="space-y-2">
            <Label>Pax (No. of People)</Label>
            <Input 
                type="number"
                value={formData.pax}
                onChange={e => setFormData({...formData, pax: parseInt(e.target.value) || 1})}
            />
        </div>
      </div>

      {/* Guest List */}
      <div className="space-y-2">
        <div className="flex justify-between">
            <Label>Guest List (Names)</Label>
            <span className="text-xs text-slate-400">One name per line</span>
        </div>
        <Textarea 
            placeholder="John Doe&#10;Jane Smith&#10;..."
            className="h-24 font-mono text-sm"
            value={formData.guest_list}
            onChange={(e) => handleGuestListChange(e.target.value)}
        />
      </div>

      {/* Pricing Summary Card */}
      <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
        <div className="flex justify-between text-sm">
            <span className="text-slate-500">Rate per Hour:</span>
            <div className="text-right">
                {calculation.discountApplied && (
                    <span className="text-xs line-through text-slate-400 mr-2">₱999</span>
                )}
                <span className={calculation.discountApplied ? "text-green-600 font-bold" : "font-medium"}>
                    ₱{calculation.ratePerHour}
                    {calculation.discountApplied && " (18% Off)"}
                </span>
            </div>
        </div>
        <div className="flex justify-between text-sm">
            <span className="text-slate-500">End Time:</span>
            <span className="font-medium">{calculation.endTime}</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-bold">Total Amount:</span>
            <span className="text-2xl font-bold text-green-700">₱{calculation.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Special requests..."
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
          {loading ? "Processing..." : (booking ? "Save Changes" : "Confirm Exclusive Booking")}
        </Button>
      </DialogFooter>
    </form>
  );
}