import type { Edge, Node } from "reactflow";
import type { Person } from "@/entities/person/model/types";

export type PersonNodeData = {
  person: Person;
  isAdminMode: boolean;
  onQuickAdd?: (personId: string) => void;
};

export type FamilyTreeNode = Node<PersonNodeData>;
export type FamilyTreeEdge = Edge;
