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
import { Loader2, GripVertical, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prospect {
  id: number;
  company_name: string;
  contact_person: string;
  status: string;
  industry: string | null;
  priority: string | null;
  estimated_value: number | null;
}

// ─── Pipeline stages definition ───────────────────────────────────────────────
const STAGES = [
  { id: 'New Lead',       label: 'New Lead',       color: '#94a3b8' },
  { id: 'MR Scheduled',  label: 'MR Scheduled',   color: '#60a5fa' },
  { id: 'MR Completed',  label: 'MR Completed',   color: '#818cf8' },
  { id: 'Demo Scheduled',label: 'Demo Scheduled', color: '#f59e0b' },
  { id: 'Demo Done',     label: 'Demo Done',      color: '#f97316' },
  { id: 'Proposal Sent', label: 'Proposal Sent',  color: '#a78bfa' },
  { id: 'Negotiation',   label: 'Negotiation',    color: '#1e3a8a' },
  { id: 'Won',           label: 'Won ✓',          color: '#10b981' },
  { id: 'Lost',          label: 'Lost ✗',         color: '#ef4444' },
];

// ─── Card Component (Draggable) ───────────────────────────────────────────────
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

  const card = (
    <motion.div
      layoutId={prospect.id.toString()}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white dark:bg-[#0b1120] rounded-lg border dark:border-[#1e293b] shadow-sm p-3 select-none ${
        overlay ? 'shadow-xl rotate-2 border-[#1e3a8a] dark:border-[#3b82f6]' : 'hover:shadow-md hover:border-[#1e3a8a]/30 dark:hover:border-[#3b82f6]/50 transition-all'
      }`}
    >
      <div className="flex items-start gap-2">
        {!overlay && (
          <span
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 flex-shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => router.push(`/prospects/${prospect.id}`)}
        >
          <p className="font-semibold text-[#141b2b] dark:text-white text-sm truncate">{prospect.company_name}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3" />
            <span className="truncate">{prospect.contact_person}</span>
          </div>
          {prospect.industry && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              <Building2 className="h-3 w-3" />
              <span>{prospect.industry}</span>
            </div>
          )}
          {prospect.estimated_value && (
            <p className="mt-2 text-xs font-medium text-[#1e3a8a] dark:text-[#3b82f6]">
              {Number(prospect.estimated_value).toLocaleString()} EGP
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (overlay) return card;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {card}
    </div>
  );
}

// ─── Column Component (Droppable) ─────────────────────────────────────────────
function KanbanColumn({
  stage,
  prospects,
}: {
  stage: (typeof STAGES)[0];
  prospects: Prospect[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex flex-col flex-shrink-0 w-[240px]">
      {/* Column header */}
      <div
        className="flex items-center justify-between mb-3 px-3 py-2 rounded-md"
        style={{ backgroundColor: `${stage.color}15`, borderLeft: `3px solid ${stage.color}` }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stage.color }}>
          {stage.label}
        </span>
        <span
          className="text-xs font-bold rounded-full px-2 py-0.5 text-white"
          style={{ backgroundColor: stage.color }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[150px] space-y-2.5 p-2 rounded-xl transition-all duration-200 ${
          isOver ? 'bg-[#1e3a8a]/5 dark:bg-[#3b82f6]/5 ring-2 ring-[#1e3a8a]/10 dark:ring-[#3b82f6]/20' : 'bg-gray-50/50 dark:bg-gray-900/20'
        }`}
      >
        <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {prospects.map((p) => (
              <ProspectCard key={p.id} prospect={p} />
            ))}
          </AnimatePresence>
        </SortableContext>
        {prospects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-600 transition-colors">
            <p>No prospects here</p>
            <p className="mt-1 text-[10px] opacity-60">Drop to change status</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadProspects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/prospects?limit=200');
      setProspects(data.prospects || []);
    } catch {
      toast.error('Failed to load pipeline');
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
      toast.success(`Moved to "${newStage}"`);
    } catch {
      toast.error('Failed to update status');
      // Revert
      setProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, status: prospect.status } : p
        )
      );
    }
  };

  const renderSkeletons = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
      {STAGES.slice(0, 5).map((stage) => (
        <div key={stage.id} className="flex flex-col flex-shrink-0 w-[240px] space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[#141b2b] dark:text-white tracking-tight">Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag and drop cards between stages to update status
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1e3a8a] dark:text-[#3b82f6]">
            {prospects.length}
          </p>
          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Total Leads</p>
        </div>
      </div>

      {loading ? renderSkeletons() : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                prospects={getProspectsByStage(stage.id)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeProspect ? <ProspectCard prospect={activeProspect} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
