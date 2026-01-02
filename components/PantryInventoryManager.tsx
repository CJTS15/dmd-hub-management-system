"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Save, X, Plus, Loader2 } from "lucide-react";

type PantryItem = {
  id: string;
  name: string;
  category: string;
  price: number;
};

export default function PantryInventoryManager() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Adding New Item
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Snack",
    price: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  // State for Editing Item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: 0,
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dmd_pantry_items")
      .select("*")
      .order("name");
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- Add New Item Function ---
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price)
      return alert("Name and Price are required");
    setIsAdding(true);

    const { error } = await supabase.from("dmd_pantry_items").insert([
      {
        name: newItem.name,
        category: newItem.category,
        price: parseFloat(newItem.price),
        is_available: true,
      },
    ]);

    if (!error) {
      setNewItem({ name: "", category: "Snack", price: "" }); // Reset form
      fetchItems(); // Refresh list
    } else {
      console.error(error);
      alert("Error adding item");
    }
    setIsAdding(false);
  };

  // --- Edit Item Functions ---
  const startEditing = (item: PantryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      category: item.category,
      price: item.price,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("dmd_pantry_items")
      .update({
        name: editForm.name,
        category: editForm.category,
        price: editForm.price,
      })
      .eq("id", id);

    if (!error) {
      setEditingId(null);
      fetchItems();
    } else {
      console.error(error);
      alert("Failed to update item");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Item Section */}
      <div className="bg-slate-100 p-4 rounded-lg border space-y-3">
        <h3 className="font-semibold text-sm text-slate-700">
          Add New Product
        </h3>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5 space-y-1">
            <Label className="text-xs">Item Name</Label>
            <Input
              placeholder="e.g., Oreo"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
          </div>
          <div className="col-span-3 space-y-1">
            <Label className="text-xs">Category</Label>
            <Input
              placeholder="Snack/Drink"
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Price</Label>
            <Input
              type="number"
              placeholder="0"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <Button
              onClick={handleAddItem}
              disabled={isAdding}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isAdding ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="border rounded-md max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead className="w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="h-8"
                      />
                    ) : (
                      <span className="text-slate-500 text-sm">
                        {item.category}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            price: parseFloat(e.target.value),
                          })
                        }
                        className="h-8"
                      />
                    ) : (
                      <span>₱{item.price}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => saveEdit(item.id)}
                        >
                          <Save size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500"
                          onClick={cancelEditing}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        onClick={() => startEditing(item)}
                      >
                        <Pencil size={16} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
