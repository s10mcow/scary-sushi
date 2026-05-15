import type { IngredientId } from '../types/world';

export interface RecipeDefinition {
  id: string;
  label: string;
  ingredients: IngredientId[];
}

export const INGREDIENT_LABELS: Record<IngredientId, string> = {
  seaweed: 'seaweed',
  'dried-seaweed': 'dried seaweed',
  'sliced-seaweed': 'sliced seaweed',
  'rice-stalk': 'rice stalk',
  'raw-rice': 'raw rice',
  'cooked-rice': 'cooked rice',
  'salmon-fish': 'salmon fish',
  salmon: 'salmon',
  'tuna-fish': 'tuna fish',
  tuna: 'tuna',
  coffee: 'coffee',
};

export const RECIPES = [
  {
    id: 'salmon-roll',
    label: 'Salmon Roll',
    ingredients: ['cooked-rice', 'sliced-seaweed', 'salmon'],
  },
  {
    id: 'tuna-roll',
    label: 'Tuna Roll',
    ingredients: ['cooked-rice', 'sliced-seaweed', 'tuna'],
  },
] satisfies RecipeDefinition[];
