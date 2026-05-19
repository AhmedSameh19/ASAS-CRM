'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Loader2, GripVertical, Building2, User, Landmark, DollarSign, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface Prospect {
  id: number;
  company_name: string;
  contact_person: string;
  status: string;
  industry: string | null;
  priority: string | null;
  estimated_value: number | null;
  expected_close_date?: string | null;
}

const STAGES = [
  { id: 'New Lead', label: 'New Lead', color: '#757682', lightBg: 'bg-[#757682]/10', borderCol: 'border-[#757682]' },
  { id: 'MR Scheduled', label: 'MR Scheduled', color: '#00236f', lightBg: 'bg-[#00236f]/10', borderCol: 'border-[#00236f]' },
  { id: 'MR Completed', label: 'MR Completed', color: '#4059aa', lightBg: 'bg-[#4059aa]/10', borderCol: 'border-[#4059aa]' },
  { id: 'Demo Scheduled', label: 'Demo Scheduled', color: '#855300', lightBg: 'bg-[#855300]/10', borderCol: 'border-[#855300]' },
  { id: 'Demo Done', label: 'Demo Done', color: '#fea619', lightBg: 'bg-[#fea619]/10', borderCol: 'border-[#fea619]' },
  { id: 'Proposal Sent', label: 'Proposal Sent', color: '#6e2c00', lightBg: 'bg-[#6e2c00]/10', borderCol: 'border-[#6e2c00]' },
  { id: 'Negotiation', label: 'Negotiation', color: '#1e3a8a', lightBg: 'bg-[#1e3a8a]/10', borderCol: 'border-[#1e3a8a]' },
  { id: 'Won', label: 'Won ✓', color: '#059669', lightBg: 'bg-[#059669]/10', borderCol: 'border-[#059669]' },
  { id: 'Lost', label: 'Lost ✗', color: '#ba1a1a', lightBg: 'bg-[#ba1a1a]/10', borderCol: 'border-[#ba1a1a]' },
];

function ProspectCard({ prospect, overlay = false }: { prospect: Prospect; overlay?: boolean }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const getPriorityColor = (p: string | null) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
    }
  };

  const card = (
    <div
      className={`bg-surface-container-lowest dark:bg-[#0b1120] rounded-lg border border-outline-variant dark:border-[#1e293b] p-3 select-none flex flex-col gap-2 transition-all duration-200 ${overlay
        ? 'shadow-xl rotate-2 border-primary dark:border-[#3b82f6] cursor-grabbing'
        : 'hover:shadow-md hover:border-primary/40 dark:hover:border-[#3b82f6]/50'
        }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => router.push(`/prospects/${prospect.id}`)}
        >
          <p className="font-headline-md text-[14px] leading-tight font-semibold text-on-surface dark:text-white truncate" title={prospect.company_name}>
            {prospect.company_name}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-on-surface-variant dark:text-gray-400">
            <User className="h-3.5 w-3.5 text-outline flex-shrink-0" />
            <span className="truncate">{prospect.contact_person}</span>
          </div>
        </div>

        {!overlay && (
          <span
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-outline hover:text-on-surface dark:hover:text-white p-1 rounded hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        {prospect.estimated_value ? (
          <span className="text-[12px] font-bold text-primary dark:text-[#3b82f6] flex items-center">
            {Math.round(prospect.estimated_value).toLocaleString()} EGP
          </span>
        ) : (
          <span className="text-[11px] text-outline font-medium">Est: -</span>
        )}

        {prospect.priority && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(prospect.priority)}`}>
            {prospect.priority}
          </span>
        )}
      </div>
    </div>
  );

  if (overlay) return card;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {card}
    </div>
  );
}

function KanbanColumn({
  stage,
  prospects,
  isActiveMobile,
}: {
  stage: (typeof STAGES)[0];
  prospects: Prospect[];
  isActiveMobile: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  // Sum value
  const totalValue = prospects.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

  return (
    <div className={cn(
      "flex flex-col flex-shrink-0 w-full md:w-[265px] min-h-[500px]",
      isActiveMobile ? "flex" : "hidden md:flex"
    )}>
      {/* Column header */}
      <div
        className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg border-l-[3px] bg-surface-container-low dark:bg-gray-900/60 ${stage.borderCol}`}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface dark:text-gray-300 truncate" style={{ color: stage.color }}>
            {stage.label}
          </span>
          <span className="text-[10px] text-on-surface-variant dark:text-gray-400 mt-0.5">
            {totalValue > 0 ? `${Math.round(totalValue).toLocaleString()} EGP` : '0 EGP'}
          </span>
        </div>
        <span
          className="text-[11px] font-bold rounded-full px-2 py-0.5 text-white flex-shrink-0"
          style={{ backgroundColor: stage.color }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2.5 p-2 rounded-xl transition-all duration-200 border border-transparent ${isOver
          ? 'bg-primary/5 dark:bg-[#3b82f6]/5 border-primary/20 dark:border-[#3b82f6]/30 ring-2 ring-primary/5 dark:ring-0'
          : 'bg-surface-container-lowest/40 dark:bg-gray-900/10'
          }`}
      >
        <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {prospects.map((p) => (
              <ProspectCard key={p.id} prospect={p} />
            ))}
          </div>
        </SortableContext>
        {prospects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-outline-variant dark:border-gray-800 text-xs text-outline dark:text-gray-600 transition-colors">
            <p className="font-semibold">Drag here</p>
            <p className="mt-1 text-[10px] opacity-60">to change status</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelineView() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);
  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadProspects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/prospects?limit=250');
      setProspects(data.prospects || []);
    } catch {
      toast.error('Failed to load sales pipeline prospects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const getProspectsByStage = (stageId: string) =>
    prospects.filter((p) => p.status === stageId);

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id);
    setActiveProspect(prospects.find((p) => p.id === id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProspect(null);
    const { active, over } = event;
    if (!over) return;

    const prospectId = Number(active.id);
    const overId = over.id;

    let newStage: string;
    if (typeof overId === 'string') {
      newStage = overId;
    } else {
      const overProspect = prospects.find((p) => p.id === Number(overId));
      newStage = overProspect?.status ?? '';
    }

    if (!newStage) return;

    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect || prospect.status === newStage) return;

    // Optimistic UI update
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, status: newStage } : p))
    );

    try {
      await api.put(`/prospects/${prospectId}`, { status: newStage });
      toast.success(`Prospect stage updated to "${newStage}"`);
    } catch {
      toast.error('Failed to update stage on server');
      // Revert on failure
      setProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, status: prospect.status } : p
        )
      );
    }
  };

  const totalValueSum = prospects.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

  const renderSkeletons = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
      {STAGES.slice(0, 4).map((stage) => (
        <div key={stage.id} className="flex flex-col flex-shrink-0 w-[265px] space-y-3">
          <div className="h-10 w-full bg-surface-container rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-surface-container rounded-lg animate-pulse" />
          <div className="h-32 w-full bg-surface-container rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md flex-shrink-0 mb-sm">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white tracking-tight">Sales Pipeline</h1>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mt-1">
            Drag and drop prospects across columns to transition them through sales stages.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] p-3 rounded-lg shadow-sm">
          <div className="text-right">
            <p className="text-xl font-extrabold text-primary dark:text-[#3b82f6]">
              {Math.round(totalValueSum).toLocaleString()} EGP
            </p>
            <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Estimated Pipeline Value</p>
          </div>
          <div className="h-8 w-px bg-outline-variant dark:bg-gray-800" />
          <div className="text-right">
            <p className="text-xl font-extrabold text-on-surface dark:text-white">
              {prospects.length}
            </p>
            <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Active Leads</p>
          </div>
        </div>
      </div>

      {/* Mobile Stage Selector Tabs */}
      <div className="flex md:hidden gap-1.5 overflow-x-auto pb-3 flex-shrink-0 scrollbar-none select-none">
        {STAGES.map((stage) => {
          const count = getProspectsByStage(stage.id).length;
          const isActive = activeStageId === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5",
                isActive
                  ? "bg-[#00236f] text-white border-[#00236f] dark:bg-[#3b82f6] dark:border-[#3b82f6] shadow-sm"
                  : "bg-white border-outline-variant dark:bg-[#0b1120] dark:border-gray-800 text-on-surface-variant dark:text-gray-400"
              )}
            >
              <span>{stage.label}</span>
              <span className={cn(
                "h-4.5 min-w-[18px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center transition-colors",
                isActive
                  ? "bg-white text-[#00236f] dark:text-[#3b82f6]"
                  : "bg-surface-container-high text-on-surface-variant dark:bg-gray-800 dark:text-gray-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? renderSkeletons() : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 flex-grow select-none h-[calc(100vh-220px)] scrollbar-thin">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                prospects={getProspectsByStage(stage.id)}
                isActiveMobile={activeStageId === stage.id}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            duration: 180,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeProspect ? <ProspectCard prospect={activeProspect} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
