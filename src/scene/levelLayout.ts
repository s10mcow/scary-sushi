import { Vector3 } from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import type {
  FloorDefinition,
  IngredientDefinition,
  MazeNavigator,
  StaticPropDefinition,
  WallDefinition,
} from '../types/world';

const CELL_SIZE = 4;
const HALF_CELL = CELL_SIZE / 2;
const WALL_HEIGHT = 4;
const WALL_THICKNESS = 0.45;
const MAZE_WIDTH = 31;
const MAZE_HEIGHT = 39;
const MAZE_REGION_HEIGHT = 31;
const MAZE_BOTTOM_WORLD_Z = 64;

interface RoomRect {
  rowStart: number;
  columnStart: number;
  height: number;
  width: number;
}

const SEAWEED_ROOM: RoomRect = {
  rowStart: 1,
  columnStart: 1,
  height: 5,
  width: 7,
};

const RICE_ROOM: RoomRect = {
  rowStart: 1,
  columnStart: 12,
  height: 5,
  width: 7,
};

const FISH_ROOM: RoomRect = {
  rowStart: 1,
  columnStart: 23,
  height: 5,
  width: 7,
};

const LEFT_MID_ROOM: RoomRect = {
  rowStart: 10,
  columnStart: 1,
  height: 5,
  width: 5,
};

const RIGHT_MID_ROOM: RoomRect = {
  rowStart: 18,
  columnStart: 25,
  height: 5,
  width: 5,
};

const CENTER_ROOM: RoomRect = {
  rowStart: 20,
  columnStart: 11,
  height: 5,
  width: 9,
};

const LOWER_LEFT_ROOM: RoomRect = {
  rowStart: 24,
  columnStart: 1,
  height: 5,
  width: 5,
};

const LOWER_RIGHT_ROOM: RoomRect = {
  rowStart: 24,
  columnStart: 25,
  height: 5,
  width: 5,
};

const ENTRANCE_HALL: RoomRect = {
  rowStart: 34,
  columnStart: 11,
  height: 5,
  width: 9,
};

const ENTRANCE_THROAT: RoomRect = {
  rowStart: 31,
  columnStart: 14,
  height: 3,
  width: 3,
};

const MAZE_BLUEPRINT = buildMazeBlueprint();
const WALKABLE_CELLS = collectWalkableCells();

function buildMazeBlueprint(): string[] {
  const grid = Array.from({ length: MAZE_HEIGHT }, () => Array(MAZE_WIDTH).fill('#'));
  const random = createRandom(1337);

  const carveRect = (
    rowStart: number,
    columnStart: number,
    height: number,
    width: number,
  ): void => {
    for (let row = rowStart; row < rowStart + height; row += 1) {
      for (let column = columnStart; column < columnStart + width; column += 1) {
        if (row >= 0 && row < MAZE_HEIGHT && column >= 0 && column < MAZE_WIDTH) {
          grid[row][column] = '.';
        }
      }
    }
  };

  const carveLine = (
    startRow: number,
    startColumn: number,
    endRow: number,
    endColumn: number,
  ): void => {
    const rowStep = Math.sign(endRow - startRow);
    const columnStep = Math.sign(endColumn - startColumn);
    let row = startRow;
    let column = startColumn;

    carveRect(row, column, 1, 1);

    while (row !== endRow || column !== endColumn) {
      if (row !== endRow) {
        row += rowStep;
      } else if (column !== endColumn) {
        column += columnStep;
      }

      carveRect(row, column, 1, 1);
    }
  };

  const shuffle = <T>(items: T[]): T[] => {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
  };

  const stack: Array<[number, number]> = [[MAZE_REGION_HEIGHT - 2, 15]];
  grid[MAZE_REGION_HEIGHT - 2][15] = '.';

  while (stack.length > 0) {
    const [row, column] = stack[stack.length - 1];
    const candidates = shuffle([
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ]).filter(([rowOffset, columnOffset]) => {
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;

      return nextRow > 0
        && nextRow < MAZE_REGION_HEIGHT - 1
        && nextColumn > 0
        && nextColumn < MAZE_WIDTH - 1
        && grid[nextRow][nextColumn] === '#';
    });

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const [rowOffset, columnOffset] = candidates[0];
    const nextRow = row + rowOffset;
    const nextColumn = column + columnOffset;

    grid[row + rowOffset / 2][column + columnOffset / 2] = '.';
    grid[nextRow][nextColumn] = '.';
    stack.push([nextRow, nextColumn]);
  }

  // Hidden produce rooms tucked into the far end of the maze.
  carveRect(SEAWEED_ROOM.rowStart, SEAWEED_ROOM.columnStart, SEAWEED_ROOM.height, SEAWEED_ROOM.width);
  carveRect(RICE_ROOM.rowStart, RICE_ROOM.columnStart, RICE_ROOM.height, RICE_ROOM.width);
  carveRect(FISH_ROOM.rowStart, FISH_ROOM.columnStart, FISH_ROOM.height, FISH_ROOM.width);

  // Additional dead-end rooms inside the maze body.
  carveRect(LEFT_MID_ROOM.rowStart, LEFT_MID_ROOM.columnStart, LEFT_MID_ROOM.height, LEFT_MID_ROOM.width);
  carveRect(RIGHT_MID_ROOM.rowStart, RIGHT_MID_ROOM.columnStart, RIGHT_MID_ROOM.height, RIGHT_MID_ROOM.width);
  carveRect(CENTER_ROOM.rowStart, CENTER_ROOM.columnStart, CENTER_ROOM.height, CENTER_ROOM.width);
  carveRect(LOWER_LEFT_ROOM.rowStart, LOWER_LEFT_ROOM.columnStart, LOWER_LEFT_ROOM.height, LOWER_LEFT_ROOM.width);
  carveRect(LOWER_RIGHT_ROOM.rowStart, LOWER_RIGHT_ROOM.columnStart, LOWER_RIGHT_ROOM.height, LOWER_RIGHT_ROOM.width);

  // Narrow hallway from the cooking room into the maze.
  carveRect(ENTRANCE_HALL.rowStart, ENTRANCE_HALL.columnStart, ENTRANCE_HALL.height, ENTRANCE_HALL.width);
  carveRect(
    ENTRANCE_THROAT.rowStart,
    ENTRANCE_THROAT.columnStart,
    ENTRANCE_THROAT.height,
    ENTRANCE_THROAT.width,
  );

  // Controlled connectors so the produce rooms sit off real maze corridors.
  carveLine(30, 15, 6, 15);
  carveLine(11, 15, 11, 4);
  carveLine(11, 4, 5, 4);
  carveLine(18, 15, 18, 26);
  carveLine(18, 26, 5, 26);

  // A few extra loops so the maze keeps the same design, just stretched deeper.
  carveLine(7, 9, 7, 21);
  carveLine(13, 9, 27, 9);
  carveLine(13, 21, 27, 21);
  carveLine(23, 5, 23, 25);
  carveLine(27, 9, 27, 21);

  return grid.map((row) => row.join(''));
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function isWalkable(token: string | undefined): boolean {
  return Boolean(token) && token !== '#';
}

function cellToWorld(
  row: number,
  column: number,
  offsetX = 0,
  offsetZ = 0,
): [number, number] {
  const x = (column - (MAZE_BLUEPRINT[0].length - 1) / 2) * CELL_SIZE + offsetX;
  const z = MAZE_BOTTOM_WORLD_Z - (MAZE_BLUEPRINT.length - 1 - row) * CELL_SIZE + offsetZ;

  return [x, z];
}

function getRoomCenter(rect: RoomRect): [number, number] {
  const centerRow = rect.rowStart + Math.floor(rect.height / 2);
  const centerColumn = rect.columnStart + Math.floor(rect.width / 2);
  return cellToWorld(centerRow, centerColumn);
}

function collectWalkableCells(): Array<{ key: number; row: number; column: number; x: number; z: number }> {
  const cells: Array<{ key: number; row: number; column: number; x: number; z: number }> = [];

  for (let row = 0; row < MAZE_BLUEPRINT.length; row += 1) {
    for (let column = 0; column < MAZE_BLUEPRINT[row].length; column += 1) {
      if (!isWalkable(MAZE_BLUEPRINT[row][column])) {
        continue;
      }

      const [x, z] = cellToWorld(row, column);
      cells.push({
        key: row * MAZE_WIDTH + column,
        row,
        column,
        x,
        z,
      });
    }
  }

  return cells;
}

const WALKABLE_BY_KEY = new Map(WALKABLE_CELLS.map((cell) => [cell.key, cell]));

export const PANTRY_ROOM_CENTERS = {
  seaweed: getRoomCenter(SEAWEED_ROOM),
  rice: getRoomCenter(RICE_ROOM),
  fish: getRoomCenter(FISH_ROOM),
} as const;

export const PANTRY_CHAPTER_EXIT_DOOR_POSITION = [
  PANTRY_ROOM_CENTERS.seaweed[0] - (((SEAWEED_ROOM.width - 1) / 2) * CELL_SIZE + HALF_CELL),
  0,
  PANTRY_ROOM_CENTERS.seaweed[1] + 0.2,
] as const;

export const PANTRY_CHAPTER_EXIT_INTERACT_POSITION = [
  PANTRY_CHAPTER_EXIT_DOOR_POSITION[0] + 3.1,
  0,
  PANTRY_CHAPTER_EXIT_DOOR_POSITION[2],
] as const;

function findNearestWalkableCell(x: number, z: number) {
  let nearest = WALKABLE_CELLS[0];
  let nearestDistance = Infinity;

  WALKABLE_CELLS.forEach((cell) => {
    const dx = cell.x - x;
    const dz = cell.z - z;
    const distance = dx * dx + dz * dz;

    if (distance < nearestDistance) {
      nearest = cell;
      nearestDistance = distance;
    }
  });

  return nearest;
}

function countWalkableNeighbors(row: number, column: number): number {
  return [
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1],
  ].filter(([neighborRow, neighborColumn]) => isWalkable(MAZE_BLUEPRINT[neighborRow]?.[neighborColumn])).length;
}

function getRandomRoamTarget(from: Vector3, minDistance: number): Vector3 {
  const origin = findNearestWalkableCell(from.x, from.z);
  const minDistanceSquared = minDistance * minDistance;
  const candidates = WALKABLE_CELLS.filter((cell) => {
    const dx = cell.x - origin.x;
    const dz = cell.z - origin.z;

    return dx * dx + dz * dz >= minDistanceSquared;
  });

  const pool = candidates.length > 0
    ? candidates
    : WALKABLE_CELLS.filter((cell) => cell.key !== origin.key);

  if (pool.length === 0) {
    return new Vector3(origin.x, GAME_CONFIG.player.height, origin.z);
  }

  const weighted = pool.map((cell) => {
    const dx = cell.x - origin.x;
    const dz = cell.z - origin.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const branchiness = countWalkableNeighbors(cell.row, cell.column);
    const weight = 0.35 + distance * 0.08 + branchiness * 0.9 + Math.random() * 1.4;

    return {
      cell,
      weight,
    };
  });

  const totalWeight = weighted.reduce((sum, candidate) => sum + candidate.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const candidate of weighted) {
    threshold -= candidate.weight;
    if (threshold <= 0) {
      return new Vector3(candidate.cell.x, GAME_CONFIG.player.height, candidate.cell.z);
    }
  }

  const fallback = weighted.at(-1)?.cell ?? origin;
  return new Vector3(fallback.x, GAME_CONFIG.player.height, fallback.z);
}

function buildMazePath(from: Vector3, to: Vector3): Vector3[] {
  const startCell = findNearestWalkableCell(from.x, from.z);
  const endCell = findNearestWalkableCell(to.x, to.z);

  if (startCell.key === endCell.key) {
    return [new Vector3(endCell.x, GAME_CONFIG.player.height, endCell.z)];
  }

  const visited = new Set<number>([startCell.key]);
  const queue: number[] = [startCell.key];
  const parent = new Map<number, number>();

  while (queue.length > 0) {
    const currentKey = queue.shift();

    if (currentKey === undefined) {
      break;
    }

    if (currentKey === endCell.key) {
      break;
    }

    const currentCell = WALKABLE_BY_KEY.get(currentKey);
    if (!currentCell) {
      continue;
    }

    const neighbors = [
      [currentCell.row - 1, currentCell.column],
      [currentCell.row + 1, currentCell.column],
      [currentCell.row, currentCell.column - 1],
      [currentCell.row, currentCell.column + 1],
    ];

    neighbors.forEach(([row, column]) => {
      if (!isWalkable(MAZE_BLUEPRINT[row]?.[column])) {
        return;
      }

      const neighborKey = row * MAZE_WIDTH + column;
      if (visited.has(neighborKey)) {
        return;
      }

      visited.add(neighborKey);
      parent.set(neighborKey, currentKey);
      queue.push(neighborKey);
    });
  }

  if (!parent.has(endCell.key)) {
    return [new Vector3(endCell.x, GAME_CONFIG.player.height, endCell.z)];
  }

  const cellKeys: number[] = [];
  let currentKey = endCell.key;

  while (currentKey !== startCell.key) {
    cellKeys.push(currentKey);
    currentKey = parent.get(currentKey) ?? startCell.key;
  }

  cellKeys.reverse();

  return cellKeys
    .map((cellKey) => WALKABLE_BY_KEY.get(cellKey))
    .filter((cell): cell is NonNullable<typeof cell> => Boolean(cell))
    .map((cell) => new Vector3(cell.x, GAME_CONFIG.player.height, cell.z));
}

const mazeNavigator: MazeNavigator = {
  findPath(from, to): Vector3[] {
    return buildMazePath(from, to);
  },
  snap(position): Vector3 {
    const nearest = findNearestWalkableCell(position.x, position.z);
    return new Vector3(nearest.x, GAME_CONFIG.player.height, nearest.z);
  },
  getRandomRoamTarget(from, minDistance): Vector3 {
    return getRandomRoamTarget(from, minDistance);
  },
};

function buildWalls(): WallDefinition[] {
  const walls: WallDefinition[] = [];

  for (let row = 0; row < MAZE_BLUEPRINT.length; row += 1) {
    for (let column = 0; column < MAZE_BLUEPRINT[row].length; column += 1) {
      if (!isWalkable(MAZE_BLUEPRINT[row][column])) {
        continue;
      }

      const [x, z] = cellToWorld(row, column);

      if (!isWalkable(MAZE_BLUEPRINT[row - 1]?.[column])) {
        walls.push({
          position: [x, WALL_HEIGHT / 2, z - HALF_CELL],
          size: [CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS],
        });
      }

      if (!isWalkable(MAZE_BLUEPRINT[row + 1]?.[column])) {
        walls.push({
          position: [x, WALL_HEIGHT / 2, z + HALF_CELL],
          size: [CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS],
        });
      }

      if (!isWalkable(MAZE_BLUEPRINT[row]?.[column - 1])) {
        walls.push({
          position: [x - HALF_CELL, WALL_HEIGHT / 2, z],
          size: [WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS],
        });
      }

      if (!isWalkable(MAZE_BLUEPRINT[row]?.[column + 1])) {
        walls.push({
          position: [x + HALF_CELL, WALL_HEIGHT / 2, z],
          size: [WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS],
        });
      }
    }
  }

  return walls;
}

const floor: FloorDefinition = {
  width: MAZE_BLUEPRINT[0].length * CELL_SIZE,
  depth: MAZE_BLUEPRINT.length * CELL_SIZE,
  center: [0, 0],
  ceilingHeight: WALL_HEIGHT,
};

const props = [] satisfies StaticPropDefinition[];

const [seaweedRoomX, seaweedRoomZ] = PANTRY_ROOM_CENTERS.seaweed;
const [riceRoomX, riceRoomZ] = PANTRY_ROOM_CENTERS.rice;
const [fishRoomX, fishRoomZ] = PANTRY_ROOM_CENTERS.fish;

const ingredients = [
  {
    id: 'seaweed',
    label: 'Fresh Seaweed',
    position: [seaweedRoomX - 0.3, 0.92, seaweedRoomZ - 0.62],
  },
  {
    id: 'seaweed',
    label: 'Fresh Seaweed',
    position: [seaweedRoomX + 0.98, 0.96, seaweedRoomZ - 0.22],
  },
  {
    id: 'rice-stalk',
    label: 'Rice Stalk',
    position: [riceRoomX - 0.94, 1.04, riceRoomZ - 0.56],
  },
  {
    id: 'rice-stalk',
    label: 'Rice Stalk',
    position: [riceRoomX + 0.98, 1.02, riceRoomZ + 0.12],
  },
  {
    id: 'salmon-fish',
    label: 'Salmon Fish',
    position: [fishRoomX - 1.1, 1.98, fishRoomZ - 0.72],
  },
  {
    id: 'tuna-fish',
    label: 'Tuna Fish',
    position: [fishRoomX + 0.34, 2.04, fishRoomZ - 0.18],
  },
] satisfies IngredientDefinition[];

export const LEVEL_LAYOUT = {
  spawn: [0, GAME_CONFIG.player.height, 60] as const,
  stove: [7.1, 0, 56.2] as const,
  pantryEntrance: [0, 0, 46] as const,
  chapterExit: PANTRY_CHAPTER_EXIT_INTERACT_POSITION,
  floor,
  walls: buildWalls(),
  props,
  ingredients,
  mazeNavigator,
};
