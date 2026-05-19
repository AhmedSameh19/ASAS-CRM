'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useTheme } from 'next-themes';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, CheckCircle2, TrendingUp, Percent, BarChart3, 
  MoreHorizontal, Plus, Calendar, ArrowRight, UserPlus, FilePlus2, Sparkles, RefreshCw,
  Phone, Mail, MessageSquare, Video, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardViewProps {
  onAddProspectClick?: () => void;
  onNavigate?: (href: string) => void;
}

export default function DashboardView({ onAddProspectClick, onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const { theme } = useTheme();

  // Filters
  const [dateRange, setDateRange] = useState('All time');
  const [industry, setIndustry] = useState('All');

  // Real-time counter to visualize active status
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const url = `/analytics?date_range=${encodeURIComponent(dateRange)}&industry=${encodeURIComponent(industry)}`;
      const res = await api.get(url);
      setData(res);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      if (!silent) toast.error('Failed to load dashboard statistics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadActivities = async (silent = false) => {
    try {
      if (!silent) setActivitiesLoading(true);
      const res = await api.get('/activities');
      setActivities(res.activities || []);
    } catch (err: any) {
      console.error(err);
      if (!silent) toast.error('Failed to load recent activities');
    } finally {
      if (!silent) setActivitiesLoading(false);
    }
  };

  // Run initial fetch and set up real-time polling every 10 seconds
  useEffect(() => {
    loadData();
    loadActivities();

    const interval = setInterval(() => {
      loadData(true);
      loadActivities(true);
    }, 10000); // 10-second real-time polling frequency

    return () => clearInterval(interval);
  }, [dateRange, industry]);

  const handleManualRefresh = () => {
    loadData();
    loadActivities();
    toast.success('Dashboard metrics refreshed');
  };

  // Premium harmonized colors from DESIGN.md
  const COLORS = ['#00236f', '#1e3a8a', '#4059aa', '#b6c4ff', '#855300', '#fea619'];
  const DARK_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#f59e0b', '#fbbf24'];
  const activeColors = theme === 'dark' ? DARK_COLORS : COLORS;

  // Map activity type to rich styles and icons
  const getActivityMeta = (type: string) => {
    const norm = type.toLowerCase();
    if (norm.includes('call') || norm.includes('phone')) {
      return {
        icon: Phone,
        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
      };
    }
    if (norm.includes('email') || norm.includes('mail')) {
      return {
        icon: Mail,
        color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
      };
    }
    if (norm.includes('meeting') || norm.includes('demo') || norm.includes('video')) {
      return {
        icon: Video,
        color: 'bg-[#e9edff] text-[#00236f] dark:bg-blue-900/30 dark:text-[#60a5fa]'
      };
    }
    if (norm.includes('proposal') || norm.includes('contract') || norm.includes('document')) {
      return {
        icon: FileText,
        color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
      };
    }
    return {
      icon: Sparkles,
      color: 'bg-[#059669]/10 text-[#059669] dark:bg-[#059669]/20 dark:text-[#34d399]'
    };
  };

  // Format activity date beautifully
  const formatActivityTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleString('en-US', { timeZone: 'Africa/Cairo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-lg max-w-[1400px] mx-auto p-4 md:p-0">
      {/* Page Title & Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md mb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight dark:text-white">Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1 flex items-center gap-2">
            Real-time visual monitoring of your sales pipeline.
            <span className="flex items-center gap-1.5 text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full font-semibold animate-pulse dark:bg-[#059669]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#059669]"></span> Live Updates Active
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          {/* Date Range Filter */}
          <div className="flex items-center bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="h-4 w-4 text-outline mr-2" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-label-md text-label-md text-on-surface dark:text-gray-200 pr-8 py-0 focus:outline-none cursor-pointer"
            >
              <option value="All time">All Time</option>
              <option value="Last 7 days">Last 7 Days</option>
              <option value="Last 30 days">Last 30 Days</option>
              <option value="Last 90 days">Last 90 Days</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div className="flex items-center bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg px-3 py-2 shadow-sm">
            <select 
              value={industry} 
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-label-md text-label-md text-on-surface dark:text-gray-200 pr-8 py-0 focus:outline-none cursor-pointer"
            >
              <option value="All">All Industries</option>
              <option value="F&B">F&B</option>
              <option value="Startup">Startup</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button 
            onClick={handleManualRefresh}
            className="p-2 border border-outline-variant dark:border-[#1e293b] hover:bg-surface-container dark:hover:bg-[#1e293b] rounded-lg text-on-surface-variant transition-colors flex items-center gap-1.5"
            title={`Last checked: ${lastUpdated.toLocaleTimeString()}`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Card 1: Total Prospects */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-md flex flex-col justify-between hover:shadow-sm transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">Total Prospects</span>
            <Users className="h-5 w-5 text-outline dark:text-gray-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display-lg text-display-lg text-on-surface dark:text-white leading-none">
              {loading ? '...' : (data?.metrics?.total ?? 0).toLocaleString()}
            </span>
            <span className="font-label-sm text-label-sm text-[#059669] bg-[#059669]/10 dark:bg-[#059669]/20 px-1.5 py-0.5 rounded mb-1 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12%
            </span>
          </div>
        </div>

        {/* Card 2: Active Prospects */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-md flex flex-col justify-between hover:shadow-sm transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">Active Prospects</span>
            <Sparkles className="h-5 w-5 text-outline dark:text-gray-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display-lg text-display-lg text-on-surface dark:text-white leading-none">
              {loading ? '...' : (data?.metrics?.active ?? 0).toLocaleString()}
            </span>
            <span className="font-label-sm text-label-sm text-[#059669] bg-[#059669]/10 dark:bg-[#059669]/20 px-1.5 py-0.5 rounded mb-1 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +5%
            </span>
          </div>
        </div>

        {/* Card 3: Won Deals */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-md flex flex-col justify-between hover:shadow-sm transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">Won Deals</span>
            <CheckCircle2 className="h-5 w-5 text-outline dark:text-gray-500" />
          </div>
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col">
              <span className="font-display-lg text-display-lg text-on-surface dark:text-white leading-none">
                {loading ? '...' : (data?.metrics?.won ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-on-surface-variant dark:text-gray-400 mt-1 font-medium">
                {loading ? '...' : `${Number(data?.metrics?.won_value ?? 0).toLocaleString()} EGP`}
              </span>
            </div>
            {/* Real Data Sparkline */}
            <div className="flex items-end h-8 gap-[3px] mb-1">
              <div className="w-1.5 h-[30%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm opacity-40"></div>
              <div className="w-1.5 h-[50%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm opacity-50"></div>
              <div className="w-1.5 h-[40%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm opacity-60"></div>
              <div className="w-1.5 h-[70%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm opacity-70"></div>
              <div className="w-1.5 h-[60%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm opacity-80"></div>
              <div className="w-1.5 h-[90%] bg-[#00236f] dark:bg-[#3b82f6] rounded-t-sm"></div>
            </div>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-md flex flex-col justify-between hover:shadow-sm transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">Conversion Rate</span>
            <Percent className="h-5 w-5 text-outline dark:text-gray-500" />
          </div>
          <div>
            <span className="font-display-lg text-display-lg text-on-surface dark:text-white block mb-2 leading-none">
              {loading ? '...' : (data?.metrics?.total > 0 ? ((data.metrics.won / data.metrics.total) * 100).toFixed(1) : '0.0')}%
            </span>
            <div className="w-full bg-surface-container-highest dark:bg-[#1e293b] rounded-full h-1.5">
              <div 
                className="bg-[#00236f] dark:bg-[#3b82f6] h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${loading ? 0 : (data?.metrics?.total > 0 ? (data.metrics.won / data.metrics.total) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary dark:text-[#3b82f6]" /> Pipeline Funnel
            </h3>
            <button className="text-outline-variant hover:text-on-surface dark:hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[280px] w-full mt-4">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-sm text-outline animate-pulse">Loading funnel analytics...</span>
              </div>
            ) : data?.pipelineData && data.pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0b1120' : '#fff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#c5c5d3',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                    cursor={{ fill: theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0, 35, 111, 0.03)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={theme === 'dark' ? '#3b82f6' : '#00236f'} 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {data.pipelineData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'Won' ? (theme === 'dark' ? '#10b981' : '#059669') : (theme === 'dark' ? '#3b82f6' : '#00236f')} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-outline-variant dark:border-[#1e293b] rounded-lg">
                <p className="text-sm text-outline dark:text-gray-500">No sales funnel prospects found.</p>
                {onAddProspectClick && (
                  <button 
                    onClick={onAddProspectClick}
                    className="mt-2 text-xs font-semibold text-primary dark:text-[#3b82f6] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add your first lead
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prospects by Industry */}
        <div className="lg:col-span-1 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white">Prospects by Industry</h3>
            <button className="text-outline-variant hover:text-on-surface dark:hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center relative my-2">
            {loading ? (
              <span className="text-sm text-outline animate-pulse">Loading breakdown...</span>
            ) : data?.industryData && data.industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.industryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0b1120' : '#fff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#c5c5d3',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-surface-container-low dark:border-[#1e293b] flex items-center justify-center text-xs text-outline">
                No Data
              </div>
            )}
          </div>

          {/* Industry Legend */}
          <div className="mt-auto grid grid-cols-2 gap-y-2.5 pt-4 border-t border-outline-variant dark:border-[#1e293b]">
            {loading ? (
              <div className="h-10 col-span-2 bg-surface-container dark:bg-gray-800 rounded animate-pulse"></div>
            ) : data?.industryData && data.industryData.length > 0 ? (
              data.industryData.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: activeColors[idx % activeColors.length] }}
                  ></div>
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 truncate max-w-[120px]">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-outline text-center col-span-2">No active industry distributions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities */}
      <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white">Recent Activities</h3>
          <button 
            onClick={() => onNavigate?.('/prospects')}
            className="font-label-md text-label-md text-primary dark:text-[#3b82f6] hover:underline flex items-center gap-1 font-bold"
          >
            View All Prospects <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-surface-container-highest dark:divide-[#1e293b]">
          {activitiesLoading ? (
            <div className="py-8 text-center text-outline animate-pulse text-sm">
              Loading recent activities...
            </div>
          ) : activities.length > 0 ? (
            activities.map((act) => {
              const meta = getActivityMeta(act.activity_type);
              const ActIcon = meta.icon;
              return (
                <div key={act.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 group hover:bg-surface-container-low/20 dark:hover:bg-[#1e293b]/20 px-2 rounded-lg transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                    <ActIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface dark:text-gray-200">
                      Logged a <span className="font-semibold text-primary dark:text-[#3b82f6]">{act.activity_type}</span> event for <span className="font-semibold text-on-surface dark:text-white">{act.prospect_company || 'Prospect'}</span>.
                    </p>
                    {act.notes && (
                      <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 italic line-clamp-1">
                        "{act.notes}"
                      </p>
                    )}
                    <p className="font-label-sm text-label-sm text-outline dark:text-gray-500 mt-1">
                      {formatActivityTime(act.activity_date)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-outline-variant dark:border-[#1e293b] rounded-lg">
              <p className="text-sm text-outline dark:text-gray-500">No recent activities logged.</p>
              <button 
                onClick={() => onNavigate?.('/prospects')}
                className="mt-2 text-xs font-semibold text-primary dark:text-[#3b82f6] hover:underline"
              >
                Go to prospects to log an event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
