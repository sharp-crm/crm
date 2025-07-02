import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import { Deal, Task } from '../../types';
import StatusBadge from '../Common/StatusBadge';

interface KanbanViewProps {
  data: (Deal | Task)[];
  onItemMove: (itemId: string, newStage: string) => void;
  type: 'deals' | 'tasks';
}

interface KanbanCardProps {
  item: Deal | Task;
  type: 'deals' | 'tasks';
  dragOverlay?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item, type, dragOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = !dragOverlay
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : {
        opacity: 0.8,
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      };

  const isDeal = type === 'deals';
  const dealItem = item as Deal;
  const taskItem = item as Task;

  return (
    <div
      ref={dragOverlay ? undefined : setNodeRef}
      style={style}
      {...(dragOverlay ? {} : attributes)}
      {...(dragOverlay ? {} : listeners)}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${
        dragOverlay ? 'cursor-grabbing' : 'cursor-grab hover:shadow-md'
      } transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm">
          {isDeal ? dealItem.name : taskItem.title}
        </h4>
        <Icons.GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {isDeal ? (
        <>
          <p className="text-sm text-gray-600 mb-2">{dealItem.account}</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-600">
              ${dealItem.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">{dealItem.probability}%</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Close: {new Date(dealItem.closeDate).toLocaleDateString()}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{taskItem.description}</p>
          <div className="flex items-center justify-between mb-2">
            <StatusBadge status={taskItem.priority} variant="warning" />
            <span className="text-xs text-gray-500">{taskItem.type}</span>
          </div>
          <div className="text-xs text-gray-500">
            Due: {new Date(taskItem.dueDate).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  );
};

const DroppableColumn: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
};

const KanbanView: React.FC<KanbanViewProps> = ({ data, onItemMove, type }) => {
  const stages = type === 'deals'
    ? ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
    : ['Open', 'In Progress', 'Completed'];

  const [activeItem, setActiveItem] = useState<Deal | Task | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id;
    const overContainer = over.id;

    if (activeId && overContainer && typeof overContainer === 'string') {
      const item = data.find((d) => d.id === activeId);
      const currentStage = type === 'deals' ? (item as Deal).stage : (item as Task).status;

      if (currentStage !== overContainer) {
        onItemMove(activeId.toString(), overContainer);
      }
    }
  };

  const getItemsByStage = (stage: string) => {
    return data.filter(item => {
      if (type === 'deals') {
        return (item as Deal).stage === stage;
      } else {
        return (item as Task).status === stage;
      }
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={(event) => {
        const dragged = data.find((d) => d.id === event.active.id);
        if (dragged) setActiveItem(dragged);
      }}
    >
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageItems = getItemsByStage(stage);

          return (
            <DroppableColumn key={stage} id={stage}>
              <div className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{stage}</h3>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {stageItems.length}
                    </span>
                  </div>

                  <SortableContext items={stageItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 min-h-[200px]">
                      {stageItems.map((item) => (
                        <KanbanCard key={item.id} item={item} type={type} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      {/* 🔁 This is the drag preview */}
      <DragOverlay>
        {activeItem ? (
          <KanbanCard item={activeItem} type={type} dragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;
