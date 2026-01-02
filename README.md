# DMD Study Hub Dashboard 📚🚀

A comprehensive, all-in-one management system built for **DMD Co-working Space & Study Hub**. This web application handles daily operations, point-of-sale (POS) for the pantry, membership tracking, and detailed financial analytics.

## ✨ Key Features

### 🏢 Operations & Dashboard
*   **Real-time Check-ins:** Fast entry for students, examinees, and regular guests.
*   **Dynamic Pricing:** Auto-calculates fees based on package type (Hourly, Focus Saver, Power Saver, Squad Saver) with auto-discounts for students.
*   **Time Tracking:** Auto-calculates check-out times and handles time extensions with fee adjustments.
*   **Live Occupancy:** Visual progress bar showing real-time seat availability.

### 🛒 Pantry POS & Inventory
*   **Point of Sale:** Streamlined checkout for snacks and drinks.
*   **Inventory Management:** Add, edit, and track stock levels.
*   **Searchable Menu:** Quick lookup for items during checkout.

### 👑 Membership & Loyalty
*   **Flexi Memberships:** Track "Flexi Grind" (Time-bank based) and "Monthly Focus" subscriptions.
*   **Usage Logging:** Automatically deducts hours from members' balances upon checkout.
*   **Loyalty Leaderboard:** Gamified ranking of top customers based on visit frequency.

### 💎 Exclusive Bookings
*   **Space Reservation:** Manage bookings for exclusive/whole-hub usage.
*   **Automated Discounts:** Applies 18% discount for morning slots automatically.
*   **Pax Management:** Track guest lists and attendee counts.

### 📊 Analytics & Reports
*   **Visual Data:** Interactive charts (Stacked Bar, Line, Donut) for revenue trends and traffic.
*   **Demographics:** Breakdown of Students vs. Examinees vs. Regulars vs. Members.
*   **Financial Reports:** Daily aggregation of Hub, Pantry, Exclusive, and Flexi revenue.
*   **Export:** One-click download of reports to CSV for accounting.

### 🔒 Security
*   **Authentication:** Secure Admin Login via Supabase Auth.
*   **Role-Based Access:** Row Level Security (RLS) ensures data is protected.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Date Handling:** [date-fns](https://date-fns.org/)
*   **Notifications:** [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18 or higher)
*   A Supabase Account

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/dmd-study-hub.git
cd dmd-study-hub
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Setup
Create a .env.local file in the root directory and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Database Setup (Supabase)
Go to your Supabase SQL Editor and run the following queries to set up the schema:

```sql
-- 1. Bookings (Timesheet)
create table dmd_bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  seat_number text,
  package_type text not null,
  check_in_time timestamp with time zone default now(),
  check_out_time timestamp with time zone,
  duration_hours numeric,
  amount_paid numeric not null,
  status text default 'Active',
  rentals text,
  notes text,
  is_student boolean default false,
  is_board_examinee boolean default false,
  is_group boolean default false
);

-- 2. Pantry
create table dmd_pantry_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  price numeric default 0,
  is_available boolean default true
);

create table dmd_pantry_transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  items_summary text,
  total_quantity integer default 1,
  total_amount numeric not null
);

-- 3. Packages
create table dmd_packages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  duration numeric default 0,
  is_hourly boolean default false
);

-- 4. Exclusive Bookings
create table dmd_exclusive_bookings (
  id uuid default gen_random_uuid() primary key,
  client_name text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  duration_hours numeric,
  pax integer default 1,
  guest_list text,
  amount_paid numeric not null,
  status text default 'Confirmed',
  notes text
);

-- 5. Flexi Membership
create table dmd_flexi_accounts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text not null,
  package_type text not null,
  start_date date not null,
  expiry_date date not null,
  remaining_hours numeric,
  amount_paid numeric not null,
  status text default 'Inactive',
  last_check_in timestamp with time zone,
  notes text
);

create table dmd_flexi_logs (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references dmd_flexi_accounts on delete cascade,
  check_in_time timestamp with time zone not null,
  check_out_time timestamp with time zone,
  duration_hours numeric
);

-- 6. Enable RLS (Run for all tables)
ALTER TABLE dmd_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_pantry_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_exclusive_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_flexi_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmd_flexi_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies (Example for bookings, repeat for others)
CREATE POLICY "Allow authenticated users" ON dmd_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- (Repeat CREATE POLICY for all tables listed above)
```

### 6. Admin User Setup
Since there is no public sign-up page:

1. Go to Supabase Dashboard -> Authentication.
2. Manually Add User (e.g., admin@dmd.com).
3. Use these credentials to log in to the app.

### 7. Run 
```bash
npm run dev
```

## 📱 Mobile Responsiveness
The application is fully responsive.

1. Desktop: Features a persistent sidebar for easy navigation.
2. Mobile: Uses a collapsible Sheet (Hamburger menu) to maximize screen real estate.

## 📂 Project Structure
├── src/
│   ├── app/                 # Next.js App Router Pages
│   │   ├── flexi/           # Flexi Membership Page
│   │   ├── exclusive/       # Exclusive Booking Page
│   │   ├── login/           # Auth Page
│   │   ├── package/         # Package Management
│   │   ├── pantry/          # Pantry POS
│   │   ├── reports/         # Analytics
│   │   └── page.tsx         # Main Dashboard
│   ├── components/          # React Components
│   │   ├── ui/              # Shadcn Reusable Components
│   │   ├── app-sidebar.tsx  # Main Navigation
│   │   └── ...forms         # Booking/Registration Forms
│   └── lib/                 # Utilities (Supabase Client, Helpers)
├── public/                  # Static Assets (Logos)
└── tailwind.config.ts       # Styling Configuration

## 📄 License
This project is proprietary software developed for **DMD Co-Working Space & Study Hub**.