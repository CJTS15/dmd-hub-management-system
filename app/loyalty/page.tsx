"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Crown, 
  Search, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from "lucide-react";

type LoyaltyStat = {
  name: string;
  count: number;
  totalHours: number;
  lastVisit: string;
};

const ITEMS_PER_PAGE = 10;

export default function LoyaltyPage() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  // --- Helper: Normalize Name Logic ---
  const getNormalizedKey = (fullName: string) => {
    if (!fullName) return "unknown";
    const cleanName = fullName.replace(/[.]/g, "").toLowerCase().trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length <= 2) {
        return cleanName;
    }
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch Regular Bookings (>= 3 hours)
      const { data: bookingData } = await supabase
        .from("dmd_bookings")
        .select("customer_name, check_in_time, duration_hours")
        .gte("duration_hours", 3);

      // 2. Fetch Flexi Logs (>= 3 hours)
      // We join dmd_flexi_accounts to get the client_name
      const { data: flexiData } = await supabase
        .from("dmd_flexi_logs")
        .select(`
            check_in_time, 
            duration_hours, 
            dmd_flexi_accounts ( client_name )
        `)
        .gte("duration_hours", 3);

      // 3. Merge Data Sources
      const allRecords = [];

      // Add Bookings
      bookingData?.forEach(item => {
        allRecords.push({
            name: item.customer_name,
            date: item.check_in_time,
            hours: item.duration_hours
        });
      });

      // Add Flexi Logs
      flexiData?.forEach((item: any) => {
        // Handle potential array or object from join
        const name = Array.isArray(item.dmd_flexi_accounts) 
            ? item.dmd_flexi_accounts[0]?.client_name 
            : item.dmd_flexi_accounts?.client_name;

        if (name) {
            allRecords.push({
                name: name,
                date: item.check_in_time,
                hours: item.duration_hours
            });
        }
      });

      // 4. Process & Aggregate
      const stats: Record<string, LoyaltyStat> = {};

      allRecords.forEach((record) => {
        const rawName = record.name;
        const key = getNormalizedKey(rawName);

        if (!stats[key]) {
          stats[key] = {
            name: rawName, 
            count: 0,
            totalHours: 0,
            lastVisit: record.date,
          };
        }

        stats[key].count += 1;
        stats[key].totalHours += Number(record.hours);

        // Update name to most recent usage
        if (new Date(record.date) > new Date(stats[key].lastVisit)) {
          stats[key].lastVisit = record.date;
          stats[key].name = rawName; 
        }
      });

      // 5. Sort (Count DESC, then Hours DESC)
      const sortedList = Object.values(stats).sort((a, b) => {
        if (b.count === a.count) return b.totalHours - a.totalHours;
        return b.count - a.count;
      });

      setLoyaltyData(sortedList);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Reset page when searching
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Award className="h-5 w-5 text-slate-400 fill-slate-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700 fill-amber-700" />;
    return <span className="font-bold text-slate-400">#{index + 1}</span>;
  };

  const top3 = loyaltyData.slice(0, 3);

  // --- Filter Logic ---
  const filteredLoyalty = loyaltyData.filter((stat) =>
    stat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Client-Side Pagination Logic ---
  const totalPages = Math.ceil(filteredLoyalty.length / ITEMS_PER_PAGE);
  const startIndex = page * ITEMS_PER_PAGE;
  const visibleData = filteredLoyalty.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-600" /> DMD Leaderboard
            </h2>
            <p className="text-slate-500">
              Celebrate your most dedicated students and track the top leaderboard rankings.
            </p>
          </div>
        </div>

        {/* Top 3 Cards (Always visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
             Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded animate-pulse"></div>
             ))
          ) : (
            top3.map((entry, index) => (
                <Card
                key={entry.name}
                className={`border-t-4 ${
                    index === 0
                    ? "border-t-yellow-500 shadow-md"
                    : index === 1
                    ? "border-t-slate-400"
                    : "border-t-amber-700"
                }`}
                >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">
                    Rank #{index + 1}
                    </CardTitle>
                    {index === 0 && <Crown className="text-yellow-500" />}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate text-slate-800">
                    {entry.name}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                    <div className="text-sm text-slate-500">Total Check-ins</div>
                    <div className="text-xl font-bold text-blue-600">
                        {entry.count}
                    </div>
                    </div>
                </CardContent>
                </Card>
            ))
          )}
        </div>

        {/* Search & Table */}
        <div className="bg-white rounded-lg shadow border flex flex-col min-h-[500px] w-full overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-semibold flex items-center gap-2">
              All Customer Rankings
            </h3>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search customer..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1"> 
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-center">Total Check-ins</TableHead>
                  <TableHead className="text-center">Total Hours</TableHead>
                  <TableHead className="text-right">Last Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                          <Loader2 className="animate-spin h-4 w-4"/> Calculating rankings...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : visibleData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-slate-500"
                    >
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleData.map((stat) => (
                      <TableRow key={stat.name}>
                      <TableCell className="font-medium">
                          {getRankIcon(
                          loyaltyData.findIndex((x) => x.name === stat.name)
                          )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                          {stat.name}
                      </TableCell>
                      <TableCell className="text-center">
                          <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1"
                          >
                          {stat.count}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-600">
                          {stat.totalHours.toFixed(1)} hrs
                      </TableCell>
                      <TableCell className="text-right text-slate-500 text-sm">
                          {format(new Date(stat.lastVisit), "MMM dd, yyyy")}
                      </TableCell>
                      </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t flex justify-between items-center bg-slate-50 mt-auto">
             <span className="text-sm text-slate-500">
                Page {page + 1} of {totalPages || 1} ({filteredLoyalty.length} customers)
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