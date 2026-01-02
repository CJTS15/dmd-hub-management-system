"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PantryItem = {
  id: string;
  name: string;
  price: number;
};

type CartItem = PantryItem & {
  quantity: number;
};

export default function PantryOrderForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Combobox State
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("dmd_pantry_items")
        .select("*")
        .order("name");
      if (data) setItems(data);
    };
    fetchItems();
  }, []);

  const addToCart = () => {
    if (!selectedItemId) return;
    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    const existingIndex = cart.findIndex((i) => i.id === selectedItemId);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, quantity }]);
    }

    setSelectedItemId("");
    setQuantity(1);
    setOpen(false);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const totalAmount = calculateTotal();
    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const summary = cart.map((i) => `${i.quantity}x ${i.name}`).join(", ");

    const { error } = await supabase.from("dmd_pantry_transactions").insert([
      {
        items_summary: summary,
        total_quantity: totalQty,
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      alert("Error processing order");
    }
  };

  const selectedItem = items.find((item) => item.id === selectedItemId);

  return (
    <div className="space-y-4">
      {/* Add Item Section */}
      <div className="flex gap-2 items-end">
        {/* We use min-w-0 to allow flex items to shrink below their content size */}
        <div className="flex-1 space-y-2 flex flex-col min-w-0">
          <Label>Select Item</Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full font-normal px-3"
              >
                {/* Wrap text in span with truncate to prevent overflow */}
                <span className="truncate flex-1 text-left">
                  {selectedItem
                    ? `${selectedItem.name} - ₱${selectedItem.price}`
                    : "Search item..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            
            {/* Fixed the width class syntax */}
            <PopoverContent
              className="p-0 w-(--radix-popover-trigger-width)"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search item name..." />
                <CommandList>
                  <CommandEmpty>No item found.</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => {
                          setSelectedItemId(item.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedItemId === item.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-slate-500 text-xs ml-2 shrink-0">
                          ₱{item.price}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Fixed Inputs */}
        <div className="w-20 space-y-2 shrink-0">
          <Label>Qty</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
        <Button
          onClick={addToCart}
          variant="secondary"
          className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
        >
          Add
        </Button>
      </div>

      {/* Cart Display */}
      <div className="border rounded-md p-2 bg-slate-50 min-h-[100px] max-h-[200px] overflow-y-auto space-y-2">
        {cart.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No items added yet.
          </p>
        )}
        {cart.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-sm bg-white p-2 rounded border shadow-sm"
          >
            {/* Added truncate here too so long cart items don't break layout */}
            <span className="truncate mr-2">
              {item.quantity}x {item.name}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-semibold">
                ₱{item.price * item.quantity}
              </span>
              <button
                onClick={() => removeFromCart(idx)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center bg-slate-100 p-3 rounded">
        <span className="font-bold">Total:</span>
        <span className="text-xl font-bold text-green-700">
          ₱{calculateTotal()}
        </span>
      </div>

      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={loading || cart.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap w-full sm:w-auto"
        >
          {loading ? "Processing..." : "Complete Order"}
        </Button>
      </DialogFooter>
    </div>
  );
}