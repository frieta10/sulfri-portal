/**
 * Escapes a CSV field value
 * Wraps in quotes if the value contains commas, quotes, or newlines
 */
function escapeCSVField(value: string | null | undefined): string {
  if (value === null || value === undefined) return ""

  const stringValue = String(value)

  // If field contains comma, double quote, or newline, wrap in quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generates a CSV string from an array of objects
 * @param data - Array of objects to convert
 * @param columns - Column definitions with key and header
 * @returns CSV string
 */
export function generateCSV(
  data: Record<string, any>[],
  columns: { key: string; header: string }[]
): string {
  // Header row
  const headerRow = columns.map((col) => escapeCSVField(col.header)).join(",")

  // Data rows
  const dataRows = data.map((row) =>
    columns.map((col) => escapeCSVField(row[col.key])).join(",")
  )

  return [headerRow, ...dataRows].join("\n")
}
