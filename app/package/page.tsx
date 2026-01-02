"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PackageForm from "@/components/PackageForm";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, Pencil, Trash2, Tag } from "lucide-react";

type PackageItem = {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_hourly: boolean;
};

export default function PackagePage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackageItem | null>(null);

  const fetchPackages = async () => {
    const { data } = await supabase
      .from("dmd_packages")
      .select("*")
      .order("price");
    if (data) setPackages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = (id: string) => {
    // 1. Show the confirmation Toast
    toast("Are you sure you want to delete this?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        // 2. This runs only if they click "Delete"
        onClick: async () => {
            
          // 3. Wrap the database call in a Promise Toast for UX feedback
          toast.promise(
            async () => {
              const { error } = await supabase.from("dmd_packages").delete().eq("id", id);
              if (error) throw error; // Trigger the error state
              fetchPackages(); // Refresh data
            },
            {
              loading: "Deleting package...",
              success: "Package has been deleted",
              error: "Failed to delete package",
            }
          );
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => console.log("Cancelled"),
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        {/* Header Section - Aligned like Dashboard/Pantry */}
        <div className="flex justify-between items-center mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="text-blue-600" /> Pricing & Perks
            </h2>
            <p className="text-slate-500">
              Configure flexible hourly rates, saver bundles, and special promo offers.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Package</DialogTitle>
              </DialogHeader>
              <PackageForm
                onSuccess={() => {
                  setIsAddOpen(false);
                  fetchPackages();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-slate-500"
                  >
                    Loading packages...
                  </TableCell>
                </TableRow>
              ) : packages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-slate-500"
                  >
                    No packages found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {pkg.name}
                    </TableCell>
                    <TableCell>₱{pkg.price}</TableCell>
                    <TableCell>
                      {pkg.duration > 0 ? pkg.duration : "Variable"}
                    </TableCell>
                    <TableCell>
                      {pkg.is_hourly ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          Per Hour
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                          Fixed Bundle
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => setEditingItem(pkg)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog - Controlled by State */}
        <Dialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <PackageForm
                initialData={editingItem}
                onSuccess={() => {
                  setEditingItem(null);
                  fetchPackages();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
