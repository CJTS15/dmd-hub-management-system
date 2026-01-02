"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";

type PackageItem = {
  id?: string;
  name: string;
  price: number;
  duration: number;
  is_hourly: boolean;
};

export default function PackageForm({
  initialData,
  onSuccess,
}: {
  initialData?: PackageItem;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PackageItem>({
    name: initialData?.name || "",
    price: initialData?.price || 0,
    duration: initialData?.duration || 0,
    is_hourly: initialData?.is_hourly || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Name is required");
    setLoading(true);

    let error;
    if (initialData?.id) {
      // Update
      const { error: err } = await supabase
        .from("dmd_packages")
        .update({
          name: formData.name,
          price: formData.price,
          duration: formData.duration,
          is_hourly: formData.is_hourly,
        })
        .eq("id", initialData.id);
      error = err;
    } else {
      // Insert
      const { error: err } = await supabase
        .from("dmd_packages")
        .insert([formData]);
      error = err;
    }

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      alert("Failed to save package");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Package Name</Label>
        <Input
          placeholder="e.g. Night Owl Promo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price (₱)</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (Hours)</Label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: parseFloat(e.target.value) })
            }
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 border p-3 rounded bg-slate-50">
        <Checkbox
          id="hourly"
          checked={formData.is_hourly}
          onCheckedChange={(c) =>
            setFormData({ ...formData, is_hourly: c as boolean })
          }
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="hourly" className="cursor-pointer">
            Is this an Hourly Rate?
          </Label>
          <p className="text-[0.8rem] text-muted-foreground">
            If checked, Total = Price x Input Hours. <br />
            If unchecked, Total = Fixed Price.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap" onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Saving..."
            : initialData
            ? "Update Package"
            : "Create Package"}
        </Button>
      </DialogFooter>
    </div>
  );
}
