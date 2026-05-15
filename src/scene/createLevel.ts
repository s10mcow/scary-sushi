import { Group, Vector3 } from 'three';

import type { LevelData } from '../types/world';
import { createCompetitionDecor } from './createCompetitionDecor';
import { createDust } from './createDust';
import { createFloor } from './createFloor';
import { createIngredients } from './createIngredients';
import { createKitchenDoors } from './createKitchenDoors';
import { createKitchenStation } from './createKitchenStation';
import { createLevelMaterials } from './materials';
import { createPantryDecor } from './createPantryDecor';
import { createProps } from './createProps';
import { createWalls } from './createWalls';
import { LEVEL_LAYOUT } from './levelLayout';

export function createLevel(): LevelData {
  const materials = createLevelMaterials();
  const root = new Group();
  const colliders: LevelData['colliders'] = [];

  root.add(createFloor(LEVEL_LAYOUT.floor, materials));

  const walls = createWalls(LEVEL_LAYOUT.walls, materials);
  root.add(walls.root);
  colliders.push(...walls.colliders);

  const props = createProps(LEVEL_LAYOUT.props, materials);
  root.add(props.root);
  colliders.push(...props.colliders);

  const stove = createKitchenStation(LEVEL_LAYOUT.stove, materials);
  root.add(stove.root);
  colliders.push(...stove.colliders);

  const ingredients = createIngredients(LEVEL_LAYOUT.ingredients);
  root.add(ingredients.root);

  root.add(createKitchenDoors(LEVEL_LAYOUT.pantryEntrance, materials));
  const pantryDecor = createPantryDecor();
  root.add(pantryDecor.root);
  const competitionDecor = createCompetitionDecor();
  root.add(competitionDecor.root);
  root.add(createDust());

  return {
    root,
    colliders,
    flickerFixtures: competitionDecor.flickerFixtures,
    stoveLight: stove.stoveLight,
    pantryEntrancePosition: new Vector3(...LEVEL_LAYOUT.pantryEntrance),
    chapterExitPosition: new Vector3(...LEVEL_LAYOUT.chapterExit),
    chapterExitDoor: pantryDecor.chapterExitDoor,
    ingredients: ingredients.ingredients,
    stationInteractables: stove.interactables,
    stationAnimator: stove.animator,
    mazeNavigator: LEVEL_LAYOUT.mazeNavigator,
    spawn: new Vector3(...LEVEL_LAYOUT.spawn),
  };
}
