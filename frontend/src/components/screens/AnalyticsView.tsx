'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useTheme } from 'next-themes';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, BarChart3,
  Percent, Clock, Award, MapPin, Target, Landmark, MoreVertical, Star
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch analytics statistics
      const res = await api.get(`/analytics?date_range=${encodeURIComponent(dateRange)}`);
      setData(res);
    } catch {
      toast.error('Failed to load deep analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  // Design system brand color palettes
  const COLORS = ['#00236f', '#fea619', '#4059aa', '#b6c4ff', '#855300'];
  const activeColors = COLORS;



  return (
    <div className="space-y-lg max-w-[1400px] mx-auto p-4 md:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white tracking-tight">Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1">
            Historical deal volume, regional distributions, and top performer matrices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="h-4 w-4 text-outline mr-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-label-md text-label-md text-on-surface dark:text-gray-200 pr-8 py-0 focus:outline-none cursor-pointer"
            >
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
              <option>Year to Date</option>
              <option>Custom Range</option>
            </select>
          </div>
          <button
            onClick={loadData}
            className="p-2 border border-outline-variant dark:border-[#1e293b] hover:bg-surface-container dark:hover:bg-[#1e293b] rounded-lg text-on-surface-variant transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
        {/* Total Revenue */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Total Revenue</div>
            <div className="p-2 bg-primary/5 rounded-lg text-primary dark:text-[#3b82f6]">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1 leading-none font-bold">
              {loading ? '...' : `EGP ${Number(data?.metrics?.won_value ?? 0).toLocaleString()}`}
            </div>
            <div className="font-label-sm text-label-sm text-[#059669] flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5" /> Total revenue from won deals
            </div>
          </div>
        </div>

        {/* Avg. Deal Size */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Avg. Deal Size</div>
            <div className="p-2 bg-primary/5 rounded-lg text-primary dark:text-[#3b82f6]">
              <Target className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1 leading-none font-bold">
              {loading ? '...' : `EGP ${Math.round(Number(data?.metrics?.won_value ?? 0) / (data?.metrics?.won || 1)).toLocaleString()}`}
            </div>
            <div className="font-label-sm text-label-sm text-[#059669] flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5" /> Average won deal value
            </div>
          </div>
        </div>

        {/* Active Deals */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Active Deals</div>
            <div className="p-2 bg-primary/5 rounded-lg text-primary dark:text-[#3b82f6]">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface dark:text-white mb-1 leading-none font-bold">
              {loading ? '...' : data?.metrics?.active ?? 0}
            </div>
            <div className="font-label-sm text-label-sm text-[#059669] flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5" /> Prospects currently in pipeline
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
        {/* Revenue Growth Graph */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Revenue Growth
            </h2>
            <button className="p-1 text-on-surface-variant hover:bg-surface-container-low rounded transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueGrowth || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#3b82f6' : '#00236f'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={theme === 'dark' ? '#3b82f6' : '#00236f'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e5e7eb'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}k`}
                  tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${value.toLocaleString()} EGP`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0b1120' : '#fff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#c5c5d3',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme === 'dark' ? '#3b82f6' : '#00236f'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources breakdown */}
        <div className="lg:col-span-1 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white">Lead Source</h2>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {data?.leadSources && data.leadSources.length > 0 ? (
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6 py-2">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.leadSources || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {(data?.leadSources || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-base text-on-surface dark:text-white">
                    {data?.leadSources?.reduce((acc: number, curr: any) => acc + Number(curr.value), 0) || 0}
                  </div>
                </div>
                <div className="space-y-2 flex-1 w-full">
                  {(data?.leadSources || []).map((src: any, index: number) => {
                    const total = data.leadSources.reduce((acc: number, curr: any) => acc + Number(curr.value), 0);
                    const percentage = total > 0 ? Math.round((Number(src.value) / total) * 100) : 0;
                    return (
                      <div key={src.name} className="flex items-center justify-between text-xs gap-4 w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="font-medium text-on-surface dark:text-gray-300 truncate max-w-[100px]" title={src.name}>
                            {src.name}
                          </span>
                        </div>
                        <span className="text-on-surface-variant dark:text-gray-400 font-bold">{percentage}% ({src.value})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              !loading && <div className="text-sm text-outline text-center py-4">No lead source data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Regional & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Industry Distribution */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Industry Distribution
            </h2>
          </div>
          <div className="flex-1 min-h-[220px]">
            {data?.industryData && data.industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.industryData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e5e7eb'} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#444651' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} Leads`, 'Prospects']}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0b1120' : '#fff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#c5c5d3',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                  >
                    {(data?.industryData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              !loading && <div className="text-sm text-outline text-center py-8">No industry data available.</div>
            )}
          </div>
        </div>

        {/* Top Sales Performers */}
        <div className="bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] rounded-xl p-lg shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Top Performers
            </h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant dark:border-gray-800">
                  <th className="pb-3 font-bold text-[10px] uppercase text-on-surface-variant tracking-wider">Representative</th>
                  <th className="pb-3 font-bold text-[10px] uppercase text-on-surface-variant tracking-wider text-right">Deals Won</th>
                  <th className="pb-3 font-bold text-[10px] uppercase text-on-surface-variant tracking-wider text-right">Value (EGP)</th>
                </tr>
              </thead>
              <tbody className="text-body-md text-on-surface">
                {data?.topPerformers?.map((rep: any, idx: number) => {
                  const bgColors = ['bg-[#e1e8fd] text-primary', 'bg-[#ffddb8] text-secondary', 'bg-green-100 text-green-700'];
                  return (
                    <tr key={rep.name} className="border-b border-outline-variant/30 dark:border-gray-800/40 hover:bg-surface-container-low/20 dark:hover:bg-gray-800/10 transition-colors last:border-0">
                      <td className="py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${bgColors[idx % bgColors.length]}`}>
                          {rep.initials}
                        </div>
                        <span className="font-semibold dark:text-gray-200">{rep.name}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-on-surface dark:text-white">{rep.deals}</td>
                      <td className="py-3 text-right font-bold text-primary dark:text-[#3b82f6]">{Number(rep.value).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {(!data?.topPerformers || data.topPerformers.length === 0) && !loading && (
                  <tr><td colSpan={3} className="py-8 text-center text-outline text-sm">No performers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
