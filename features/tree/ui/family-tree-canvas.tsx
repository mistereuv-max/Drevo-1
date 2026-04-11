"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import type { Person } from "@/entities/person/model/types";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { PersonEditorSheet } from "@/features/person/ui/person-editor-sheet";
import { buildTreeGraph } from "@/features/tree/model/build-tree";
import { PersonNode } from "@/features/tree/ui/person-node";
import { PersonSidebar } from "@/features/tree/ui/person-sidebar";

type FamilyTreeCanvasProps = {
  persons: Person[];
  isAdmin: boolean;
};

const nodeTypes = {
  personNode: PersonNode,
};

type EditorState =
  | { mode: "create"; person: null; linkTargetId?: string | null; linkRelation?: "spouse" | null }
  | { mode: "edit"; person: Person; linkTargetId?: null; linkRelation?: null };

export function FamilyTreeCanvas({ persons, isAdmin }: FamilyTreeCanvasProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(isAdmin);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const { nodes, edges } = useMemo(() => {
    const graph = buildTreeGraph(persons);
    return {
      nodes: graph.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isAdminMode: isAdmin && isAdminMode,
          onQuickAdd: (personId: string) =>
            setEditor({
              mode: "create",
              person: null,
              linkTargetId: personId,
              linkRelation: "spouse",
            }),
        },
      })),
      edges: graph.edges.map((edge) => ({
        ...edge,
        className: "family-edge",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.id.startsWith("spouse-") ? "#16a34a" : "#22c55e",
        },
        style: {
          strokeWidth: 2.6,
          stroke: edge.id.startsWith("spouse-") ? "#16a34a" : "#22c55e",
          ...(edge.style ?? {}),
        },
      })),
    };
  }, [isAdmin, isAdminMode, persons]);

  const selectedPerson = useMemo(
    () => persons.find((person) => person.id === selectedPersonId) ?? null,
    [persons, selectedPersonId],
  );

  return (
    <section className="relative h-[88vh] rounded-3xl border border-[#e3dacb] bg-[#f7f1e7] p-3 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3dacb] bg-white px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b07a2e]">Навигация</p>
          <p className="text-lg font-semibold text-[#1f1e1a]">Холст генеалогического древа</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#dfd4c2] bg-white px-3 py-1 text-xs text-[#5f564a]">
            Связей: {edges.length}
          </span>
          {isAdmin ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdminMode((prev) => !prev)}>
                {isAdminMode ? "Режим: редактирование" : "Режим: просмотр"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!isAdminMode) {
                    setIsAdminMode(true);
                  }
                  setEditor({ mode: "create", person: null });
                }}
              >
                Новая карточка
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Выйти
                </Button>
              </form>
            </>
          ) : (
            <span className="rounded-full border border-[#eadfce] bg-[#fffaf1] px-3 py-1 text-xs text-[#756e63]">
              Для редактирования: /admin/login
            </span>
          )}
        </div>
      </header>

      <div className="h-[calc(100%-5rem)] overflow-hidden rounded-2xl border border-[#e3dacb] bg-[#faf6ef]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            style: { stroke: "#22c55e", strokeWidth: 2.6 },
          }}
          fitView
          minZoom={0.25}
          maxZoom={1.9}
          onNodeClick={(_, node) => setSelectedPersonId(node.id)}
        >
          <Background gap={26} size={1} color="#e6dccd" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <PersonSidebar
        person={selectedPerson}
        onClose={() => setSelectedPersonId(null)}
        canEdit={isAdmin && isAdminMode}
        onEdit={(person) => setEditor({ mode: "edit", person })}
      />

      {isAdmin && isAdminMode && editor ? (
        <PersonEditorSheet
          mode={editor.mode}
          persons={persons}
          person={editor.mode === "edit" ? editor.person : null}
          linkTargetId={editor.linkTargetId}
          linkRelation={editor.linkRelation}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </section>
  );
}
