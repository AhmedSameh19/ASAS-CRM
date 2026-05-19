'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, X, Download, PlusCircle, Sparkles, Filter, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { exportToCSV, prospectsToCSV } from '@/lib/export';

type SortField = 'company_name' | 'contact_person' | 'status' | 'industry' | 'created_at';
type SortDir = 'asc' | 'desc';

// Unified Mappings for Premium Visual Tags
const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-[#757682]/10 text-[#757682] dark:bg-gray-800 dark:text-gray-300',
  'MR Scheduled': 'bg-[#00236f]/10 text-[#00236f] dark:bg-blue-900/30 dark:text-blue-400',
  'MR Completed': 'bg-[#4059aa]/10 text-[#4059aa] dark:bg-indigo-900/30 dark:text-indigo-400',
  'Demo Scheduled': 'bg-[#855300]/10 text-[#855300] dark:bg-amber-900/30 dark:text-amber-400',
  'Demo Done': 'bg-[#fea619]/10 text-[#684000] dark:bg-orange-900/30 dark:text-orange-400',
  'Proposal Sent': 'bg-[#6e2c00]/10 text-[#6e2c00] dark:bg-purple-900/30 dark:text-purple-400',
  'Negotiation': 'bg-[#1e3a8a]/10 text-[#1e3a8a] dark:bg-[#1e3a8a]/30 dark:text-[#3b82f6]',
  'Won': 'bg-[#059669]/10 text-[#059669] dark:bg-green-900/30 dark:text-green-400',
  'Lost': 'bg-[#ba1a1a]/10 text-[#ba1a1a] dark:bg-red-900/30 dark:text-red-400',
};

export default function ProspectListView() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const router = useRouter();

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [newProspect, setNewProspect] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: '',
    source: '',
    status: 'New Lead'
  });

  const loadProspects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (industryFilter !== 'All') params.append('industry', industryFilter);
      params.append('sort', sortField);
      params.append('order', sortDir);

      const data = await api.get(`/prospects?${params.toString()}`);
      setProspects(data.prospects || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load prospects list');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, industryFilter]);

  // Load prospects when dependencies change
  useEffect(() => {
    loadProspects();
  }, [page, limit, debouncedSearch, statusFilter, industryFilter, sortField, sortDir]);

  // Server-side filtered array (directly uses loaded prospects)
  const filtered = prospects;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1.5 h-3 w-3 text-outline dark:text-gray-600 inline" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary dark:text-[#3b82f6] inline" />
      : <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary dark:text-[#3b82f6] inline" />;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/prospects', newProspect);
      toast.success('New prospect created successfully');
      setIsAddOpen(false);
      loadProspects();
      setNewProspect({ company_name: '', contact_person: '', email: '', phone: '', industry: '', source: '', status: 'New Lead' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create prospect');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prospect?')) return;
    try {
      await api.delete(`/prospects/${id}`);
      setProspects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Prospect deleted successfully');
    } catch {
      toast.error('Failed to delete prospect');
    }
  };

  const hasFilters = statusFilter !== 'All' || industryFilter !== 'All' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setIndustryFilter('All');
  };

  const statuses = ['New Lead', 'MR Scheduled', 'MR Completed', 'Demo Scheduled', 'Demo Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

  const handleExport = (scope: 'filtered' | 'all') => {
    const data = scope === 'filtered' ? filtered : prospects;
    if (data.length === 0) { toast.error('No data to export'); return; }
    exportToCSV(prospectsToCSV(data), scope === 'filtered' ? 'prospects_filtered' : 'prospects_all');
    toast.success(`Successfully exported ${data.length} records`);
  };

  const renderSkeletons = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-9 bg-surface-container dark:bg-gray-800 rounded flex-1 animate-pulse" />
          <div className="h-9 bg-surface-container dark:bg-gray-800 rounded w-24 animate-pulse" />
          <div className="h-9 bg-surface-container dark:bg-gray-800 rounded w-20 animate-pulse" />
          <div className="h-9 bg-surface-container dark:bg-gray-800 rounded w-12 animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-lg max-w-[1400px] mx-auto p-4 md:p-0">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white tracking-tight">Prospects List</h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1">
            {loading ? 'Fetching prospects...' : `${filtered.length} of ${prospects.length} total leads active.`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* CSV Export Option */}
          <div className="hidden sm:flex items-center rounded-lg border border-outline-variant dark:border-[#1e293b] overflow-hidden bg-surface-container-lowest dark:bg-[#0b1120] shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-r border-outline-variant dark:border-[#1e293b] text-on-surface-variant hover:bg-surface-container-low font-semibold py-2 px-3 text-xs gap-1.5"
              onClick={() => handleExport('filtered')}
            >
              <Download className="h-3.5 w-3.5" />
              {hasFilters ? 'Export Filtered' : 'Export CSV'}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-outline hover:bg-surface-container-low text-[10px] px-2 font-bold uppercase tracking-wider"
                onClick={() => handleExport('all')}
                title="Export all"
              >
                All
              </Button>
            )}
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="flex items-center justify-center gap-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all duration-200">
              <PlusCircle className="h-4 w-4" /> Add Prospect
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] dark:bg-[#0b1120] dark:border-[#1e293b]">
              <DialogHeader>
                <DialogTitle className="font-headline-md text-headline-md text-on-surface dark:text-white">Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-md pt-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Company Name</label>
                  <Input placeholder="TechCorp Ltd" required value={newProspect.company_name} onChange={e => setNewProspect({ ...newProspect, company_name: e.target.value })} className="dark:bg-[#1e293b] dark:border-[#334155]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Contact Person</label>
                  <Input placeholder="Ahmed Sakr" required value={newProspect.contact_person} onChange={e => setNewProspect({ ...newProspect, contact_person: e.target.value })} className="dark:bg-[#1e293b] dark:border-[#334155]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Email Address</label>
                    <Input placeholder="name@company.com" type="email" value={newProspect.email} onChange={e => setNewProspect({ ...newProspect, email: e.target.value })} className="dark:bg-[#1e293b] dark:border-[#334155]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Phone Number</label>
                    <Input placeholder="+20 100 ..." value={newProspect.phone} onChange={e => setNewProspect({ ...newProspect, phone: e.target.value })} className="dark:bg-[#1e293b] dark:border-[#334155]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Industry Sector</label>
                  <Select value={newProspect.industry} onValueChange={v => setNewProspect({ ...newProspect, industry: v || '' })}>
                    <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Select Industry" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F&B">F&B</SelectItem>
                      <SelectItem value="Startup">Startup</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Lead Source</label>
                  <Select value={newProspect.source} onValueChange={v => setNewProspect({ ...newProspect, source: v || '' })}>
                    <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Select Lead Source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Referrals">Referrals</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white">Save Prospect</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-md bg-surface-container-lowest dark:bg-[#0b1120] p-md rounded-lg border border-outline-variant dark:border-[#1e293b] shadow-sm items-end transition-all duration-200">
        <div className="relative flex-1 min-w-[240px] flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Search Leads</label>
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-outline" />
            <input
              type="text"
              placeholder="Search company, contact person, email..."
              className="pl-9 pr-4 py-2 w-full bg-surface-container-low dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-md text-on-surface dark:text-gray-200 transition-all placeholder:text-outline"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-44 flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Status</label>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v || 'All')}>
            <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40 flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Industry</label>
          <Select value={industryFilter} onValueChange={v => setIndustryFilter(v || 'All')}>
            <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Industries</SelectItem>
              {['F&B', 'Startup', 'Retail', 'Other'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-on-surface-variant hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high transition-colors gap-1 text-xs mb-0.5">
            <X className="h-4 w-4" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Main Tabular Canvas */}
      <div className="bg-surface-container-lowest dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] shadow-sm overflow-hidden transition-all duration-200">
        {loading ? renderSkeletons() : filtered.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-surface-container-low dark:bg-gray-900 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-outline" />
            </div>
            <p className="text-on-surface dark:text-gray-300 font-semibold text-lg">
              {hasFilters ? 'No prospects matched filters' : 'No prospects found'}
            </p>
            <p className="text-xs text-outline mt-1 max-w-[280px]">
              {hasFilters ? 'Try modifying your search queries or clearing active filter tags.' : 'Generate your first prospect list element using the Add button above.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: High Density Card List */}
            <div className="block md:hidden divide-y divide-outline-variant/30 dark:divide-gray-800/40">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/prospects/${p.id}`)}
                  className="p-4 active:bg-surface-container-low/50 dark:active:bg-gray-800/10 cursor-pointer flex flex-col gap-2 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-primary dark:text-[#3b82f6] text-sm">
                      {p.company_name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant dark:text-gray-400">
                    <span className="font-medium">Contact: {p.contact_person}</span>
                    {p.industry && (
                      <span className="text-[10px] bg-surface-container-low dark:bg-gray-800 px-1.5 py-0.5 rounded font-semibold text-on-surface-variant">
                        {p.industry}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-surface-container-low/50 dark:bg-gray-900/50">
                  <TableRow className="border-b border-outline-variant dark:border-[#1e293b]">
                    <TableHead className="cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-on-surface-variant" onClick={() => handleSort('company_name')}>
                      Company <SortIcon field="company_name" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-on-surface-variant" onClick={() => handleSort('contact_person')}>
                      Contact <SortIcon field="contact_person" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-on-surface-variant" onClick={() => handleSort('status')}>
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-on-surface-variant" onClick={() => handleSort('industry')}>
                      Industry <SortIcon field="industry" />
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">
                      Source
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden md:table-cell font-bold text-xs uppercase tracking-wider text-on-surface-variant" onClick={() => handleSort('created_at')}>
                      Date Created <SortIcon field="created_at" />
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-on-surface-variant">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-surface-container-low/30 dark:hover:bg-gray-800/20 cursor-pointer border-b border-outline-variant/60 dark:border-[#1e293b]/60 last:border-0 transition-colors"
                      onClick={() => router.push(`/prospects/${p.id}`)}
                    >
                      <TableCell className="font-semibold text-primary dark:text-[#3b82f6] py-3.5">
                        {p.company_name}
                      </TableCell>
                      <TableCell className="text-on-surface dark:text-gray-300 font-medium">
                        {p.contact_person}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-on-surface-variant dark:text-gray-400">
                        {p.industry || <span className="text-outline">-</span>}
                      </TableCell>
                      <TableCell className="text-on-surface-variant dark:text-gray-400 font-medium">
                        {p.source || <span className="text-outline">-</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-outline text-xs">
                        {p.created_at ? new Date(p.created_at).toLocaleString('en-US', { timeZone: 'Africa/Cairo', dateStyle: 'medium' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary dark:text-[#3b82f6] hover:bg-surface-container"
                            onClick={() => router.push(`/prospects/${p.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={(e) => handleDelete(p.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 dark:border-gray-800 px-6 py-4 bg-white dark:bg-[#0b1120] transition-colors rounded-b-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-outline dark:text-gray-400">
                  Showing <span className="font-semibold text-primary dark:text-[#3b82f6]">{total === 0 ? 0 : Math.min(total, (page - 1) * limit + 1)}</span> to{' '}
                  <span className="font-semibold text-primary dark:text-[#3b82f6]">{Math.min(total, page * limit)}</span> of{' '}
                  <span className="font-semibold text-primary dark:text-[#3b82f6]">{total}</span> prospects
                </span>
                <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-outline dark:text-gray-500 font-medium">Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-transparent border border-outline-variant/30 dark:border-gray-800 text-xs font-semibold rounded px-1.5 py-0.5 focus:outline-none focus:border-primary text-gray-700 dark:text-gray-300"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size} className="bg-white dark:bg-[#0b1120]">
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center p-1.5 rounded border border-outline-variant/30 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e293b] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.ceil(total / limit) }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === Math.ceil(total / limit) || Math.abs(p - page) <= 1)
                  .map((p, index, array) => {
                    const showEllipsis = index > 0 && p - array[index - 1] > 1;
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={`h-7 w-7 text-xs font-semibold rounded flex items-center justify-center transition-colors ${page === p
                              ? 'bg-[#00236f] text-white dark:bg-[#3b82f6]'
                              : 'border border-outline-variant/30 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e293b] text-gray-700 dark:text-gray-400'
                            }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
                  disabled={page === Math.ceil(total / limit) || total === 0}
                  className="flex items-center justify-center p-1.5 rounded border border-outline-variant/30 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e293b] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
