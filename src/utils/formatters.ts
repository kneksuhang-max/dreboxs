// Formatter utilities adhering to Indonesian standards and Intl.NumberFormat

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberDotFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return idrFormatter.format(amount);
}

export function formatThousand(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0";
  return numberDotFormatter.format(amount);
}

export function parseThousandToNumber(val: string): number {
  if (!val) return 0;
  // Remove any non-digits
  const clean = val.replace(/\D/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatMonthYear(monthStr?: string): string {
  if (!monthStr) return "Fleksibel";
  try {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return monthStr;
  }
}
