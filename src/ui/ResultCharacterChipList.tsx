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
import type { CharacterDraft } from "../types/character";
import { resolveCharacterPinyin } from "../core/pinyin";
import { CharacterChip, type CharacterChipTone } from "./CharacterChip";

type ResultCharacterChipListProps = {
  drafts: CharacterDraft[];
  emptyText: string;
  showPinyin: boolean;
  tone: CharacterChipTone;
  onReorder?: (fromIndex: number, toIndex: number) => void;
};

export function ResultCharacterChipList({
  drafts,
  emptyText,
  showPinyin,
  tone,
  onReorder,
}: ResultCharacterChipListProps) {
  const canReorder = Boolean(onReorder) && drafts.length > 1;
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

    const fromIndex = drafts.findIndex((draft) => draft.char === active.id);
    const toIndex = drafts.findIndex((draft) => draft.char === over.id);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onReorder?.(fromIndex, toIndex);
  }

  if (drafts.length === 0) {
    return (
      <div className="result-chip-row">
        <span className="empty-preview">{emptyText}</span>
      </div>
    );
  }

  const cards = drafts.map((draft) => (
    <SortableResultChip
      canReorder={canReorder}
      draft={draft}
      key={draft.char}
      showPinyin={showPinyin}
      tone={tone}
    />
  ));

  return (
    <div className="result-chip-row">
      {canReorder ? (
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={drafts.map((draft) => draft.char)} strategy={rectSortingStrategy}>
            {cards}
          </SortableContext>
        </DndContext>
      ) : (
        cards
      )}
    </div>
  );
}

type SortableResultChipProps = {
  canReorder: boolean;
  draft: CharacterDraft;
  showPinyin: boolean;
  tone: CharacterChipTone;
};

function SortableResultChip({ canReorder, draft, showPinyin, tone }: SortableResultChipProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    disabled: !canReorder,
    id: draft.char,
  });
  const pinyin = resolveCharacterPinyin(draft.char, draft.pinyin);

  return (
    <div
      className="result-chip-card"
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
      <CharacterChip
        char={draft.char}
        pinyin={pinyin}
        showPinyin={showPinyin && Boolean(pinyin)}
        tone={tone}
        variant="result"
      />
    </div>
  );
}
