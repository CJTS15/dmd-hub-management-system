"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import BookingForm from "@/components/BookingForm";
import EditBookingForm from "@/components/EditBookingForm";
import ExtendBookingForm from "@/components/ExtendBookingForm";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  LogOut, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Clock
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [extendingBooking, setExtendingBooking] = useState<any>(null);

  // 1. Efficient Fetch Function
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    
    // Calculate range for pagination
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("dmd_bookings")
      .select("*", { count: "exact" }) // Get total count for pagination
      .order("check_in_time", { ascending: false });

    // Server-side Filtering
    if (searchTerm) {
      // Search in Name OR Seat Number
      query = query.or(`customer_name.ilike.%${searchTerm}%,seat_number.ilike.%${searchTerm}%`);
    }

    // Apply Pagination
    const { data, count, error } = await query.range(from, to);

    if (!error && data) {
      setBookings(data);
      if (count !== null) setTotalCount(count);
    }
    
    setLoading(false);
  }, [page, searchTerm]);

  // 2. Fetch on Mount or when Page/Search changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 3. Reset Page to 0 when searching
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // const handleCheckOut = async (id: string) => {
  //   if (!confirm("Confirm check-out for this customer?")) return;
  //   const now = new Date().toISOString();
  //   await supabase
  //     .from("dmd_bookings")
  //     .update({ status: "Completed", check_out_time: now })
  //     .eq("id", id);
  //   fetchBookings();
  // };

  const handleCheckOut = async (id: string) => {
    // 1. Show the confirmation Toast
    toast("Confirm check-out for this customer?", {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        // 2. This runs only if they click "Delete"
        onClick: async () => {
            
          // 3. Wrap the database call in a Promise Toast for UX feedback
          toast.promise(
            async () => {
              const now = new Date().toISOString();
              await supabase
                .from("dmd_bookings")
                .update({ status: "Completed", check_out_time: now })
                .eq("id", id);
              fetchBookings();
            },
            {
              loading: "Checking out...",
              success: "Customer has been checked out.",
              error: "Failed to check out customer.",
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
              const { error } = await supabase.from("dmd_bookings").delete().eq("id", id);
              if (error) throw error; // Trigger the error state
              fetchBookings(); // Refresh data
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="text-blue-600" /> DMD Hub Timesheet
            </h2>
            <p className="text-slate-500">
              Real-time tracking of student check-ins, active seats, and daily flow.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search name or seat..."
                className="pl-8 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Check-In Dialog */}
            <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> New Check-in
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Check In Customer</DialogTitle>
                </DialogHeader>
                <BookingForm
                  onSuccess={() => {
                    setIsCheckInOpen(false);
                    fetchBookings();
                  }}
                />
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
              open={!!editingBooking}
              onOpenChange={(open) => !open && setEditingBooking(null)}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Booking Details</DialogTitle>
                </DialogHeader>
                {editingBooking && (
                  <EditBookingForm
                    booking={editingBooking}
                    onSuccess={() => {
                      setEditingBooking(null);
                      fetchBookings();
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
            
            {/* Extend Dialog */}
            <Dialog
                open={!!extendingBooking}
                onOpenChange={(open) => !open && setExtendingBooking(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Extend Time</DialogTitle>
                    </DialogHeader>
                    {extendingBooking && (
                        <ExtendBookingForm
                            booking={extendingBooking}
                            onSuccess={() => {
                                setExtendingBooking(null);
                                fetchBookings();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- FIXED SECTION STARTS HERE --- */}
        {/* Added 'w-full' and 'overflow-hidden' to the card container */}
        <div className="bg-white rounded-lg shadow border flex flex-col min-h-[500px] w-full overflow-hidden">
          
          {/* Added this wrapper div to handle table scrolling internally */}
          <div className="overflow-x-auto flex-1"> 
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Seat</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Package</TableHead>
                    <TableHead className="whitespace-nowrap">Check-in</TableHead>
                    <TableHead className="whitespace-nowrap">Duration</TableHead>
                    <TableHead className="whitespace-nowrap">Check-out</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                        <div className="flex justify-center items-center gap-2 text-slate-500">
                            <Loader2 className="animate-spin h-4 w-4"/> Loading records...
                        </div>
                    </TableCell>
                    </TableRow>
                ) : bookings.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={11} className="text-center h-24 text-slate-500">
                        No results found.
                    </TableCell>
                    </TableRow>
                ) : (
                    bookings.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell>
                        {format(new Date(booking.check_in_time), "MMM dd")}
                        </TableCell>
                        <TableCell className="font-medium">
                        {booking.customer_name}
                        {booking.rentals && (
                            <div className="text-xs text-slate-500 mt-1">
                            Rentals: {booking.rentals}
                            </div>
                        )}
                        </TableCell>
                        <TableCell className="text-slate-500">
                        {booking.seat_number || "-"}
                        </TableCell>
                        <TableCell>
                        {booking.is_student && (
                            <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">Student</Badge>
                        )}
                        {booking.is_board_examinee && (
                            <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">Examinee</Badge>
                        )}
                        {!booking.is_student && !booking.is_board_examinee && (
                            <Badge variant="outline" className="border-gray-200 text-gray-800 bg-gray-50">Regular</Badge>
                        )}
                        </TableCell>
                        <TableCell>
                        {booking.package_type === "Hourly Rate" ? (
                            <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50 whitespace-nowrap">
                                {booking.package_type}
                            </Badge>
                        ) : booking.package_type === "Focus Saver" ? (
                            <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50 whitespace-nowrap">
                                {booking.package_type}
                            </Badge>
                        ) : booking.package_type === "Power Pass" ? (
                            <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50 whitespace-nowrap">
                                {booking.package_type}
                            </Badge>  
                        ) : (
                            <Badge variant="outline" className="border-sky-200 text-sky-800 bg-sky-50 whitespace-nowrap">
                                {booking.package_type}
                            </Badge>
                        )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                        {format(new Date(booking.check_in_time), "h:mm a")}
                        </TableCell>
                        <TableCell>{booking.duration_hours}</TableCell>
                        <TableCell className="whitespace-nowrap">
                        {booking.check_out_time 
                            ? format(new Date(booking.check_out_time), "h:mm a") 
                            : "-"}
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                            <Badge variant={booking.status === "Active" ? "default" : "secondary"}>
                                {booking.status}
                            </Badge>
                            {booking.status === "Active" && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    title="Extend Time"
                                    onClick={() => setExtendingBooking(booking)}
                                >
                                    <Clock size={12} /> 
                                </Button>
                            )}
                        </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-700">
                        ₱{booking.amount_paid}
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                            <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600"
                            title="Edit"
                            onClick={() => setEditingBooking(booking)}
                            >
                            <Pencil size={14} />
                            </Button>

                            <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            title="Delete"
                            onClick={() => handleDelete(booking.id)}
                            >
                            <Trash2 size={14} />
                            </Button>

                            {booking.status === "Active" && (
                            <Button
                                size="icon"
                                className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 shadow-none"
                                title="Check Out"
                                onClick={() => handleCheckOut(booking.id)}
                            >
                                <LogOut size={14} />
                            </Button>
                            )}
                        </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </div> 
          {/* --- END OF TABLE WRAPPER --- */}
          
          {/* Pagination Controls */}
          <div className="p-4 border-t flex justify-between items-center bg-slate-50 mt-auto">
             <span className="text-sm text-slate-500">
                Page {page + 1} of {totalPages || 1} ({totalCount} records)
             </span>
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