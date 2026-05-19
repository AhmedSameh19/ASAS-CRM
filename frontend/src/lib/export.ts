/**
 * Converts an array of objects to a downloadable CSV file.
 * Handles commas, quotes, and newlines in values correctly.
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  const escape = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // If value contains comma, quote, or newline — wrap in double quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => headers.map(h => escape(row[h])).join(','))
  ];

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Maps raw prospect DB rows to clean, human-readable CSV columns.
 */
export function prospectsToCSV(prospects: any[]): Record<string, any>[] {
  return prospects.map(p => ({
    'Company Name': p.company_name ?? '',
    'Contact Person': p.contact_person ?? '',
    'Email': p.email ?? '',
    'Phone': p.phone ?? '',
    'Industry': p.industry ?? '',
    'Company Size': p.company_size ?? '',
    'Source': p.source ?? '',
    'Status': p.status ?? '',
    'Priority': p.priority ?? '',
    'Estimated Value (EGP)': p.estimated_value ?? '',
    'Expected Close Date': p.expected_close_date
      ? new Date(p.expected_close_date).toLocaleDateString()
      : '',
    'Notes': p.notes ?? '',
    'Created At': p.created_at
      ? new Date(p.created_at).toLocaleDateString()
      : '',
  }));
}

/**
 * Maps raw activity DB rows to clean, human-readable CSV columns.
 */
export function activitiesToCSV(activities: any[], companyName: string): Record<string, any>[] {
  return activities.map(a => ({
    'Company': companyName,
    'Activity Type': a.activity_type ?? '',
    'Date': a.activity_date
      ? new Date(a.activity_date).toLocaleString()
      : '',
    'Duration (min)': a.duration ?? '',
    'Notes': a.notes ?? '',
    'Outcome': a.outcome ?? '',
    'Next Steps': a.next_steps ?? '',
    'Logged At': a.created_at
      ? new Date(a.created_at).toLocaleDateString()
      : '',
  }));
}
