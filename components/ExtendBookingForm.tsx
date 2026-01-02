"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { addHours, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Clock, ArrowRight } from "lucide-react";

type Booking = {
  id: string;
  customer_name: string;
  check_in_time: string;
  check_out_time: string;
  duration_hours: number;
  amount_paid: number;
  package_type: string;
};

export default function ExtendBookingForm({ 
  booking, 
  onSuccess 
}: { 
  booking: Booking; 
  onSuccess: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState(1);
  const [additionalCost, setAdditionalCost] = useState(49); // Default to standard hourly rate

  // Base Hourly Rate (You can change this default)
  const HOURLY_RATE = 49;

  // Auto-calculate cost when hours change
  useEffect(() => {
    setAdditionalCost(hoursToAdd * HOURLY_RATE);
  }, [hoursToAdd]);

  const currentEndTime = booking.check_out_time ? parseISO(booking.check_out_time) : new Date();
  const newEndTime = addHours(currentEndTime, hoursToAdd);
  const newTotalDuration = (Number(booking.duration_hours) || 0) + hoursToAdd;
  const newTotalAmount = (Number(booking.amount_paid) || 0) + additionalCost;

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    toast.promise(
        async () => {
            const { error } = await supabase
            .from("dmd_bookings")
            .update({
                duration_hours: newTotalDuration,
                check_out_time: newEndTime.toISOString(),
                amount_paid: newTotalAmount,
                notes: `Extended by ${hoursToAdd} hrs (+₱${additionalCost})` // Optional: Append note
            })
            .eq("id", booking.id);

            if (error) throw error;
            onSuccess();
        },
        {
            loading: "Updating booking...",
            success: `Extended ${booking.customer_name}'s time by ${hoursToAdd} hour(s)`,
            error: "Failed to extend booking",
        }
    );
    setLoading(false);
  };

  return (
    <form onSubmit={handleExtend} className="space-y-4 py-2">
      <div className="bg-slate-50 p-3 rounded-md border text-sm space-y-1 mb-4">
        <div className="flex justify-between">
            <span className="text-slate-500">Current Package:</span>
            <span className="font-medium">{booking.package_type}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-slate-500">Current End Time:</span>
            <span className="font-medium">{format(currentEndTime, "h:mm a")}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hours to Add</Label>
          <div className="relative">
            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
                type="number"
                min="0.5"
                step="0.5"
                className="pl-9"
                value={hoursToAdd}
                onChange={(e) => setHoursToAdd(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label>Additional Fee (₱)</Label>
            <Input
                type="number"
                value={additionalCost}
                onChange={(e) => setAdditionalCost(parseFloat(e.target.value) || 0)}
            />
        </div>
      </div>

      {/* Preview Section */}
      <div className="border-t pt-4 mt-2">
        <Label className="mb-2 block text-xs uppercase text-slate-500 font-bold">Preview Changes</Label>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col p-3 bg-blue-50 rounded border border-blue-100 items-center">
                <span className="text-blue-600 font-semibold mb-1">New Duration</span>
                <span className="text-xl font-bold text-blue-900">{newTotalDuration} hrs</span>
            </div>
            <div className="flex flex-col p-3 bg-green-50 rounded border border-green-100 items-center">
                <span className="text-green-600 font-semibold mb-1">New Total</span>
                <span className="text-xl font-bold text-green-900">₱{newTotalAmount}</span>
            </div>
        </div>
        <div className="mt-3 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <span>New Check-out:</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="font-bold text-slate-900">{format(newEndTime, "h:mm a")}</span>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? "Saving..." : "Confirm Extension"}
        </Button>
      </DialogFooter>
    </form>
  );
}