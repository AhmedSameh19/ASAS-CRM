'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users,
  Settings,
  UserPlus,
  Trash2,
  Lock,
  Plus,
  ChevronUp,
  ChevronDown,
  Edit,
  Sliders,
  Check,
  X,
  Copy,
  AlertCircle,
  Shield,
  Palette
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  requires_password_change: boolean;
  created_at: string;
}

interface Stage {
  id: number;
  name: string;
  label: string;
  color: string;
  position: number;
  type: 'active' | 'won' | 'lost';
}

const PRESET_COLORS = [
  '#757682', // Gray
  '#00236f', // Navy Blue
  '#4059aa', // Medium Blue
  '#855300', // Brown
  '#fea619', // Amber
  '#6e2c00', // Rust/Orange
  '#1e3a8a', // Deep Blue
  '#059669', // Emerald Green
  '#ba1a1a', // Crimson Red
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#db2777'  // Pink
];

export default function SettingsView() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'stages'>('users');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{ user: User; tempPass: string } | null>(null);

  // Stages state
  const [stages, setStages] = useState<Stage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  
  // New stage form state
  const [stageLabel, setStageLabel] = useState('');
  const [stageColor, setStageColor] = useState(PRESET_COLORS[0]);
  const [stageType, setStageType] = useState<'active' | 'won' | 'lost'>('active');
  const [saveStageLoading, setSaveStageLoading] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await api.get('/users');
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load stages
  const loadStages = useCallback(async () => {
    try {
      setStagesLoading(true);
      const data = await api.get('/workflow-stages');
      setStages(data.stages || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load workflow stages');
    } finally {
      setStagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
      loadStages();
    }
  }, [currentUser, loadUsers, loadStages]);

  // Add user handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAddUserLoading(true);
      const data = await api.post('/users', {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole
      });
      toast.success('User created successfully');
      setCreatedUserInfo({
        user: data.user,
        tempPass: data.tempPassword
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('user');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setAddUserLoading(false);
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? All their assigned leads and activity records will be set to unassigned.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // Create or update stage
  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageLabel) {
      toast.error('Stage label is required');
      return;
    }

    // Generate internal name from label if creating new
    const internalName = stageLabel.trim();

    try {
      setSaveStageLoading(true);
      if (editingStage) {
        // Update stage
        await api.put(`/workflow-stages/${editingStage.id}`, {
          name: internalName,
          label: stageLabel,
          color: stageColor,
          type: stageType,
          position: editingStage.position
        });
        toast.success('Workflow stage updated');
      } else {
        // Create stage
        await api.post('/workflow-stages', {
          name: internalName,
          label: stageLabel,
          color: stageColor,
          type: stageType
        });
        toast.success('New workflow stage created');
      }
      
      setStageLabel('');
      setStageColor(PRESET_COLORS[0]);
      setStageType('active');
      setEditingStage(null);
      setShowAddStageModal(false);
      loadStages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save stage');
    } finally {
      setSaveStageLoading(false);
    }
  };

  // Delete stage handler
  const handleDeleteStage = async (stageId: number, stageName: string) => {
    if (stages.length <= 1) {
      toast.error('You must keep at least one workflow stage');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete stage "${stageName}"? Any prospects currently in this stage will be migrated to the first available stage.`)) {
      return;
    }

    try {
      await api.delete(`/workflow-stages/${stageId}`);
      toast.success('Workflow stage deleted');
      loadStages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete workflow stage');
    }
  };

  // Swap stage positions
  const handleMoveStage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const currentStage = stages[index];
    const adjacentStage = stages[targetIndex];

    try {
      // Optimistic state swap
      const updatedStages = [...stages];
      updatedStages[index] = { ...currentStage, position: adjacentStage.position };
      updatedStages[targetIndex] = { ...adjacentStage, position: currentStage.position };
      // Sort immediately
      updatedStages.sort((a, b) => a.position - b.position);
      setStages(updatedStages);

      // Perform API updates
      await api.put(`/workflow-stages/${currentStage.id}`, {
        name: currentStage.name,
        label: currentStage.label,
        color: currentStage.color,
        type: currentStage.type,
        position: adjacentStage.position
      });

      await api.put(`/workflow-stages/${adjacentStage.id}`, {
        name: adjacentStage.name,
        label: adjacentStage.label,
        color: adjacentStage.color,
        type: adjacentStage.type,
        position: currentStage.position
      });

      toast.success('Workflow stages reordered');
      loadStages();
    } catch (err: any) {
      toast.error('Failed to update stage positions');
      loadStages(); // Revert
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive animate-bounce" />
        <h2 className="text-xl font-extrabold text-on-surface dark:text-white">Access Denied</h2>
        <p className="text-sm text-outline dark:text-gray-400">
          Only administrators can access this system management workspace setting panel. Please contact the administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight dark:text-white flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary dark:text-[#3b82f6]" /> System Settings
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1">
          Configure administrative settings, manage user accounts, and customize your CRM sales pipeline.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-outline-variant dark:border-[#1e293b]">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all',
            activeTab === 'users'
              ? 'border-primary text-primary dark:border-[#3b82f6] dark:text-[#3b82f6]'
              : 'border-transparent text-outline hover:text-on-surface dark:hover:text-white'
          )}
        >
          <Users className="h-4.5 w-4.5" />
          <span>User Accounts</span>
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={cn(
            'px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all',
            activeTab === 'stages'
              ? 'border-primary text-primary dark:border-[#3b82f6] dark:text-[#3b82f6]'
              : 'border-transparent text-outline hover:text-on-surface dark:hover:text-white'
          )}
        >
          <Sliders className="h-4.5 w-4.5" />
          <span>Workflow Stages</span>
        </button>
      </div>

      {/* Tab Contents: Users */}
      {activeTab === 'users' && (
        <div className="space-y-md">
          {/* Action Row */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-on-surface dark:text-white">CRM User Directory</h2>
            <button
              onClick={() => {
                setCreatedUserInfo(null);
                setShowAddUserModal(true);
              }}
              className="bg-[#00236f] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create User</span>
            </button>
          </div>

          {/* User Generation Dialog Success Alert */}
          {createdUserInfo && (
            <div className="p-4 bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/40 rounded-xl space-y-3 shadow-sm animation-fade-in">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                <Check className="h-5 w-5 bg-green-100 dark:bg-green-900 rounded-full p-0.5 shrink-0" />
                <span className="font-bold text-sm">Account generated successfully!</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-500">
                Please copy and share these login credentials with the user. They will be forced to change their password upon their first login.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-[#0b1120] p-3 rounded-lg border border-green-100 dark:border-green-950">
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">Email Address</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs font-semibold text-on-surface dark:text-white font-mono break-all">{createdUserInfo.user.email}</span>
                    <button
                      onClick={() => copyToClipboard(createdUserInfo.user.email)}
                      className="text-outline hover:text-on-surface dark:hover:text-white p-1 rounded hover:bg-surface-container dark:hover:bg-gray-800 transition-colors"
                      title="Copy email"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">Temporary Password</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs font-bold text-primary dark:text-[#3b82f6] font-mono break-all">{createdUserInfo.tempPass}</span>
                    <button
                      onClick={() => copyToClipboard(createdUserInfo.tempPass)}
                      className="text-outline hover:text-on-surface dark:hover:text-white p-1 rounded hover:bg-surface-container dark:hover:bg-gray-800 transition-colors"
                      title="Copy password"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setCreatedUserInfo(null)}
                  className="text-xs font-bold text-green-800 dark:text-green-400 hover:underline"
                >
                  Dismiss Message
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          {usersLoading ? (
            <div className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] p-8 text-center text-outline animate-pulse">
              Loading user accounts directory...
            </div>
          ) : users.length > 0 ? (
            <div className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low dark:bg-gray-900 border-b border-outline-variant dark:border-[#1e293b]">
                      <th className="px-6 py-4 font-bold text-outline dark:text-gray-400 uppercase tracking-wider">User Info</th>
                      <th className="px-6 py-4 font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Password Reset Status</th>
                      <th className="px-6 py-4 font-bold text-outline dark:text-gray-400 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-4 font-bold text-outline dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant dark:divide-[#1e293b]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container-lowest/50 dark:hover:bg-[#111827]/40 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-sm text-on-surface dark:text-white">{u.name}</p>
                            <p className="text-[11px] text-outline mt-0.5">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1",
                            u.role === 'admin' 
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" 
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          )}>
                            {u.role === 'admin' && <Shield className="h-3 w-3 shrink-0" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.requires_password_change ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              <Lock className="h-3.5 w-3.5" /> Requires reset on login
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" /> Password set / changed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant dark:text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            disabled={u.id === currentUser?.id}
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-outline hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-block"
                            title={u.id === currentUser?.id ? "You cannot delete yourself" : "Delete user"}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] p-8 text-center text-outline">
              No users found.
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Stages */}
      {activeTab === 'stages' && (
        <div className="space-y-md">
          {/* Action Row */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-on-surface dark:text-white">Pipeline Stages Configuration</h2>
            <button
              onClick={() => {
                setEditingStage(null);
                setStageLabel('');
                setStageColor(PRESET_COLORS[0]);
                setStageType('active');
                setShowAddStageModal(true);
              }}
              className="bg-[#00236f] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create Stage</span>
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-3.5 bg-[#f1f3ff] border border-outline-variant dark:bg-[#1e293b]/40 dark:border-gray-800 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-primary dark:text-[#3b82f6] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary dark:text-[#3b82f6]">Dynamic Pipeline Management</p>
              <p className="text-[11px] text-[#444651] dark:text-gray-400 leading-normal">
                Reordering stages shifts their sequence on the sales pipeline (Kanban) and in conversions chart. 
                Renaming a stage automatically maps all existing prospects to the new name.
                Deleting a stage migrates prospects in that stage to the first stage in the list.
              </p>
            </div>
          </div>

          {/* Stages List */}
          {stagesLoading ? (
            <div className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] p-8 text-center text-outline animate-pulse">
              Loading pipeline stages configuration...
            </div>
          ) : stages.length > 0 ? (
            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Position order controls */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveStage(index, 'up')}
                        className="p-1 text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-gray-800 rounded disabled:opacity-25 transition-colors"
                        title="Move Stage Up"
                      >
                        <ChevronUp className="h-4.5 w-4.5" />
                      </button>
                      <button
                        disabled={index === stages.length - 1}
                        onClick={() => handleMoveStage(index, 'down')}
                        className="p-1 text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-gray-800 rounded disabled:opacity-25 transition-colors"
                        title="Move Stage Down"
                      >
                        <ChevronDown className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Color badge preview */}
                    <div
                      className="w-4.5 h-4.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />

                    {/* Label & Details */}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface dark:text-white truncate">{stage.label}</p>
                      <p className="text-[10px] text-outline uppercase tracking-wider font-semibold mt-0.5">
                        Internal ID: <span className="font-mono">{stage.name}</span> | Type: 
                        <span className={cn(
                          "ml-1 font-bold",
                          stage.type === 'won' ? "text-green-600 dark:text-green-400" :
                          stage.type === 'lost' ? "text-red-600 dark:text-red-400" : "text-primary dark:text-[#3b82f6]"
                        )}> {stage.type}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingStage(stage);
                        setStageLabel(stage.label);
                        setStageColor(stage.color);
                        setStageType(stage.type);
                        setShowAddStageModal(true);
                      }}
                      className="p-2 text-outline hover:text-[#00236f] dark:hover:text-[#3b82f6] rounded-lg hover:bg-[#f1f3ff] dark:hover:bg-gray-800 transition-colors"
                      title="Edit stage settings"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      disabled={stages.length <= 1}
                      onClick={() => handleDeleteStage(stage.id, stage.label)}
                      className="p-2 text-outline hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Delete stage"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0b1120] rounded-xl border border-outline-variant dark:border-[#1e293b] p-8 text-center text-outline">
              No workflow stages found.
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-outline-variant dark:border-[#1e293b] flex items-center justify-between">
              <h3 className="font-headline-md text-base font-bold text-on-surface dark:text-white">Create New CRM User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-outline hover:text-on-surface dark:hover:text-white p-1 rounded hover:bg-surface-container dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="user-name">
                  Full Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  placeholder="Enter full name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-outline/70 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="user-email">
                  Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-outline/70 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="user-role">
                  System Role
                </label>
                <select
                  id="user-role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
                >
                  <option value="user">User (Standard Agent)</option>
                  <option value="admin">Admin (System Manager)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-outline-variant dark:border-[#1e293b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-outline-variant dark:border-[#1e293b] hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface-variant dark:text-gray-300 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {addUserLoading ? 'Generating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE/EDIT STAGE MODAL */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-outline-variant dark:border-[#1e293b] flex items-center justify-between">
              <h3 className="font-headline-md text-base font-bold text-on-surface dark:text-white">
                {editingStage ? 'Edit Workflow Stage' : 'Create Workflow Stage'}
              </h3>
              <button
                onClick={() => {
                  setEditingStage(null);
                  setShowAddStageModal(false);
                }}
                className="text-outline hover:text-on-surface dark:hover:text-white p-1 rounded hover:bg-surface-container dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="stage-label">
                  Stage Label
                </label>
                <input
                  id="stage-label"
                  type="text"
                  placeholder="e.g. Demonstration Done"
                  value={stageLabel}
                  onChange={(e) => setStageLabel(e.target.value)}
                  className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-outline/70 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider">
                  Color Token Color
                </label>
                <div className="grid grid-cols-6 gap-2 bg-[#f9f9ff] dark:bg-[#1e293b] p-3 rounded-xl border border-outline-variant dark:border-[#334155]">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStageColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full border border-black/10 transition-transform relative",
                        stageColor === c ? "scale-110 ring-2 ring-primary dark:ring-white" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {stageColor === c && (
                        <Check className="h-3 w-3 text-white absolute inset-0 m-auto filter drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="stage-type">
                  Stage Funnel Type
                </label>
                <select
                  id="stage-type"
                  value={stageType}
                  onChange={(e) => setStageType(e.target.value as any)}
                  className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer transition-all"
                >
                  <option value="active">Active (Ongoing negotiation)</option>
                  <option value="won">Won (Successfully closed deal)</option>
                  <option value="lost">Lost (Unsuccessful outcome)</option>
                </select>
              </div>

              {editingStage && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-400">
                  Note: Renaming this stage will dynamically re-label all existing leads in the CRM database.
                </div>
              )}

              <div className="pt-4 border-t border-outline-variant dark:border-[#1e293b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStage(null);
                    setShowAddStageModal(false);
                  }}
                  className="px-4 py-2 border border-outline-variant dark:border-[#1e293b] hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface-variant dark:text-gray-300 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStageLoading}
                  className="px-4 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {saveStageLoading ? 'Saving...' : 'Save Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
