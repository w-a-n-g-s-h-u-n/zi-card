import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CharacterPreviewItem } from "../../types/character";
import { PolyphonicReadingCharacterChip, SingleReadingCharacterChip } from "./CharacterReadingChip";

type CharacterPreviewListProps = {
  previewItems: CharacterPreviewItem[];
  showPinyinChoices: boolean;
  onPinyinChange: (char: string, pinyin: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
};

export function CharacterPreviewList({
  previewItems,
  showPinyinChoices,
  onPinyinChange,
  onReorder,
}: CharacterPreviewListProps) {
  const canReorder = Boolean(onReorder) && previewItems.length > 1 && !showPinyinChoices;
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = previewItems.findIndex((item) => item.char === active.id);
    const toIndex = previewItems.findIndex((item) => item.char === over.id);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onReorder?.(fromIndex, toIndex);
  }

  const cards = previewItems.map((item) => (
    <SortablePreviewCard
      canReorder={canReorder}
      item={item}
      key={item.char}
      showPinyinChoices={showPinyinChoices}
      onPinyinChange={onPinyinChange}
    />
  ));

  if (previewItems.length === 0) {
    return (
      <div className="preview-row" aria-label="字表预览">
        <span className="empty-preview">等待录入</span>
      </div>
    );
  }

  return (
    <div className="preview-row" aria-label="字表预览">
      {canReorder ? (
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={previewItems.map((item) => item.char)} strategy={rectSortingStrategy}>
            {cards}
          </SortableContext>
        </DndContext>
      ) : (
        cards
      )}
    </div>
  );
}

type SortablePreviewCardProps = {
  canReorder: boolean;
  item: CharacterPreviewItem;
  showPinyinChoices: boolean;
  onPinyinChange: (char: string, pinyin: string) => void;
};

function SortablePreviewCard({
  canReorder,
  item,
  showPinyinChoices,
  onPinyinChange,
}: SortablePreviewCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    disabled: !canReorder,
    id: item.char,
  });
  const chip =
    showPinyinChoices && item.pinyinOptions.length > 1 ? (
      <PolyphonicReadingCharacterChip item={item} onPinyinChange={onPinyinChange} />
    ) : (
      <SingleReadingCharacterChip item={item} />
    );

  return (
    <div
      className="preview-card"
      data-dragging={isDragging ? "true" : "false"}
      data-reorderable={canReorder ? "true" : "false"}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      title={canReorder ? "拖动调整顺序" : undefined}
      {...(canReorder ? attributes : {})}
      {...(canReorder ? listeners : {})}
    >
      {chip}
    </div>
  );
}
