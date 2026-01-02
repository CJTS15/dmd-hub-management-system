"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn, downloadCSV } from "@/lib/utils";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Shadcn Charts
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Label,
  LineChart,
  Line,
} from "recharts";

// Icons
import {
  Banknote,
  ShoppingBasket,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  Download,
  Gem, 
  Crown, // Icon for Flexi
  User
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

// --- CHART CONFIGURATION ---
const revenueChartConfig = {
  timesheet: { label: "Hub", color: "#2563eb" },      // Blue
  exclusive: { label: "Exclusive", color: "#9333ea" },// Purple
  flexi: { label: "Flexi", color: "#f97316" },        // Orange
  pantry: { label: "Pantry", color: "#10b981" },      // Emerald
} satisfies ChartConfig;

const packageChartConfig = {
  visitors: { label: "Bookings" },
} satisfies ChartConfig;

const trafficChartConfig = {
  checkIns: { label: "Total Check-ins", color: "#8b5cf6" }, // Violet
} satisfies ChartConfig;

const demographicsChartConfig = {
  value: { label: "Customers" },
  Student: { label: "Student", color: "#2563eb" }, 
  Examinee: { label: "Examinee", color: "#f59e0b" },
  Regular: { label: "Regular", color: "#64748b" },
  Exclusive: { label: "Exclusive", color: "#9333ea" },
  Flexi: { label: "Flexi Member", color: "#f97316" },
} satisfies ChartConfig;

// Pie Colors matching config
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316"];

export default function Reports() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Totals State
  const [timesheetTotal, setTimesheetTotal] = useState(0);
  const [pantryTotal, setPantryTotal] = useState(0);
  const [exclusiveTotal, setExclusiveTotal] = useState(0);
  const [flexiTotal, setFlexiTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  // Analytics State
  const [demographics, setDemographics] = useState<any[]>([]);
  const [packageStats, setPackageStats] = useState<any[]>([]);
  const [pantryBestSellers, setPantryBestSellers] = useState<any[]>([]);
  const [totalPackagesSold, setTotalPackagesSold] = useState(0);

  // Date Filter State
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Pagination State
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    if (!date?.from) return;

    setLoading(true);
    setPage(0);

    const startDateStr = format(date.from, "yyyy-MM-dd");
    const endDateStr = date.to ? format(date.to, "yyyy-MM-dd") : startDateStr;

    // 1. Fetch Timesheet (Daily/Hourly bookings)
    const { data: timesheetData } = await supabase
      .from("dmd_bookings")
      .select("check_in_time, amount_paid, package_type, is_student, is_board_examinee")
      .gte("check_in_time", `${startDateStr}T00:00:00`)
      .lte("check_in_time", `${endDateStr}T23:59:59`);

    // 2. Fetch Pantry Sales
    const { data: pantryData } = await supabase
      .from("dmd_pantry_transactions")
      .select("created_at, total_amount, items_summary")
      .gte("created_at", `${startDateStr}T00:00:00`)
      .lte("created_at", `${endDateStr}T23:59:59`);

    // 3. Fetch Exclusive Bookings
    const { data: exclusiveData } = await supabase
      .from("dmd_exclusive_bookings")
      .select("booking_date, amount_paid, pax")
      .gte("booking_date", startDateStr)
      .lte("booking_date", endDateStr);

    // 4. Fetch Flexi Sales (New Memberships)
    const { data: flexiSales } = await supabase
      .from("dmd_flexi_accounts")
      .select("created_at, amount_paid")
      .gte("created_at", `${startDateStr}T00:00:00`)
      .lte("created_at", `${endDateStr}T23:59:59`);

    // 5. Fetch Flexi Traffic (Daily logs of members)
    const { data: flexiLogs } = await supabase
      .from("dmd_flexi_logs")
      .select("check_in_time")
      .gte("check_in_time", `${startDateStr}T00:00:00`)
      .lte("check_in_time", `${endDateStr}T23:59:59`);

    // --- PROCESS DATA ---
    const grouped: Record<string, any> = {};
    
    let tTotal = 0; // Timesheet
    let pTotal = 0; // Pantry
    let eTotal = 0; // Exclusive
    let fTotal = 0; // Flexi
    
    let checkInCount = 0;
    let pkgTotalCount = 0;

    const pkgCounts: Record<string, number> = {};
    const demoCounts = { Student: 0, Examinee: 0, Regular: 0, Exclusive: 0, Flexi: 0 };

    // Helper to init day
    const initDay = (d: string) => {
        if (!grouped[d]) grouped[d] = { timesheet: 0, pantry: 0, exclusive: 0, flexi: 0, checkIns: 0 };
    };

    // A. Timesheet
    timesheetData?.forEach((item) => {
      const d = format(new Date(item.check_in_time), "yyyy-MM-dd");
      initDay(d);
      
      const amt = Number(item.amount_paid) || 0;
      grouped[d].timesheet += amt;
      grouped[d].checkIns += 1;
      
      tTotal += amt;
      checkInCount++;

      // Pkg Stats
      const pkg = item.package_type || "Unknown";
      pkgCounts[pkg] = (pkgCounts[pkg] || 0) + 1;
      pkgTotalCount++;

      // Demo
      if (item.is_student) demoCounts.Student++;
      else if (item.is_board_examinee) demoCounts.Examinee++;
      else demoCounts.Regular++;
    });

    // B. Exclusive
    exclusiveData?.forEach((item) => {
      const d = item.booking_date; 
      initDay(d);

      const amt = Number(item.amount_paid) || 0;
      grouped[d].exclusive += amt;
      
      const people = item.pax || 1;
      grouped[d].checkIns += people;
      
      eTotal += amt;
      checkInCount += people;
      demoCounts.Exclusive += people; 
    });

    // C. Flexi Sales (Revenue)
    flexiSales?.forEach((item) => {
        const d = format(new Date(item.created_at), "yyyy-MM-dd");
        initDay(d);
        const amt = Number(item.amount_paid) || 0;
        grouped[d].flexi += amt;
        fTotal += amt;
        demoCounts.Flexi++; 
    });

    // D. Flexi Logs (Traffic only)
    flexiLogs?.forEach((item) => {
        const d = format(new Date(item.check_in_time), "yyyy-MM-dd");
        initDay(d);
        grouped[d].checkIns += 1;
        checkInCount++;
    });

    // E. Pantry
    const itemCounts: Record<string, number> = {};
    pantryData?.forEach((item) => {
      const d = format(new Date(item.created_at), "yyyy-MM-dd");
      initDay(d);
      
      const amt = Number(item.total_amount) || 0;
      grouped[d].pantry += amt;
      pTotal += amt;

      if (item.items_summary) {
        const parts = item.items_summary.split(",");
        parts.forEach((part: string) => {
          const match = part.trim().match(/^(\d+)x\s(.+)$/);
          if (match) {
            const qty = parseInt(match[1]);
            const name = match[2];
            itemCounts[name] = (itemCounts[name] || 0) + qty;
          }
        });
      }
    });

    // --- FINAL FORMATTING ---
    const mergedList = Object.keys(grouped)
      .map((date) => ({
        date,
        timesheet: grouped[date].timesheet,
        pantry: grouped[date].pantry,
        exclusive: grouped[date].exclusive,
        flexi: grouped[date].flexi,
        checkIns: grouped[date].checkIns,
        total: grouped[date].timesheet + grouped[date].pantry + grouped[date].exclusive + grouped[date].flexi,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Demographics
    const demoData = [
      { name: "Student", value: demoCounts.Student, fill: "#2563eb" },
      { name: "Examinee", value: demoCounts.Examinee, fill: "#f59e0b" },
      { name: "Regular", value: demoCounts.Regular, fill: "#64748b" },
      { name: "Exclusive", value: demoCounts.Exclusive, fill: "#9333ea" },
      { name: "Flexi Member", value: demoCounts.Flexi, fill: "#f97316" },
    ].filter((d) => d.value > 0);

    // Package Chart
    const pkgChartData = Object.keys(pkgCounts)
      .map((name, index) => ({
        name,
        visitors: pkgCounts[name],
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.visitors - a.visitors);

    // Pantry Items
    const pantryTopItems = Object.keys(itemCounts)
      .map((name) => ({ name, count: itemCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setReportData(mergedList);
    setTimesheetTotal(tTotal);
    setPantryTotal(pTotal);
    setExclusiveTotal(eTotal);
    setFlexiTotal(fTotal);
    setGrandTotal(tTotal + pTotal + eTotal + fTotal);
    setTotalCheckIns(checkInCount);
    setDemographics(demoData);
    setPackageStats(pkgChartData);
    setTotalPackagesSold(pkgTotalCount);
    setPantryBestSellers(pantryTopItems);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reversedData = [...reportData].reverse();
  const totalPages = Math.ceil(reversedData.length / ITEMS_PER_PAGE);
  const startIndex = page * ITEMS_PER_PAGE;
  const visibleData = reversedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleExport = () => {
    const csvData = reportData.map((item) => ({
      Date: item.date,
      "Check-ins": item.checkIns,
      "Packages": item.timesheet,
      "Exclusive Income": item.exclusive,
      "Flexi Income": item.flexi,
      "Pantry Income": item.pantry,
      "Total Income": item.total,
    }));
    downloadCSV(csvData, `DMD-Report-${format(date?.from || new Date(), "yyyy-MM-dd")}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="text-emerald-600" /> Growth Insights
            </h2>
            <p className="text-slate-500">Visual analytics across all revenue streams.</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (date.to ? `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}` : format(date.from, "MMM dd")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="bg-white" onClick={handleExport} disabled={loading || reportData.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* 1. Summary Cards (Now 6 Columns - 2 Rows on smaller screens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-medium text-slate-500 uppercase">Check-ins</CardTitle><User className="h-4 w-4 text-slate-500"></User></CardHeader>
            <CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-slate-400"/> {totalCheckIns}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-medium text-slate-500 uppercase">Packages</CardTitle><Banknote className="h-4 w-4 text-slate-500"></Banknote></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">₱{timesheetTotal.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-xs font-medium text-slate-500 uppercase">Exclusive</CardTitle><Gem className="h-4 w-4 text-slate-500"></Gem></CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">₱{exclusiveTotal.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-medium text-slate-500 uppercase">Flexi</CardTitle><Crown className="h-4 w-4 text-slate-500"></Crown></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">₱{flexiTotal.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-medium text-slate-500 uppercase">Pantry</CardTitle><ShoppingBasket className="h-4 w-4 text-slate-500"></ShoppingBasket></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-600">₱{pantryTotal.toLocaleString()}</div></CardContent>
          </Card>
          {/* TOTAL REVENUE CARD */}
          <Card className="bg-green-100 text-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-medium text-slate-400 uppercase">Total Revenue</CardTitle><Wallet className="h-4 w-4 text-slate-500"></Wallet></CardHeader>
            <CardContent><div className="text-2xl font-bold">₱{grandTotal.toLocaleString()}</div></CardContent>
          </Card>
        </div>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Stacked Bar (2 Cols) */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Daily income sources stacked</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[350px]">
              <ChartContainer config={revenueChartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={reportData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(val) => format(parseISO(val), "MMM dd")} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="timesheet" stackId="a" fill="var(--color-timesheet)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="exclusive" stackId="a" fill="var(--color-exclusive)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="flexi" stackId="a" fill="var(--color-flexi)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pantry" stackId="a" fill="var(--color-pantry)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN: Package Pie + Pantry Best Sellers */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Package Donut Chart */}
            <Card className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle>Package Popularity</CardTitle>
                <CardDescription>Bookings distribution</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0 min-h-[200px]">
                  <ChartContainer config={packageChartConfig} className="mx-auto aspect-square w-full">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie data={packageStats} dataKey="visitors" nameKey="name" innerRadius={50} strokeWidth={5}>
                        <Label content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">{totalPackagesSold}</tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">Total</tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
              </CardContent>
            </Card>

            {/* Pantry Best Sellers List (ADDED BACK) */}
            <Card className="flex-1">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="items-center gap-2">
                  Top Pantry Items
                </CardTitle>
                 <CardDescription>Pantry distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-3">
                  {pantryBestSellers.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No sales data yet.</p>
                  ) : (
                    pantryBestSellers.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-500 text-xs">{item.count} sold</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Traffic & Demographics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Demographics (1 Col) */}
            <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Customer Type</CardTitle>
                  <CardDescription>Type of Customer Checks In</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[250px]">
                    <ChartContainer config={demographicsChartConfig} className="mx-auto aspect-square w-full">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={demographics} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2} />
                            <ChartLegend content={<ChartLegendContent />} className="mt-4"/>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Traffic Line (3 Cols) */}
            <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Check-in Traffic</CardTitle>
                    <CardDescription>Daily foot traffic (includes Hub, Exclusive, Flexi visits)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ChartContainer config={trafficChartConfig} className="w-full h-full">
                        <LineChart data={reportData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(val) => format(parseISO(val), "MMM dd")} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="checkIns" stroke="var(--color-checkIns)" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

        {/* 4. Detailed Table */}
        <div className="bg-white rounded-lg shadow border flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Check-ins</TableHead>
                <TableHead>Hub</TableHead>
                <TableHead>Exclusive</TableHead>
                <TableHead>Flexi</TableHead>
                <TableHead>Pantry</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((item) => (
                  <TableRow key={item.date}>
                    <TableCell className="font-medium text-slate-600">{format(parseISO(item.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-center font-bold text-slate-800">{item.checkIns}</TableCell>
                    <TableCell>₱{item.timesheet.toLocaleString()}</TableCell>
                    <TableCell className={item.exclusive > 0 ? "text-purple-600 font-medium" : "text-slate-400"}>
                        {item.exclusive > 0 ? `₱${item.exclusive.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className={item.flexi > 0 ? "text-orange-600 font-medium" : "text-slate-400"}>
                        {item.flexi > 0 ? `₱${item.flexi.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className={item.pantry > 0 ? "text-emerald-600 font-medium" : "text-slate-400"}>
                        {item.pantry > 0 ? `₱${item.pantry.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">₱{item.total.toLocaleString()}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="p-4 border-t flex justify-between items-center bg-slate-50">
             <span className="text-sm text-slate-500">Page {page + 1} of {totalPages || 1}</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight className="h-4 w-4" /> Next</Button>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
}