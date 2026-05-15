import type { Group, MeshStandardMaterial, Object3D, PointLight, Vector3 } from 'three';

export interface CollisionBox {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  enabled?: boolean;
}

export interface WallDefinition {
  position: [number, number, number];
  size: [number, number, number];
}

export type PropKind = 'crate' | 'pillar' | 'counter' | 'shelf' | 'prepTable';

export interface StaticPropDefinition {
  kind: PropKind;
  position: [number, number, number];
  size: [number, number, number];
  rotationY?: number;
}

export interface FloorDefinition {
  width: number;
  depth: number;
  center: [number, number];
  ceilingHeight: number;
}

export type IngredientId =
  | 'seaweed'
  | 'dried-seaweed'
  | 'sliced-seaweed'
  | 'rice-stalk'
  | 'raw-rice'
  | 'cooked-rice'
  | 'salmon-fish'
  | 'salmon'
  | 'tuna-fish'
  | 'tuna'
  | 'coffee';

export interface IngredientDefinition {
  id: IngredientId;
  label: string;
  position: [number, number, number];
}

export interface IngredientPickup {
  id: IngredientId;
  label: string;
  position: Vector3;
  root: Object3D;
  collected: boolean;
}

export type StationInteractableId =
  | 'grainer'
  | 'boiler'
  | 'skinner'
  | 'dryer'
  | 'slicer'
  | 'plate'
  | 'assembly'
  | 'submission';

export interface StationInteractable {
  id: StationInteractableId;
  label: string;
  position: Vector3;
}

export type ProcessingStationId =
  | 'grainer'
  | 'boiler'
  | 'skinner'
  | 'dryer'
  | 'slicer';

export interface MachineAnimationState {
  input: IngredientId;
  output: IngredientId;
  progress: number;
}

export interface PlateAnimationState {
  holdingPlate: boolean;
  recipeId: string | null;
  stagedIngredients: IngredientId[];
  platedRecipeId: string | null;
}

export interface StationAnimator {
  setMachineState(id: ProcessingStationId, state: MachineAnimationState | null): void;
  setPlateState(state: PlateAnimationState): void;
  update(deltaSeconds: number): void;
}

export interface FlickerFixture {
  light?: PointLight;
  material: MeshStandardMaterial;
  baseIntensity: number;
  baseEmissiveIntensity: number;
  instability: number;
  phase: number;
  zone: 'kitchen' | 'maze';
  z: number;
}

export interface MazeNavigator {
  findPath(from: Vector3, to: Vector3): Vector3[];
  snap(position: Vector3): Vector3;
  getRandomRoamTarget(from: Vector3, minDistance: number): Vector3;
}

export interface LevelData {
  root: Group;
  colliders: CollisionBox[];
  flickerFixtures: FlickerFixture[];
  stoveLight: PointLight;
  pantryEntrancePosition: Vector3;
  chapterExitPosition: Vector3;
  chapterExitDoor: Group;
  ingredients: IngredientPickup[];
  stationInteractables: StationInteractable[];
  stationAnimator: StationAnimator;
  mazeNavigator: MazeNavigator;
  spawn: Vector3;
}
