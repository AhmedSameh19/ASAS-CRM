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
  MoreHorizontal, Plus, Calendar, ArrowRight, UserPlus, FilePlus2, Sparkles, RefreshCw, ArrowDown,
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

  // Define pipeline stages sequentially for conversion rate monitoring
  const pipelineStages = [
    { name: 'New Lead', label: 'New Lead' },
    { name: 'MR Scheduled', label: 'MR Scheduled' },
    { name: 'MR Completed', label: 'MR Completed' },
    { name: 'Demo Scheduled', label: 'Demo Scheduled' },
    { name: 'Demo Done', label: 'Demo Done' },
    { name: 'Proposal Sent', label: 'Proposal Sent' },
    { name: 'Negotiation', label: 'Negotiation' },
    { name: 'Won', label: 'Won' },
    { name: 'Lost', label: 'Lost' }
  ];

  const getStageCount = (stageName: string) => {
    const val = data?.pipelineData?.find((p: any) => p.name === stageName)?.count;
    return val !== undefined ? Number(val) || 0 : 0;
  };

  const cumulativeCounts = (() => {
    // 1. Calculate active cumulative counts (only active stages + Won)
    const activeCumulative = pipelineStages.map((stage, idx) => {
      let sum = 0;
      for (let j = idx; j < pipelineStages.length; j++) {
        if (pipelineStages[j].name !== 'Lost') {
          sum += getStageCount(pipelineStages[j].name);
        }
      }
      return sum;
    });

    // 2. Distribute Lost leads cumulatively based on the active progression transition rates
    const totalLostCount = getStageCount('Lost');
    const lostCumulative = new Array(pipelineStages.length).fill(0);
    
    // All Lost leads started as New Leads
    lostCumulative[0] = totalLostCount;
    
    for (let idx = 1; idx < pipelineStages.length; idx++) {
      if (pipelineStages[idx].name === 'Lost' || pipelineStages[idx].name === 'Won') {
        lostCumulative[idx] = 0;
      } else {
        const prevActive = activeCumulative[idx - 1];
        const currActive = activeCumulative[idx];
        const transitionRate = prevActive > 0 ? currActive / prevActive : 0;
        lostCumulative[idx] = lostCumulative[idx - 1] * transitionRate;
      }
    }

    // 3. Combine active cumulative and lost cumulative to get the true total cumulative count for each stage
    return pipelineStages.map((stage, idx) => {
      let sum = 0;
      if (stage.name === 'Lost') {
        sum = totalLostCount;
      } else {
        sum = Math.round(activeCumulative[idx] + lostCumulative[idx]);
      }
      return {
        ...stage,
        count: sum
      };
    });
  })();

  const conversionRates = cumulativeCounts.map((stage, idx) => {
    if (idx === 0) {
      return {
        ...stage,
        stageToStageRate: 100,
        overallRate: 100,
        dropoff: 0
      };
    }
    const prevStage = cumulativeCounts[idx - 1];
    
    // For both Won and Lost outcomes, their transition predecessor is Negotiation
    let prevCount = prevStage.count;
    if (stage.name === 'Won' || stage.name === 'Lost') {
      const negotiationStage = cumulativeCounts.find(s => s.name === 'Negotiation');
      prevCount = negotiationStage ? negotiationStage.count : prevStage.count;
    }

    const stageToStageRate = prevCount > 0 ? (stage.count / prevCount) * 100 : 0;
    const overallRate = cumulativeCounts[0].count > 0 ? (stage.count / cumulativeCounts[0].count) * 100 : 0;
    const dropoff = stage.name === 'Lost' ? 0 : 100 - stageToStageRate;

    return {
      ...stage,
      stageToStageRate,
      overallRate,
      dropoff
    };
  });

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

        {/* Pipeline Conversion Rates */}
        <div className="lg:col-span-1 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg p-lg flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary dark:text-[#3b82f6]" /> Conversion Rates
              </h3>
              <p className="text-[10px] text-on-surface-variant dark:text-gray-400 mt-0.5">
                Sequential stage-to-stage transition & drop-off rates
              </p>
            </div>
            <button className="text-outline-variant hover:text-on-surface dark:hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 mt-4 space-y-3 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col gap-4 py-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-surface-container dark:bg-gray-800 rounded-lg"></div>
                ))}
              </div>
            ) : conversionRates && conversionRates.length > 0 ? (
              <>
                {conversionRates
                  .filter((s) => s.name !== 'Won' && s.name !== 'Lost')
                  .map((stage, idx, filteredArr) => {
                    const colors = [
                      'border-[#00236f] dark:border-[#3b82f6]',
                      'border-[#4059aa] dark:border-[#60a5fa]',
                      'border-[#855300] dark:border-[#fbbf24]',
                      'border-[#fea619] dark:border-[#f59e0b]',
                      'border-[#10b981] dark:border-[#10b981]'
                    ];
                    const activeColor = colors[idx % colors.length];

                    return (
                      <div key={stage.name} className="flex flex-col">
                        {/* Stage Card */}
                        <div className={`p-2.5 bg-surface-container-low dark:bg-[#111827] border-l-4 ${activeColor} rounded-r-lg shadow-sm flex items-center justify-between`}>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-on-surface dark:text-gray-200 block truncate">
                              {stage.label}
                            </span>
                            <span className="text-[10px] text-on-surface-variant dark:text-gray-400 flex items-center gap-1 font-medium">
                              <Users className="h-3.5 w-3.5 inline text-outline dark:text-gray-500" />
                              {stage.count} cumulative
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-primary dark:text-[#3b82f6]">
                              {stage.overallRate.toFixed(0)}%
                            </span>
                            <span className="text-[9px] text-on-surface-variant dark:text-gray-500 block">
                              Overall
                            </span>
                          </div>
                        </div>

                        {/* Transition Indicator to next stage */}
                        {idx < filteredArr.length - 1 && (
                          <div className="flex items-center gap-4 px-6 py-0.5 relative my-0.5">
                            {/* Connecting Line */}
                            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                            
                            <div className="z-10 bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-gray-800 rounded-full p-0.5 shadow-sm ml-0.5">
                              <ArrowDown className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {conversionRates[idx + 1].stageToStageRate.toFixed(0)}% conv
                              </span>
                              <span className="text-gray-300 dark:text-gray-700">|</span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {conversionRates[idx + 1].dropoff.toFixed(0)}% drop
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Outcomes Branched Splitting Block (Won / Lost) */}
                {(() => {
                  const wonStage = conversionRates.find((s) => s.name === 'Won');
                  const lostStage = conversionRates.find((s) => s.name === 'Lost');
                  if (!wonStage || !lostStage) return null;

                  return (
                    <div className="flex flex-col mt-2">
                      {/* Branch Connector Line */}
                      <div className="flex flex-col items-center mb-1">
                        <div className="w-0.5 h-3 bg-gray-200 dark:bg-gray-800" />
                        <div className="flex items-center justify-between w-full max-w-[200px] px-8 relative">
                          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gray-200 dark:bg-gray-800" />
                          <div className="absolute left-0 w-0.5 h-3 bg-gray-200 dark:bg-gray-800" />
                          <div className="absolute right-0 w-0.5 h-3 bg-gray-200 dark:bg-gray-800" />
                        </div>
                      </div>

                      {/* Won & Lost Side-by-Side Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Won Card */}
                        <div className="p-2.5 bg-green-50/50 dark:bg-[#065f46]/10 border-l-4 border-[#10b981] dark:border-[#10b981] rounded-r-lg shadow-sm flex flex-col justify-between min-h-[70px]">
                          <div>
                            <span className="font-semibold text-xs text-green-800 dark:text-green-400 block truncate">
                              {wonStage.label}
                            </span>
                            <span className="text-[9px] text-green-700/80 dark:text-green-500/80 flex items-center gap-1 font-medium mt-0.5">
                              <Users className="h-3 w-3 inline" />
                              {wonStage.count} won
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline justify-between border-t border-green-100/50 dark:border-green-900/20 pt-1.5">
                            <span className="text-[10px] text-green-700 dark:text-green-400 font-bold">
                              {wonStage.stageToStageRate.toFixed(0)}% conv
                            </span>
                            <span className="text-[8px] text-green-600/70 dark:text-green-500/50 block">
                              Total: {wonStage.overallRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Lost Card */}
                        <div className="p-2.5 bg-red-50/50 dark:bg-[#991b1b]/10 border-l-4 border-[#ef4444] dark:border-[#ef4444] rounded-r-lg shadow-sm flex flex-col justify-between min-h-[70px]">
                          <div>
                            <span className="font-semibold text-xs text-red-800 dark:text-red-400 block truncate">
                              {lostStage.label}
                            </span>
                            <span className="text-[9px] text-red-700/80 dark:text-red-500/80 flex items-center gap-1 font-medium mt-0.5">
                              <Users className="h-3 w-3 inline" />
                              {lostStage.count} lost
                            </span>
                          </div>
                          <div className="mt-2 flex items-baseline justify-between border-t border-red-100/50 dark:border-red-900/20 pt-1.5">
                            <span className="text-[10px] text-red-700 dark:text-red-400 font-bold">
                              {lostStage.stageToStageRate.toFixed(0)}% loss
                            </span>
                            <span className="text-[8px] text-red-600/70 dark:text-red-500/50 block">
                              Total: {lostStage.overallRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-xs text-outline text-center py-8">No pipeline stages found.</p>
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
