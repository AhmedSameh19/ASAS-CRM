'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportToCSV, activitiesToCSV } from '@/lib/export';
import { 
  ArrowLeft, User, Mail, Phone, Building2, Loader2, Trash, 
  Upload, Download, Plus, Clock, FileText, Calendar, DollarSign, 
  ShieldCheck, Sparkles, MessageSquare, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProspectDetailViewProps {
  prospectId: string;
}

export default function ProspectDetailView({ prospectId }: ProspectDetailViewProps) {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'documents'>('details');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealEdit, setDealEdit] = useState<{
    estimated_value: string;
    expected_close_date: string;
    priority: string;
  } | null>(null);

  const [newActivity, setNewActivity] = useState({
    activity_type: '',
    activity_date: new Date().toISOString().slice(0, 16),
    duration: 30,
    notes: '',
    outcome: '',
    next_steps: ''
  });

  const [documents, setDocuments] = useState<any[]>([]);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ document_type: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.get(`/prospects/${prospectId}`);
      setData(result);
      // Initialize edit fields
      setDealEdit({
        estimated_value: result.prospect?.estimated_value ?? '',
        expected_close_date: result.prospect?.expected_close_date
          ? result.prospect.expected_close_date.slice(0, 10)
          : '',
        priority: result.prospect?.priority ?? 'Medium',
      });
      // Load documents
      const docsRes = await api.get(`/prospects/${prospectId}/documents`);
      setDocuments(docsRes.documents || []);
    } catch (err: any) {
      toast.error('Failed to load prospect detail metrics');
      router.push('/prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prospectId) {
      loadData();
    }
  }, [prospectId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/prospects/${prospectId}`, { status: newStatus });
      toast.success(`Prospect moved to stage: ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveDeal = async () => {
    if (!dealEdit) return;
    try {
      setSavingDeal(true);
      await api.put(`/prospects/${prospectId}`, {
        estimated_value: dealEdit.estimated_value === '' ? null : Number(dealEdit.estimated_value),
        expected_close_date: dealEdit.expected_close_date || null,
        priority: dealEdit.priority,
      });
      toast.success('Deal details updated successfully');
      loadData();
    } catch (err: any) {
      toast.error('Failed to update deal values');
    } finally {
      setSavingDeal(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this prospect?')) return;
    try {
      await api.delete(`/prospects/${prospectId}`);
      toast.success('Prospect deleted successfully');
      router.push('/prospects');
    } catch (err: any) {
      toast.error('Failed to delete prospect');
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/activities`, {
        ...newActivity,
        prospect_id: Number(prospectId),
        activity_date: new Date(newActivity.activity_date).toISOString()
      });
      toast.success('Sales activity logged successfully');
      setIsActivityOpen(false);
      loadData();
      setNewActivity({
        activity_type: '',
        activity_date: new Date().toISOString().slice(0, 16),
        duration: 30,
        notes: '',
        outcome: '',
        next_steps: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to log activity');
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newDoc.document_type) {
      toast.error('Please select both a file and document type');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', newDoc.document_type);
      formData.append('description', newDoc.description);

      await api.post(`/prospects/${prospectId}/documents`, formData);
      toast.success('Document uploaded successfully');
      setIsDocOpen(false);
      setNewDoc({ document_type: '', description: '' });
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document removed');
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownloadDoc = async (docId: string) => {
    try {
      const res = await api.get(`/documents/${docId}/download`);
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err: any) {
      toast.error('Failed to resolve document URL');
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-lg max-w-5xl mx-auto p-4 md:p-0">
        <div className="h-12 bg-surface-container dark:bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="space-y-lg">
            <div className="h-44 bg-surface-container dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-64 bg-surface-container dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="md:col-span-2 h-96 bg-surface-container dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const p = data.prospect;
  const activities = data.activities || [];
  const statuses = ['New Lead', 'MR Scheduled', 'MR Completed', 'Demo Scheduled', 'Demo Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto p-4 md:p-0">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md mb-md">
        <div className="flex items-center gap-md min-w-0">
          <button 
            onClick={() => router.push('/prospects')}
            className="p-2 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] hover:bg-surface-container dark:hover:bg-[#1e293b] rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-outline" />
          </button>
          <div className="min-w-0">
            <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white truncate" title={p.company_name}>
              {p.company_name}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1">
              Lead contact: <span className="font-bold text-on-surface dark:text-white">{p.contact_person}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={p.status} onValueChange={v => handleStatusChange(v || 'New Lead')}>
            <SelectTrigger className="w-[180px] bg-[#e1e8fd] text-[#00236f] border-[#b6c4ff] dark:bg-[#1e3a8a]/20 dark:text-[#3b82f6] dark:border-[#1e3a8a]/50 font-bold uppercase tracking-wider text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button 
            variant="destructive" 
            size="sm" 
            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 border border-red-100 dark:border-red-950/50 p-2.5 rounded-lg" 
            onClick={handleDelete}
            title="Delete prospect"
          >
            <Trash className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="flex lg:hidden border-b border-outline-variant dark:border-gray-800 mb-4 select-none">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-[#00236f] text-[#00236f] dark:border-[#3b82f6] dark:text-[#3b82f6]'
              : 'border-transparent text-on-surface-variant dark:text-gray-400'
          }`}
        >
          Details & Deal
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-[#00236f] text-[#00236f] dark:border-[#3b82f6] dark:text-[#3b82f6]'
              : 'border-transparent text-on-surface-variant dark:text-gray-400'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-[#00236f] text-[#00236f] dark:border-[#3b82f6] dark:text-[#3b82f6]'
              : 'border-transparent text-on-surface-variant dark:text-gray-400'
          }`}
        >
          Documents
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Columns (Info + Value) */}
        <div className="lg:col-span-1 space-y-lg">
          <div className={activeTab === 'details' ? 'block space-y-lg' : 'hidden lg:block lg:space-y-lg'}>
            {/* Contact Details Card */}
            <Card className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="bg-surface-container-low/40 dark:bg-gray-900/30 border-b border-outline-variant dark:border-[#1e293b]">
                <CardTitle className="text-xs font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-md pt-md">
                <div className="flex items-center gap-3 text-body-md text-on-surface dark:text-gray-300">
                  <div className="bg-primary/5 p-2 rounded-lg text-primary dark:text-[#3b82f6]">
                    <User className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Contact Person</p>
                    <p className="font-semibold">{p.contact_person}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-body-md text-on-surface dark:text-gray-300">
                  <div className="bg-primary/5 p-2 rounded-lg text-primary dark:text-[#3b82f6]">
                    <Mail className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Email</p>
                    <p className="font-semibold">{p.email || <span className="text-outline font-normal">-</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-body-md text-on-surface dark:text-gray-300">
                  <div className="bg-primary/5 p-2 rounded-lg text-primary dark:text-[#3b82f6]">
                    <Phone className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Phone</p>
                    <p className="font-semibold">{p.phone || <span className="text-outline font-normal">-</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-body-md text-on-surface dark:text-gray-300">
                  <div className="bg-primary/5 p-2 rounded-lg text-primary dark:text-[#3b82f6]">
                    <Building2 className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Industry</p>
                    <p className="font-semibold">{p.industry || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-body-md text-on-surface dark:text-gray-300">
                  <div className="bg-primary/5 p-2 rounded-lg text-primary dark:text-[#3b82f6]">
                    <Sparkles className="h-4 w-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Source</p>
                    <p className="font-semibold">{p.source || <span className="text-outline font-normal">-</span>}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal values Card */}
            <Card className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="bg-surface-container-low/40 dark:bg-gray-900/30 border-b border-outline-variant dark:border-[#1e293b]">
                <CardTitle className="text-xs font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Deal Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-md pt-md">
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold tracking-wider">Estimated Value (EGP)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={dealEdit?.estimated_value ?? ''}
                    onChange={e => setDealEdit(d => d ? {...d, estimated_value: e.target.value} : d)}
                    className="font-bold dark:bg-[#1e293b] dark:border-[#334155]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold tracking-wider">Expected Close Date</label>
                  <input
                    type="date"
                    value={dealEdit?.expected_close_date ?? ''}
                    onChange={e => setDealEdit(d => d ? {...d, expected_close_date: e.target.value} : d)}
                    className="flex h-10 w-full rounded-md border border-outline-variant dark:border-[#334155] bg-surface-container-lowest dark:bg-[#1e293b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold tracking-wider">Priority Level</label>
                  <Select
                    value={dealEdit?.priority ?? 'Medium'}
                    onValueChange={v => setDealEdit(d => d ? {...d, priority: v || 'Medium'} : d)}
                  >
                    <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155] font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="High">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSaveDeal}
                  disabled={savingDeal}
                  className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white mt-2 transition-all duration-200"
                >
                  {savingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deal Info'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={activeTab === 'documents' ? 'block' : 'hidden lg:block'}>
            {/* Documents Card */}
            <Card className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="bg-surface-container-low/40 dark:bg-gray-900/30 border-b border-outline-variant dark:border-[#1e293b] flex flex-row items-center justify-between py-3">
                <CardTitle className="text-xs font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documents
                </CardTitle>
                <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
                  <DialogTrigger 
                    render={
                      <button className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary dark:text-[#3b82f6] hover:underline">
                        <Upload className="h-3 w-3"/> Upload
                      </button>
                    } 
                  />
                  <DialogContent className="bg-white dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] sm:max-w-[440px] w-full">
                    <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
                    <form onSubmit={handleDocUpload} className="space-y-md pt-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Document Type</label>
                        <Select required value={newDoc.document_type} onValueChange={v => setNewDoc({...newDoc, document_type: v || ''})}>
                          <SelectTrigger><SelectValue placeholder="Document Type" /></SelectTrigger>
                          <SelectContent>
                            {['Contract', 'NDA', 'Proposal', 'Invoice', 'Other'].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Select File</label>
                        <Input 
                          type="file" 
                          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                          required
                          className="dark:bg-[#1e293b] dark:border-[#334155]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Description</label>
                        <Input 
                          placeholder="Description (Optional)" 
                          value={newDoc.description}
                          onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                          className="dark:bg-[#1e293b] dark:border-[#334155]"
                        />
                      </div>
                      <Button type="submit" disabled={uploading} className="w-full bg-primary hover:bg-primary-container text-white">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Document'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-sm pt-md">
                {documents.length === 0 ? (
                  <div className="text-center py-6">
                    <FileSpreadsheet className="h-8 w-8 text-outline/30 mx-auto mb-2" />
                    <p className="text-xs text-outline font-medium">No documents uploaded yet.</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-surface-container-low rounded-lg border border-outline-variant/30 group transition-all">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-primary/5 rounded text-primary">
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate dark:text-gray-200" title={doc.file_name}>{doc.file_name}</p>
                          <p className="text-[9px] text-outline uppercase font-bold tracking-wider">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-on-surface-variant hover:text-primary" onClick={() => handleDownloadDoc(doc.id)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDeleteDoc(doc.id)}>
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Area (Activity logger) */}
        <div className={`lg:col-span-2 space-y-lg ${activeTab === 'timeline' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Sales Timeline & Activities
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:inline-flex h-8 px-3 text-xs gap-1.5 dark:border-[#1e293b] font-semibold text-on-surface-variant"
                onClick={() => {
                  if (activities.length === 0) {
                    toast.error('No tracked activities to export');
                    return;
                  }
                  exportToCSV(activitiesToCSV(activities, p.company_name), `${p.company_name}_activities`);
                  toast.success('Timeline exported successfully');
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Export Timeline
              </Button>
              <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
                <DialogTrigger 
                  render={
                    <button className="flex items-center justify-center gap-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm">
                      <Plus className="h-3.5 w-3.5 mr-0.5"/> Log Activity
                    </button>
                  } 
                />
                <DialogContent className="bg-white dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] sm:max-w-[440px] w-full">
                  <DialogHeader><DialogTitle>Log Call/Meeting</DialogTitle></DialogHeader>
                  <form onSubmit={handleActivitySubmit} className="space-y-md pt-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Activity Type</label>
                      <Select required value={newActivity.activity_type} onValueChange={v => setNewActivity({...newActivity, activity_type: v || ''})}>
                        <SelectTrigger><SelectValue placeholder="Activity Type" /></SelectTrigger>
                        <SelectContent>
                          {['Market Research Interview', 'Follow-up Call', 'Demo', 'Proposal Sent', 'Meeting', 'Email', 'Note'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Date & Time</label>
                      <input 
                        type="datetime-local" 
                        className="flex h-10 w-full rounded-md border border-outline-variant dark:border-[#334155] bg-surface-container-lowest dark:bg-[#1e293b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                        required
                        value={newActivity.activity_date}
                        onChange={e => setNewActivity({...newActivity, activity_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Activity Notes</label>
                      <Textarea 
                        placeholder="Log detailed notes from interaction..." 
                        className="min-h-[100px] dark:bg-[#1e293b] dark:border-[#334155]"
                        value={newActivity.notes}
                        onChange={e => setNewActivity({...newActivity, notes: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Next Action Steps</label>
                      <Textarea 
                        placeholder="Expected deliverables, timeline commitments, or scheduling items..." 
                        className="dark:bg-[#1e293b] dark:border-[#334155]"
                        value={newActivity.next_steps}
                        onChange={e => setNewActivity({...newActivity, next_steps: e.target.value})}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white">Save Action Item</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-md">
            {activities.length === 0 ? (
              <Card className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] border-dashed">
                <CardContent className="p-12 text-center text-outline flex flex-col items-center">
                  <div className="bg-surface-container-low dark:bg-gray-900 p-3 rounded-full mb-3 text-outline">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-on-surface dark:text-gray-200">No events logged in the timeline</p>
                  <p className="text-xs mt-1">Record meetings, research discoveries, and follow-ups to track historical context.</p>
                </CardContent>
              </Card>
            ) : (
              activities.map((act: any) => (
                <Card key={act.id} className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-0.5 bg-primary/5 dark:bg-blue-900/30 p-2.5 rounded-full h-9 w-9 flex items-center justify-center text-primary dark:text-[#3b82f6] flex-shrink-0">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-bold text-on-surface dark:text-white truncate">{act.activity_type}</h4>
                        <span className="text-[10px] uppercase font-bold text-outline bg-surface-container-low dark:bg-gray-800 px-2 py-0.5 rounded border dark:border-gray-700 whitespace-nowrap">
                          {new Date(act.activity_date).toLocaleString('en-US', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      {act.notes && <p className="text-body-md text-on-surface-variant dark:text-gray-300 leading-relaxed font-medium">{act.notes}</p>}
                      {act.next_steps && (
                        <div className="mt-3 bg-[#e1e8fd]/20 dark:bg-blue-900/10 border-l-2 border-primary dark:border-[#3b82f6] p-3 rounded-r text-xs">
                          <span className="font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider text-[9px] block mb-1">Expected Deliverable / Next Step</span>
                          <p className="text-on-surface-variant dark:text-gray-300">{act.next_steps}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
