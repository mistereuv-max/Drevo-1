import type { Person } from "@/entities/person/model/types";
import type { FamilyTreeEdge, FamilyTreeNode } from "@/features/tree/model/types";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 124;
const X_GAP = 70;
const Y_GAP = 100;

function getParentIds(person: Person): string[] {
  const parentIds = [person.father_id, person.mother_id].filter(Boolean);
  return parentIds as string[];
}

function computeLevelMap(persons: Person[]): Map<string, number> {
  const byId = new Map(persons.map((person) => [person.id, person]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const levelOf = (id: string): number => {
    if (memo.has(id)) {
      return memo.get(id) ?? 0;
    }

    if (visiting.has(id)) {
      return 0;
    }

    visiting.add(id);
    const person = byId.get(id);

    if (!person) {
      visiting.delete(id);
      memo.set(id, 0);
      return 0;
    }

    const parents = getParentIds(person);
    const level =
      parents.length === 0 ? 0 : Math.max(...parents.map((parentId) => levelOf(parentId) + 1));

    visiting.delete(id);
    memo.set(id, level);
    return level;
  };

  persons.forEach((person) => {
    levelOf(person.id);
  });

  return memo;
}

export function buildTreeGraph(persons: Person[]): {
  nodes: FamilyTreeNode[];
  edges: FamilyTreeEdge[];
} {
  const levelMap = computeLevelMap(persons);
  const levelBuckets = new Map<number, Person[]>();

  persons.forEach((person) => {
    const level = levelMap.get(person.id) ?? 0;
    const bucket = levelBuckets.get(level) ?? [];
    bucket.push(person);
    levelBuckets.set(level, bucket);
  });

  const sortedLevels = [...levelBuckets.keys()].sort((a, b) => a - b);

  const nodes: FamilyTreeNode[] = [];
  sortedLevels.forEach((level) => {
    const people = (levelBuckets.get(level) ?? []).sort((a, b) =>
      `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
    );

    people.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: "personNode",
        position: {
          x: index * (NODE_WIDTH + X_GAP),
          y: level * (NODE_HEIGHT + Y_GAP),
        },
        data: { person, isAdminMode: false },
      });
    });
  });

  const edges: FamilyTreeEdge[] = [];

  persons.forEach((person) => {
    if (person.father_id) {
      edges.push({
        id: `father-${person.father_id}-${person.id}`,
        source: person.father_id,
        target: person.id,
        animated: false,
        label: "отец",
      });
    }

    if (person.mother_id) {
      edges.push({
        id: `mother-${person.mother_id}-${person.id}`,
        source: person.mother_id,
        target: person.id,
        animated: false,
        label: "мать",
      });
    }

  });

  return { nodes, edges };
}
