"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, User, Mail, Phone, Building2, Loader2, Trash, Upload, Download, Plus, Clock, FileText } from 'lucide-react';

export default function ProspectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      const result = await api.get(`/prospects/${id}`);
      setData(result);
      // Initialise deal edit state from fresh data
      setDealEdit({
        estimated_value: result.prospect?.estimated_value ?? '',
        expected_close_date: result.prospect?.expected_close_date
          ? result.prospect.expected_close_date.slice(0, 10)
          : '',
        priority: result.prospect?.priority ?? 'Medium',
      });
      // Load documents
      const docsRes = await api.get(`/prospects/${id}/documents`);
      setDocuments(docsRes.documents || []);
    } catch (err: any) {
      toast.error('Failed to load prospect details');
      router.push('/prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/prospects/${id}`, { status: newStatus });
      toast.success('Status updated');
      loadData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveDeal = async () => {
    if (!dealEdit) return;
    try {
      setSavingDeal(true);
      await api.put(`/prospects/${id}`, {
        estimated_value: dealEdit.estimated_value === '' ? null : Number(dealEdit.estimated_value),
        expected_close_date: dealEdit.expected_close_date || null,
        priority: dealEdit.priority,
      });
      toast.success('Deal details saved');
      loadData();
    } catch (err: any) {
      toast.error('Failed to save deal details');
    } finally {
      setSavingDeal(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prospect?')) return;
    try {
      await api.delete(`/prospects/${id}`);
      toast.success('Prospect deleted');
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
        prospect_id: Number(id),
        activity_date: new Date(newActivity.activity_date).toISOString()
      });
      toast.success('Activity logged');
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
      toast.error('File and document type are required');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', newDoc.document_type);
      formData.append('description', newDoc.description);

      await api.post(`/prospects/${id}/documents`, formData);
      toast.success('Document uploaded');
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
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
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
      toast.error('Failed to download document');
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );

  if (loading || !data) {
    return renderSkeletons();
  }

  const p = data.prospect;
  const activities = data.activities || [];
  const statuses = ['New Lead', 'MR Scheduled', 'MR Completed', 'Demo Scheduled', 'Demo Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="outline" size="icon" className="dark:border-[#1e293b]" onClick={() => router.push('/prospects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-[#141b2b] dark:text-white truncate" title={p.company_name}>{p.company_name}</h1>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={p.status} onValueChange={v => handleStatusChange(v || 'New Lead')}>
            <SelectTrigger className="w-[180px] bg-[#e1e8fd] text-[#1e3a8a] border-[#b6c4ff] dark:bg-[#1e3a8a]/20 dark:text-[#3b82f6] dark:border-[#1e3a8a]/50 font-medium transition-colors">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button variant="destructive" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-100 dark:border-red-900/50" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="dark:bg-[#0b1120] dark:border-[#1e293b] overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/30 border-b dark:border-[#1e293b]">
              <CardTitle className="text-sm font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center text-sm dark:text-gray-300">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded mr-3">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                </div>
                {p.contact_person}
              </div>
              <div className="flex items-center text-sm dark:text-gray-300">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded mr-3">
                  <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                </div>
                {p.email || <span className="text-gray-400">-</span>}
              </div>
              <div className="flex items-center text-sm dark:text-gray-300">
                <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded mr-3">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400"/>
                </div>
                {p.phone || <span className="text-gray-400">-</span>}
              </div>
              <div className="flex items-center text-sm dark:text-gray-300">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded mr-3">
                  <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400"/>
                </div>
                {p.industry || 'Unknown Industry'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-[#0b1120] dark:border-[#1e293b] overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/30 border-b dark:border-[#1e293b]">
              <CardTitle className="text-sm font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider">Deal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block mb-1.5">Est. Value (EGP)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={dealEdit?.estimated_value ?? ''}
                  onChange={e => setDealEdit(d => d ? {...d, estimated_value: e.target.value} : d)}
                  className="font-medium dark:bg-[#1e293b] dark:border-[#334155]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block mb-1.5">Expected Close Date</label>
                <input
                  type="date"
                  value={dealEdit?.expected_close_date ?? ''}
                  onChange={e => setDealEdit(d => d ? {...d, expected_close_date: e.target.value} : d)}
                  className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#1e293b] dark:border-[#334155] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block mb-1.5">Priority</label>
                <Select
                  value={dealEdit?.priority ?? 'Medium'}
                  onValueChange={v => setDealEdit(d => d ? {...d, priority: v || 'Medium'} : d)}
                >
                  <SelectTrigger className="dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveDeal}
                disabled={savingDeal}
                className="w-full bg-[#1e3a8a] dark:bg-[#3b82f6] hover:bg-[#00236f] dark:hover:bg-[#2563eb] mt-2 transition-all shadow-sm"
              >
                {savingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deal Details'}
              </Button>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#0b1120] dark:border-[#1e293b] overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/30 border-b dark:border-[#1e293b] flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-bold text-[#00236f] dark:text-[#3b82f6] uppercase tracking-wider">Documents</CardTitle>
              <Dialog open={isDocOpen} onOpenChange={setIsDocOpen}>
                <DialogTrigger className="h-7 px-2 text-[10px] uppercase font-bold text-[#1e3a8a] dark:text-[#3b82f6] hover:bg-[#1e3a8a]/5 dark:hover:bg-[#3b82f6]/10">
                    <Upload className="h-3 w-3 mr-1"/> Upload
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                  <form onSubmit={handleDocUpload} className="space-y-4 pt-4">
                    <Select required value={newDoc.document_type} onValueChange={v => setNewDoc({...newDoc, document_type: v || ''})}>
                      <SelectTrigger><SelectValue placeholder="Document Type" /></SelectTrigger>
                      <SelectContent>
                        {['Contract', 'NDA', 'Proposal', 'Invoice', 'Other'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                    <Input 
                      placeholder="Description (Optional)" 
                      value={newDoc.description}
                      onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                    />
                    <Button type="submit" disabled={uploading} className="w-full bg-[#1e3a8a] dark:bg-[#3b82f6]">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Document'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {documents.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-gray-200 dark:text-gray-800 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-500">No documents yet.</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-gray-800 group transition-all">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                        <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate dark:text-gray-200" title={doc.file_name}>{doc.file_name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{doc.document_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 dark:text-gray-400" onClick={() => handleDownloadDoc(doc.id)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 dark:text-red-900/70 dark:hover:text-red-400" onClick={() => handleDeleteDoc(doc.id)}>
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#141b2b] dark:text-white">Activity Log</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs gap-1.5 dark:border-[#1e293b] dark:text-gray-300"
                onClick={() => {
                  if (activities.length === 0) {
                    toast.error('No activities to export');
                    return;
                  }
                  exportToCSV(activitiesToCSV(activities, p.company_name), `${p.company_name}_activities`);
                  toast.success('Activities exported');
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
                <DialogTrigger className="bg-[#1e3a8a] dark:bg-[#3b82f6] hover:bg-[#00236f] dark:hover:bg-[#2563eb] h-8 px-3 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5"/> Log Activity
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                  <form onSubmit={handleActivitySubmit} className="space-y-4 pt-4">
                    <Select required value={newActivity.activity_type} onValueChange={v => setNewActivity({...newActivity, activity_type: v || ''})}>
                      <SelectTrigger><SelectValue placeholder="Activity Type" /></SelectTrigger>
                      <SelectContent>
                        {['Market Research Interview', 'Follow-up Call', 'Demo', 'Proposal Sent', 'Meeting', 'Email', 'Note'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input 
                      type="datetime-local" 
                      className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#1e293b] dark:border-[#334155] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      value={newActivity.activity_date}
                      onChange={e => setNewActivity({...newActivity, activity_date: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Activity notes and details..." 
                      className="min-h-[100px] dark:bg-[#1e293b] dark:border-[#334155]"
                      value={newActivity.notes}
                      onChange={e => setNewActivity({...newActivity, notes: e.target.value})}
                    />
                    <Textarea 
                      placeholder="Next steps and follow-up items..." 
                      className="dark:bg-[#1e293b] dark:border-[#334155]"
                      value={newActivity.next_steps}
                      onChange={e => setNewActivity({...newActivity, next_steps: e.target.value})}
                    />
                    <Button type="submit" className="w-full bg-[#1e3a8a] dark:bg-[#3b82f6]">Save Activity</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activities.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="dark:bg-[#0b1120]/50 dark:border-[#1e293b] border-dashed">
                    <CardContent className="p-12 text-center text-gray-500 dark:text-gray-500 flex flex-col items-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
                        <Clock className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                      </div>
                      <p className="font-medium">No activities logged yet.</p>
                      <p className="text-xs mt-1">Start tracking interactions with this prospect.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                activities.map((act: any, idx: number) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="dark:bg-[#0b1120] dark:border-[#1e293b] hover:shadow-sm transition-shadow">
                      <CardContent className="p-5 flex gap-4">
                        <div className="mt-1 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full h-9 w-9 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-bold text-[#141b2b] dark:text-white truncate">{act.activity_type}</h4>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-600 whitespace-nowrap bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border dark:border-gray-800">
                              {new Date(act.activity_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          {act.notes && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{act.notes}</p>}
                          {act.next_steps && (
                            <div className="mt-4 bg-blue-50/30 dark:bg-blue-900/10 border-l-2 border-blue-500 dark:border-blue-700 p-3 rounded-r text-xs">
                              <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-tight text-[10px] block mb-1">Next Steps</span>
                              <p className="text-blue-800 dark:text-blue-400">{act.next_steps}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
