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
import { addDays, format } from "date-fns";
import { toast } from "sonner";

export default function FlexiRegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    package_type: "DMD Flexi Grind",
    start_date: format(new Date(), "yyyy-MM-dd"),
    amount_paid: 2609,
    notes: ""
  });

  const handlePackageChange = (val: string) => {
    if (val === "DMD Flexi Grind") {
        setFormData({ ...formData, package_type: val, amount_paid: 2609 });
    } else {
        setFormData({ ...formData, package_type: val, amount_paid: 5099 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Calculate Expiry and Limits based on Package
    let expiryDate = new Date(formData.start_date);
    let totalHours = null;
    let remainingHours = null;

    if (formData.package_type === "DMD Flexi Grind") {
        expiryDate = addDays(expiryDate, 30); // Valid for 30 days
        totalHours = 60;
        remainingHours = 60;
    } else {
        // Monthly Focus
        expiryDate = addDays(expiryDate, 40); // Valid for 40 days
        // No total hour limit, but daily limit (handled in check-out logic)
    }

    toast.promise(async () => {
        const { error } = await supabase.from("dmd_flexi_accounts").insert([{
            client_name: formData.client_name,
            package_type: formData.package_type,
            start_date: formData.start_date,
            expiry_date: format(expiryDate, "yyyy-MM-dd"),
            total_hours_limit: totalHours,
            remaining_hours: remainingHours,
            amount_paid: formData.amount_paid,
            status: "Inactive", // Not checked in yet
            notes: formData.notes
        }]);
        if (error) throw error;
        onSuccess();
    }, {
        loading: "Registering member...",
        success: "Member registered successfully!",
        error: "Failed to register"
    });
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Client Name</Label>
        <Input 
            required 
            value={formData.client_name}
            onChange={(e) => setFormData({...formData, client_name: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-2">
            <Label>Package</Label>
            <Select value={formData.package_type} onValueChange={handlePackageChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="DMD Flexi Grind">DMD Flexi Grind (60hrs/30days)</SelectItem>
                    <SelectItem value="Monthly Focus">Monthly Focus (30days/40valid)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="col-span-2 space-y-2">
            <Label>Amount (₱)</Label>
            <Input 
                type="number" 
                value={formData.amount_paid}
                onChange={(e) => setFormData({...formData, amount_paid: parseFloat(e.target.value)})}
            />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Start Date</Label>
        <Input 
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input 
            placeholder="e.g. 18 hours logged previously"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      {/* Summary Box */}
      <div className="bg-slate-50 p-4 rounded-md border space-y-2">
        <div className="flex justify-between items-center border-t pt-2 mt-2">
          <span className="font-semibold text-sm">Total Amount:</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-700">
                ₱{formData.amount_paid}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
            {loading ? "Registering..." : "Register Member"}
        </Button>
      </DialogFooter>
    </form>
  );
}