import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Updated Generic Pricing Logic
export const calculateDynamicRate = (
  basePrice: number,
  isHourly: boolean,
  inputHours: number,
  isStudent: boolean,
  isExaminee: boolean
) => {
  let rate = 0;

  if (isHourly) {
    rate = basePrice * inputHours;
  } else {
    rate = basePrice;
  }

  // Apply 8% discount if Student OR Examinee
  if (isStudent || isExaminee) {
    rate = rate - (rate * 0.08);
  }

  return Math.round(rate); // Round to nearest peso
};

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // 1. Extract Headers from the first object
  const headers = Object.keys(data[0]);

  // 2. Convert Data to CSV Format
  const csvContent = [
    headers.join(","), // Header Row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle commas inside values by wrapping in quotes
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  // 3. Create Blob and Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}