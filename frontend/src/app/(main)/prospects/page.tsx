'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search, Eye, ArrowUpDown, ArrowUp, ArrowDown, X, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { exportToCSV, prospectsToCSV } from '@/lib/export';

import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

type SortField = 'company_name' | 'contact_person' | 'status' | 'industry' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  'New Lead':       'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'MR Scheduled':   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'MR Completed':   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Demo Scheduled': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Demo Done':      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Proposal Sent':  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Negotiation':    'bg-[#e1e8fd] text-[#1e3a8a] dark:bg-[#1e3a8a]/30 dark:text-[#3b82f6]',
  'Won':            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Lost':           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const router = useRouter();

  const [newProspect, setNewProspect] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: '',
    status: 'New Lead'
  });

  const loadProspects = async () => {
    try {
      setLoading(true);
      const data = await api.get('/prospects?limit=500');
      setProspects(data.prospects || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, []);

  // Client-side filtering + sorting
  const filtered = useMemo(() => {
    let result = [...prospects];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.company_name?.toLowerCase().includes(q) ||
          p.contact_person?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
      );
    }
    if (statusFilter !== 'All') result = result.filter((p) => p.status === statusFilter);
    if (industryFilter !== 'All') result = result.filter((p) => p.industry === industryFilter);

    result.sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return result;
  }, [prospects, search, statusFilter, industryFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-300 dark:text-gray-700 inline" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-[#1e3a8a] dark:text-[#3b82f6] inline" />
      : <ArrowDown className="ml-1 h-3 w-3 text-[#1e3a8a] dark:text-[#3b82f6] inline" />;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/prospects', newProspect);
      toast.success('Prospect added');
      setIsAddOpen(false);
      loadProspects();
      setNewProspect({ company_name: '', contact_person: '', email: '', phone: '', industry: '', status: 'New Lead' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add prospect');
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
    toast.success(`Exported ${data.length} prospect${data.length !== 1 ? 's' : ''} to CSV`);
  };

  const renderSkeletons = () => (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b] dark:text-white tracking-tight">Prospects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading prospects...' : `${filtered.length} of ${prospects.length} prospects matched`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-200 dark:border-[#1e293b] overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-r border-gray-200 dark:border-[#1e293b] text-gray-600 dark:text-gray-400 hover:text-[#1e3a8a] dark:hover:text-[#3b82f6] hover:bg-[#f1f3ff] dark:hover:bg-[#1e293b] gap-1.5"
              onClick={() => handleExport('filtered')}
              title={hasFilters ? 'Export current filtered view' : 'Export all prospects'}
            >
              <Download className="h-4 w-4" />
              {hasFilters ? 'Export Filtered' : 'Export CSV'}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-gray-500 dark:text-gray-500 hover:text-[#1e3a8a] dark:hover:text-[#3b82f6] hover:bg-[#f1f3ff] dark:hover:bg-[#1e293b] text-xs px-2"
                onClick={() => handleExport('all')}
                title="Export all prospects"
              >
                All
              </Button>
            )}
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#1e3a8a] hover:bg-[#00236f] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> Add Prospect
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Prospect</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <Input placeholder="Company Name" required value={newProspect.company_name} onChange={e => setNewProspect({...newProspect, company_name: e.target.value})} />
              <Input placeholder="Contact Person" required value={newProspect.contact_person} onChange={e => setNewProspect({...newProspect, contact_person: e.target.value})} />
              <Input placeholder="Email" type="email" value={newProspect.email} onChange={e => setNewProspect({...newProspect, email: e.target.value})} />
              <Input placeholder="Phone" value={newProspect.phone} onChange={e => setNewProspect({...newProspect, phone: e.target.value})} />
              <Select value={newProspect.industry} onValueChange={v => setNewProspect({...newProspect, industry: v || ''})}>
                <SelectTrigger><SelectValue placeholder="Select Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F&B">F&B</SelectItem>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full bg-[#1e3a8a] dark:bg-[#3b82f6]">Save Prospect</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-[#0b1120] p-4 rounded-lg border border-[#E5E7EB] dark:border-[#1e293b] shadow-sm items-center transition-colors">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-600" />
          <Input placeholder="Search company, email, phone..." className="pl-9 dark:bg-[#1e293b] dark:border-[#334155]" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-44">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v || 'All')}>
            <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={industryFilter} onValueChange={v => setIndustryFilter(v || 'All')}>
            <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Industries</SelectItem>
              {['F&B', 'Startup', 'Retail', 'Other'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0b1120] rounded-lg border border-[#E5E7EB] dark:border-[#1e293b] shadow-sm overflow-hidden transition-colors">
        {loading ? renderSkeletons() : filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-300 dark:text-gray-700" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {hasFilters ? 'No prospects match your search.' : 'No prospects found.'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              {hasFilters ? 'Try adjusting your filters or search query.' : 'Add your first lead to get started.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('company_name')}>
                  Company <SortIcon field="company_name" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('contact_person')}>
                  Contact <SortIcon field="contact_person" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('industry')}>
                  Industry <SortIcon field="industry" />
                </TableHead>
                <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('created_at')}>
                  Created <SortIcon field="created_at" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer border-b dark:border-[#1e293b] last:border-0 transition-colors"
                    onClick={() => router.push(`/prospects/${p.id}`)}
                  >
                    <TableCell className="font-medium text-[#1e3a8a] dark:text-[#3b82f6]">{p.company_name}</TableCell>
                    <TableCell className="dark:text-gray-300">{p.contact_person}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-gray-400">{p.industry || <span className="text-gray-400 dark:text-gray-700">-</span>}</TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-500 text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="dark:text-gray-400 dark:hover:text-white" onClick={() => router.push(`/prospects/${p.id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
