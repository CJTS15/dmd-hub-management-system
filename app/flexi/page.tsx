"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import FlexiBookingForm from "@/components/FlexiBookingForm";
import { format, differenceInMinutes, parseISO } from "date-fns";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Crown,
  LogIn,
  LogOut,
  CalendarDays // <--- Calendar Icon for History
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function FlexiPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // History Data State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberLogs, setMemberLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- FETCH MEMBERS ---
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("dmd_flexi_accounts")
      .select("*", { count: "exact" })
      .order("status", { ascending: true }) 
      .order("client_name", { ascending: true });

    if (searchTerm) {
      query = query.ilike("client_name", `%${searchTerm}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (!error && data) {
      setMembers(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [page, searchTerm]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // --- FETCH HISTORY LOGS ---
  const handleViewHistory = async (member: any) => {
    setSelectedMember(member);
    setHistoryOpen(true);
    setLoadingHistory(true);

    const { data } = await supabase
        .from("dmd_flexi_logs")
        .select("*")
        .eq("account_id", member.id)
        .order("check_in_time", { ascending: false });

    if (data) setMemberLogs(data);
    setLoadingHistory(false);
  };

  // --- ACTIONS ---

  const handleCheckIn = async (member: any) => {
    if (new Date() > new Date(member.expiry_date)) {
        return toast.error("This package has expired.");
    }
    if (member.package_type === "DMD Flexi Grind" && member.remaining_hours <= 0) {
        return toast.error("No remaining hours.");
    }

    toast.promise(async () => {
        const now = new Date().toISOString();
        await supabase
            .from("dmd_flexi_accounts")
            .update({ status: "Checked In", last_check_in: now })
            .eq("id", member.id);
        fetchMembers();
    }, {
        loading: "Checking in...",
        success: `${member.client_name} is now active.`,
        error: "Check-in failed"
    });
  };

  const handleCheckOut = async (member: any) => {
    if (!member.last_check_in) return;

    const checkOutTime = new Date();
    const checkInTime = new Date(member.last_check_in);
    const minutes = differenceInMinutes(checkOutTime, checkInTime);
    const hoursSpent = Math.round((minutes / 60) * 100) / 100;

    let newRemaining = member.remaining_hours;
    if (member.package_type === "DMD Flexi Grind") {
        newRemaining = Math.max(0, member.remaining_hours - hoursSpent);
    }

    toast.promise(async () => {
        await supabase.from("dmd_flexi_logs").insert({
            account_id: member.id,
            check_in_time: member.last_check_in,
            check_out_time: checkOutTime.toISOString(),
            duration_hours: hoursSpent
        });

        await supabase.from("dmd_flexi_accounts").update({
            status: "Inactive",
            remaining_hours: newRemaining
        }).eq("id", member.id);

        fetchMembers();
    }, {
        loading: "Checking out...",
        success: `Checked out. Used ${hoursSpent} hours.`,
        error: "Check-out failed"
    });
  };

  const handleDelete = (id: string) => {
    toast("Delete this membership?", {
      description: "This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          toast.promise(
            async () => {
              const { error } = await supabase.from("dmd_flexi_accounts").delete().eq("id", id);
              if (error) throw error; 
              fetchMembers(); 
            },
            {
              loading: "Deleting member...",
              success: "Member deleted",
              error: "Failed to delete",
            }
          );
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="text-orange-600" /> Flexi Members
            </h2>
            <p className="text-slate-500">
              Manage Flexi Grind & Monthly Focus subscriptions.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search member..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              />
            </div>

            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> New Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Register Flexi Member</DialogTitle>
                </DialogHeader>
                <FlexiBookingForm
                  onSuccess={() => {
                    setIsRegisterOpen(false);
                    fetchMembers();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg shadow border flex flex-col min-h-[500px] w-full overflow-hidden">
          <div className="overflow-x-auto flex-1"> 
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Member Name</TableHead>
                  <TableHead className="whitespace-nowrap">Package</TableHead>
                  <TableHead className="whitespace-nowrap">Expiry</TableHead>
                  <TableHead className="whitespace-nowrap">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                          <Loader2 className="animate-spin h-4 w-4"/> Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.id} className={m.status === "Checked In" ? "bg-green-50/50" : ""}>
                      <TableCell className="font-bold text-slate-800">{m.client_name}</TableCell>
                      <TableCell>
                          <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 whitespace-nowrap">
                              {m.package_type}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {format(new Date(m.expiry_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                          {m.package_type === "DMD Flexi Grind" ? (
                              <span className={`font-mono font-bold ${m.remaining_hours < 10 ? 'text-red-600' : 'text-blue-600'}`}>
                                  {Number(m.remaining_hours).toFixed(2)} hrs
                              </span>
                          ) : (
                              <span className="text-slate-400 text-xs">Unlimited</span>
                          )}
                      </TableCell>
                      <TableCell>
                          {m.status === "Checked In" ? (
                              <div className="flex items-center gap-1 text-green-600 font-bold text-xs animate-pulse">
                                  <span className="h-2 w-2 rounded-full bg-green-500"></span> Active
                              </div>
                          ) : (
                              <span className="text-slate-400 text-xs">Away</span>
                          )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-700">
                        ₱{m.amount_paid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">

                              {m.status !== "Checked In" ? (
                                  <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 text-white h-8 whitespace-nowrap"
                                      onClick={() => handleCheckIn(m)}
                                  >
                                      <LogIn size={14} className="mr-1" /> Check In
                                  </Button>
                              ) : (
                                  <Button 
                                      size="sm" 
                                      className="bg-red-600 hover:bg-red-700 text-white h-8 whitespace-nowrap"
                                      onClick={() => handleCheckOut(m)}
                                  >
                                      <LogOut size={14} className="mr-1" /> Out
                                  </Button>
                              )}

                              {/* HISTORY BUTTON */}
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewHistory(m)}
                                  title="View Usage History"
                              >
                                  <CalendarDays size={16} />
                              </Button>

                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDelete(m.id)}>
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

          <div className="p-4 border-t flex justify-between items-center bg-slate-50 mt-auto">
             <span className="text-sm text-slate-500">Page {page + 1} of {totalPages || 1}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}> Next <ChevronRight className="h-4 w-4" /></Button>
             </div>
          </div>
        </div>

        {/* --- HISTORY DIALOG --- */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Usage History</DialogTitle>
                    <DialogDescription>
                        Records for <span className="font-bold text-slate-900">{selectedMember?.client_name}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Date</TableHead>
                                <TableHead>Time In</TableHead>
                                <TableHead>Time Out</TableHead>
                                <TableHead className="text-right">Used</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingHistory ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <Loader2 className="animate-spin h-4 w-4 mx-auto"/>
                                    </TableCell>
                                </TableRow>
                            ) : memberLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                                        No history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                memberLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-slate-600">
                                            {format(parseISO(log.check_in_time), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {format(parseISO(log.check_in_time), "h:mm a")}
                                        </TableCell>
                                        <TableCell>
                                            {log.check_out_time ? format(parseISO(log.check_out_time), "h:mm a") : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-700">
                                            {log.duration_hours} hrs
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Total Summary */}
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-md text-sm">
                    <span className="font-medium text-slate-600">Total Hours Used:</span>
                    <span className="font-bold text-slate-900 text-lg">
                        {memberLogs.reduce((sum, log) => sum + (Number(log.duration_hours) || 0), 0).toFixed(2)} hrs
                    </span>
                </div>
            </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}