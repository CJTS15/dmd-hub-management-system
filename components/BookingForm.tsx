"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculateDynamicRate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { addHours, format } from "date-fns";
import { Gift } from "lucide-react"; // Import Gift icon for visual cue

type PackageType = {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_hourly: boolean;
};

export default function BookingForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    package_id: "",
    duration_hours: 1,
    is_student: false,
    is_board_examinee: false,
    is_group: false,
    is_loyalty: false, // <--- 1. Add Loyalty Flag
    seat_number: "",
    rentals: "",
    notes: "",
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [calculatedEndTime, setCalculatedEndTime] = useState<Date | null>(null);

  // 1. Fetch Packages on Mount
  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase
        .from("dmd_packages")
        .select("*")
        .order("price");
      if (data && data.length > 0) {
        setPackages(data);
        setFormData((prev) => ({ ...prev, package_id: data[0].id }));
      }
    };
    fetchPackages();
  }, []);

  // 2. Auto-calculate based on selected package ID
  useEffect(() => {
    const selectedPkg = packages.find((p) => p.id === formData.package_id);
    if (!selectedPkg) return;

    // A. Calculate Price
    // If Loyalty is checked, price is 0. Otherwise, calculate normally.
    let price = 0;
    
    if (formData.is_loyalty) {
        price = 0;
    } else {
        price = calculateDynamicRate(
            selectedPkg.price,
            selectedPkg.is_hourly,
            formData.duration_hours,
            formData.is_student,
            formData.is_board_examinee
        );
    }
    setTotalPrice(price);

    // B. Calculate Duration & End Time
    const actualDuration = selectedPkg.is_hourly
      ? formData.duration_hours
      : selectedPkg.duration;
    const endTime = addHours(new Date(), actualDuration);
    setCalculatedEndTime(endTime);
  }, [formData, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedPkg = packages.find((p) => p.id === formData.package_id);
    if (!selectedPkg) return;

    const checkInTime = new Date();
    const finalDuration = selectedPkg.is_hourly
      ? formData.duration_hours
      : selectedPkg.duration;
    const checkOutTime = addHours(checkInTime, finalDuration);

    const { error } = await supabase.from("dmd_bookings").insert([
      {
        customer_name: formData.customer_name,
        seat_number: formData.seat_number,
        package_type: selectedPkg.name,
        duration_hours: finalDuration,
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime.toISOString(),
        amount_paid: totalPrice,
        status: "Active",
        is_student: formData.is_student,
        is_board_examinee: formData.is_board_examinee,
        is_group: formData.is_group,
        rentals: formData.rentals,
        // Append "Loyalty Award" to notes if checked so you have a record of why it was free
        notes: formData.is_loyalty 
            ? (formData.notes ? `[Loyalty Award] ${formData.notes}` : `[Loyalty Award]`) 
            : formData.notes,
      },
    ]);

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      alert("Error saving data");
      console.error(error);
    }
  };

  const selectedPkg = packages.find((p) => p.id === formData.package_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer Name</Label>
          <Input
            required
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Package Type</Label>
          <Select
            value={formData.package_id}
            onValueChange={(val) =>
              setFormData({ ...formData, package_id: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name} (
                  {pkg.is_hourly ? `₱${pkg.price}/hr` : `₱${pkg.price}`})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPkg?.is_hourly ? (
          <div className="space-y-2">
            <Label>Duration (Hours)</Label>
            <Input
              type="number"
              min="1"
              value={formData.duration_hours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_hours: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Fixed Duration</Label>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-md text-sm border mt-1">
              {selectedPkg ? `${selectedPkg.duration} Hours` : "-"}
            </div>
          </div>
        )}
      </div>

      {/* Checkboxes Row 1 */}
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="student"
            checked={formData.is_student}
            onCheckedChange={(c) =>
              setFormData({ ...formData, is_student: c as boolean })
            }
          />
          <Label htmlFor="student">Student?</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="examinee"
            checked={formData.is_board_examinee}
            onCheckedChange={(c) =>
              setFormData({ ...formData, is_board_examinee: c as boolean })
            }
          />
          <Label htmlFor="examinee">Examinee?</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="group"
            checked={formData.is_group}
            onCheckedChange={(c) =>
              setFormData({ ...formData, is_group: c as boolean })
            }
          />
          <Label htmlFor="group">Group?</Label>
        </div>
      </div>

      {/* Checkboxes Row 2: Loyalty (Highlighted) */}
      <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md w-fit">
        <Checkbox
            id="loyalty"
            className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-600"
            checked={formData.is_loyalty}
            onCheckedChange={(c) =>
              setFormData({ ...formData, is_loyalty: c as boolean })
            }
        />
        <Label htmlFor="loyalty" className="flex items-center gap-2 cursor-pointer text-yellow-800 font-medium">
            <Gift size={16} /> Loyalty Award (Free)
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Rentals / Notes</Label>
        <Input
          placeholder="Charger, Laptop Stand, etc."
          value={formData.rentals}
          onChange={(e) =>
            setFormData({ ...formData, rentals: e.target.value })
          }
        />
      </div>

      {/* Summary Box */}
      <div className="bg-slate-50 p-4 rounded-md border space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Expected Check-out:</span>
          <span className="font-semibold text-slate-800">
            {calculatedEndTime ? format(calculatedEndTime, "h:mm a") : "--:--"}
          </span>
        </div>
        <div className="flex justify-between items-center border-t pt-2 mt-2">
          <span className="font-semibold text-sm">Total Amount:</span>
          <div className="flex items-center gap-2">
            {formData.is_loyalty && <span className="text-sm line-through text-slate-400">₱{packages.find(p => p.id === formData.package_id)?.price}</span>}
            <span className="text-2xl font-bold text-green-700">
                ₱{totalPrice}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap" type="submit" disabled={loading}>
          {loading ? "Checking In..." : "Check In Customer"}
        </Button>
      </DialogFooter>
    </form>
  );
}