"use client";

import { Handle, Position } from "reactflow";
import type { PersonNodeData } from "@/features/tree/model/types";

type PersonNodeProps = {
  data: PersonNodeData;
};

export function PersonNode({ data }: PersonNodeProps) {
  const fullName = [data.person.last_name, data.person.first_name, data.person.middle_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${data.person.last_name[0] ?? ""}${data.person.first_name[0] ?? ""}`.toUpperCase();

  return (
    <article className="relative w-60 rounded-2xl border border-[#e3dacb] bg-white p-3 shadow-[0_14px_30px_-22px_rgba(46,35,20,0.35)]">
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: "none" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, width: 8, height: 8, pointerEvents: "none" }}
      />

      {data.isAdminMode && data.onQuickAdd ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            data.onQuickAdd?.(data.person.id);
          }}
          className="absolute right-2 top-2 z-20 rounded-md border border-[#e3dacb] bg-white px-2 py-0.5 text-xs hover:bg-[#f8f2e7]"
          title="Быстро добавить связанного родственника"
        >
          +
        </button>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#eadfce] bg-[#f9efde] text-sm font-semibold text-[#c0853a]">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[#1f1e1a]">{fullName}</h3>
          <p className="truncate text-xs text-[#6f6659]">{data.person.role}</p>
          <p className="truncate text-xs text-[#9a9388]">{data.person.birth_date}</p>
        </div>
      </div>
    </article>
  );
}
