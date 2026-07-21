// CURRENTLY DOESN'T HAVE ANY FUNCTIONALITY
export function formatItemSku(id: string) {
  const suffix = id.replace(/\W/g, "").slice(-4).toUpperCase().padStart(4, "0");
  return `HOS-${suffix}`;
}

export function formatItemPrice(
  value: number | string | null | undefined | { toString(): string },
) {
  const num = value == null ? 0 : Number(String(value));
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(num);
}

export function formatItemDate(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

// change "1000000" into "10.000.000"
export const formatThousand = (value: string | number): string => {
  // Return empty string if value is null, undefined, or empty
  if (value === undefined || value === null || value === "") return "";

  const stringValue = value.toString();

  // Check if the value starts with or contains a negative sign
  const isNegative = stringValue.startsWith("-");

  // Strip everything that is not a digit
  const cleanDigits = stringValue.replace(/\D/g, "");

  // If no digits remain after stripping, return an empty string or just the minus sign
  if (!cleanDigits) return isNegative ? "-" : "";

  // Format the absolute numeric value using the Indonesian locale
  const formattedNumber = new Intl.NumberFormat("id-ID").format(
    Number(cleanDigits),
  );

  // Re-attach the negative sign if it was present
  return isNegative ? `-${formattedNumber}` : formattedNumber;
};

// change "10.000.000" into 10000000 for database
export const unformatThousand = (value: string): number => {
  if (!value) return 0;
  return Number(value.replace(/\./g, "")); // Deleting all the "."
};
