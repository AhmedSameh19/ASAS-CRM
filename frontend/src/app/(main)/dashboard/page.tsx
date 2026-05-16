'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useTheme } from 'next-themes';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  // Filters
  const [dateRange, setDateRange] = useState('All time');
  const [industry, setIndustry] = useState('All');
  const [assignedTo, setAssignedTo] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let url = `/analytics?date_range=${dateRange}&industry=${industry}&assigned_to=${assignedTo}`;
        const res = await api.get(url);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dateRange, industry, assignedTo]);

  const COLORS = ['#1e3a8a', '#fea619', '#34d399', '#f87171', '#a78bfa', '#60a5fa'];
  const DARK_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6'];
  const activeColors = theme === 'dark' ? DARK_COLORS : COLORS;

  const renderSkeletons = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-[#141b2b] dark:text-white tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={v => setDateRange(v || 'All time')}>
            <SelectTrigger className="w-[140px] dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Date Range" /></SelectTrigger>
            <SelectContent>
              {['All time', 'Last 7 days', 'Last 30 days', 'Last 90 days'].map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={industry} onValueChange={v => setIndustry(v || 'All')}>
            <SelectTrigger className="w-[140px] dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              {['All', 'F&B', 'Startup', 'Retail', 'Other'].map(i => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assignedTo} onValueChange={v => setAssignedTo(v || 'All')}>
            <SelectTrigger className="w-[140px] dark:bg-[#1e293b] dark:border-[#334155]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
            <SelectContent>
              {['All', '1', '2'].map(a => (
                <SelectItem key={a} value={a}>{a === 'All' ? 'All Users' : `User ${a}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading || !data ? renderSkeletons() : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#141b2b] dark:text-white">{data.metrics?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1e3a8a] dark:text-[#3b82f6]">{data.metrics?.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Won Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-500">{data.metrics?.won || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Number(data.metrics?.won_value || 0).toLocaleString()} EGP</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#fea619] dark:text-[#f59e0b]">
                  {data.metrics?.total > 0 ? ((data.metrics.won / data.metrics.total) * 100).toFixed(1) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Pipeline Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.pipelineData && data.pipelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.pipelineData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} />
                      <XAxis type="number" tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          color: theme === 'dark' ? '#fff' : '#000'
                        }}
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                      />
                      <Bar dataKey="count" fill={theme === 'dark' ? '#3b82f6' : '#1e3a8a'} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Industry Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {data.industryData && data.industryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                      >
                        {data.industryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                          borderColor: theme === 'dark' ? '#334155' : '#e5e7eb',
                          color: theme === 'dark' ? '#fff' : '#000'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
