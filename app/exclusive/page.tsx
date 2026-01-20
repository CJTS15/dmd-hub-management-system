"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ExclusiveBookingForm from "@/components/ExclusiveBookingForm";
import { format, parse } from "date-fns";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Gem,
  Clock,
  Pencil,
  Users
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function ExclusivePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("dmd_exclusive_bookings")
      .select("*", { count: "exact" })
      .order("booking_date", { ascending: false }); // Sort by Date (newest first)

    if (searchTerm) {
      query = query.ilike("client_name", `%${searchTerm}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (!error && data) {
      setBookings(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [page, searchTerm]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page on search
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    toast("Delete this booking?", {
        description: "This cannot be undone.",
        action: {
            label: "Delete",
            onClick: () => {
                toast.promise(async () => {
                    await supabase.from("dmd_exclusive_bookings").delete().eq("id", id);
                    fetchBookings();
                }, {
                    loading: "Deleting...",
                    success: "Deleted successfully",
                    error: "Error deleting"
                });
            }
        }
    });
  };

  const handleMarkComplete = async (id: string) => {
    await supabase.from("dmd_exclusive_bookings").update({ status: "Completed" }).eq("id", id);
    fetchBookings();
    toast.success("Booking marked as completed");
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Helper to format Time (09:00:00 -> 9:00 AM)
  const formatTime = (timeStr: string) => {
    try {
        const parsed = parse(timeStr, "HH:mm:ss", new Date());
        return format(parsed, "h:mm a");
    } catch (e) {
        return timeStr; // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gem className="text-purple-600" /> Exclusive Space
            </h2>
            <p className="text-slate-500">
              Manage whole-space bookings and reservations.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search client..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Exclusive Space Booking</DialogTitle>
                </DialogHeader>
                <ExclusiveBookingForm
                  onSuccess={() => {
                    setIsAddOpen(false);
                    fetchBookings();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- ADD THIS DIALOG FOR EDITING --- */}
        <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Exclusive Booking</DialogTitle>
                </DialogHeader>
                {editingBooking && (
                    <ExclusiveBookingForm 
                        booking={editingBooking} 
                        onSuccess={() => {
                            setEditingBooking(null);
                            fetchBookings();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>

        {/* Table */}
        {/* Added 'w-full' and 'overflow-hidden' to the card container */}
        <div className="bg-white rounded-lg shadow border flex flex-col min-h-[500px] w-full overflow-hidden">
          
          {/* Added this wrapper div to handle table scrolling internally */}
          <div className="overflow-x-auto flex-1"> 
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                          <Loader2 className="animate-spin h-4 w-4"/> Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                      No exclusive bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-slate-700">
                        {format(new Date(b.booking_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{b.client_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {formatTime(b.start_time)} - {formatTime(b.end_time)}
                        </div>
                      </TableCell>
                      <TableCell>{b.duration_hours} hrs</TableCell>
                      {/* UPDATED PAX CELL */}
                      <TableCell>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent hover:text-blue-600 flex items-center gap-1">
                                      <Users size={14} className="text-slate-400"/> 
                                      <span className="font-semibold underline decoration-dotted underline-offset-4">
                                          {b.pax}
                                      </span>
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-0">
                                  <div className="p-3 bg-slate-50 border-b font-medium text-sm text-slate-500">
                                      Guest List
                                  </div>
                                  <div className="p-3 max-h-60 overflow-y-auto">
                                      {b.guest_list ? (
                                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                              {b.guest_list.split("\n").map((name: string, i: number) => (
                                                  name.trim() && <li key={i}>{name}</li>
                                              ))}
                                          </ul>
                                      ) : (
                                          <p className="text-sm text-slate-400 italic">No names provided.</p>
                                      )}
                                  </div>
                              </PopoverContent>
                          </Popover>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.status === "Confirmed" ? "default" : "secondary"} className={b.status === "Confirmed" ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" : ""}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-700">
                        ₱{b.amount_paid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                              {b.status === "Confirmed" && (
                                  <Button size="sm" variant="ghost" className="h-8 text-blue-600" onClick={() => handleMarkComplete(b.id)}>
                                      Finish
                                  </Button>
                              )}
                              
                              {/* EDIT BUTTON */}
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-slate-500 hover:text-blue-600" 
                                  onClick={() => setEditingBooking(b)}
                              >
                                  <Pencil size={14} />
                              </Button>

                              {/* DELETE BUTTON */}
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-slate-400 hover:text-red-600" 
                                  onClick={() => handleDelete(b.id)}
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

          {/* Pagination */}
          <div className="p-4 border-t flex justify-between items-center bg-slate-50 mt-auto">
             <span className="text-sm text-slate-500">Page {page + 1} of {totalPages || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}> Next <ChevronRight className="h-4 w-4" /></Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}