"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PantryOrderForm from "@/components/PantryOrderForm";
import PantryInventoryManager from "@/components/PantryInventoryManager";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Pantry() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog States
  const [openBuy, setOpenBuy] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  // Optimized Fetch Function with Pagination
  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, count, error } = await supabase
      .from("dmd_pantry_transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setTransactions(data);
      if (count !== null) setTotalCount(count);
    }
    
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-emerald-600" /> Brain Fuel Station
            </h2>
            <p className="text-slate-500">
              Manage inventory and track snack sales to keep the study grind going.
            </p>
          </div>

          {/* Buttons Group */}
          <div className="flex gap-2 w-full md:w-auto">
            {/* 1. Manage Inventory Button */}
            <Dialog open={openManage} onOpenChange={setOpenManage}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-300 whitespace-nowrap">
                  <Settings className="mr-2 h-4 w-4" /> Manage Inventory
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Pantry Inventory Manager</DialogTitle>
                </DialogHeader>
                <PantryInventoryManager />
              </DialogContent>
            </Dialog>

            {/* 2. Buy Item Button */}
            <Dialog open={openBuy} onOpenChange={setOpenBuy}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Buy Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Pantry Purchase</DialogTitle>
                </DialogHeader>
                <PantryOrderForm
                  onSuccess={() => {
                    setOpenBuy(false);
                    // Reset to first page to see new entry
                    setPage(0);
                    fetchTransactions();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow border flex flex-col min-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Items Purchased</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   <TableCell colSpan={3} className="text-center h-24">
                     <div className="flex justify-center items-center gap-2 text-slate-500">
                        <Loader2 className="animate-spin h-4 w-4"/> Loading transactions...
                     </div>
                   </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24 text-slate-500">
                    No transactions found yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {format(new Date(t.created_at), "MMM dd, h:mm a")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 mr-2 rounded-lg font-bold border">
                          {t.total_quantity || 1} x
                      </span>
                      {/* Truncation Logic */}
                      {t.items_summary.length > 80 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <span className="cursor-pointer hover:text-blue-600 hover:underline decoration-dotted underline-offset-4">
                              {t.items_summary.slice(0, 40)}...
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start">
                            <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-500">
                              Full Item List
                            </div>
                            <div className="p-2 max-h-[200px] overflow-y-auto">
                              <ul className="text-sm space-y-1">
                                {/* Split by comma to make a nice list */}
                                {t.items_summary.split(",").map((item: string, i: number) => (
                                  <li key={i} className="px-2 py-1 hover:bg-slate-50 rounded">
                                    {item.trim()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span>{t.items_summary}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-700">
                      ₱{t.total_amount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="p-4 border-t flex justify-between items-center bg-slate-50 mt-auto">
             <span className="text-sm text-slate-500">
                Page {page + 1} of {totalPages || 1} ({totalCount} records)
             </span>
             <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}