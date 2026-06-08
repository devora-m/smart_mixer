const { Recipe, CATEGORIES } = require('./Recipe');
const { ingredientExists } = require('./ingredients');
const { unitExists } = require('./units');
const { foamTypeExists } = require('./foamTypes');

// =====================================================
//  Cross-DB validation
//  Mongoose handles schema/type/range checks; here we
//  verify that every SQLite reference actually exists.
// =====================================================
function validateCrossDbReferences(data) {
  if (!data || !Array.isArray(data.steps)) return; // mongoose will catch

  data.steps.forEach((step, index) => {
    // Steps with ingredient arrays: ADD_INGREDIENTS, MIX_WHILE_ADDING
    if (Array.isArray(step.ingredients)) {
      step.ingredients.forEach((item, itemIdx) => {
        if (item && item.ingredientId != null) {
          if (!ingredientExists(item.ingredientId)) {
            throw new Error(
              `Recipe: step #${index} (${step.type}), ingredient #${itemIdx}: ` +
              `ingredientId ${item.ingredientId} does not exist in SQLite`
            );
          }
        }
        if (item && item.unitId != null) {
          if (!unitExists(item.unitId)) {
            throw new Error(
              `Recipe: step #${index} (${step.type}), ingredient #${itemIdx}: ` +
              `unitId ${item.unitId} does not exist in SQLite`
            );
          }
        }
      });
    }

    // WHIP needs a foam type
    if (step.type === 'WHIP' && step.foamTypeId != null) {
      if (!foamTypeExists(step.foamTypeId)) {
        throw new Error(
          `Recipe: step #${index} (WHIP): foamTypeId ${step.foamTypeId} does not exist in SQLite`
        );
      }
    }
  });
}

// =====================================================
//  CRUD
// =====================================================
async function createRecipe(data) {
  validateCrossDbReferences(data);   // first - fail fast before hitting Mongo
  const recipe = await Recipe.create(data); // mongoose validators run here
  return recipe.toObject();
}

async function getRecipeById(id) {
  if (!id) throw new Error('getRecipeById: id is required');
  const recipe = await Recipe.findById(id).lean();
  return recipe || null;
}

async function getRecipeByCode(code) {
  const n = parseInt(code, 10);
  if (!Number.isInteger(n) || n < 1) throw new Error('getRecipeByCode: code must be a positive integer');
  const recipe = await Recipe.findOne({ code: n }).lean();
  return recipe || null;
}

/**
 * Returns recipes matching ALL provided filters.
 * Any filter may be omitted.
 *
 * @param {Object} opts
 * @param {number} [opts.difficulty]   max difficulty (≤). e.g. 3 → returns 1,2,3
 * @param {number[]} [opts.ingredientIds]  SQLite ingredient ids the user has at home.
 *                                   Returns only recipes whose every step-ingredient
 *                                   is contained in this list.
 * @param {string} [opts.category]    one of CATEGORIES
 */
async function getAllRecipes(opts = {}) {
  const { difficulty, ingredientIds, category } = opts;

  // ---- validate inputs ----
  if (difficulty !== undefined) {
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      throw new Error('getAllRecipes: difficulty must be an integer 1-5');
    }
  }
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      throw new Error(`getAllRecipes: category must be one of ${CATEGORIES.join(', ')}`);
    }
  }
  if (ingredientIds !== undefined) {
    if (!Array.isArray(ingredientIds) || !ingredientIds.every(Number.isInteger)) {
      throw new Error('getAllRecipes: ingredientIds must be an array of integers');
    }
  }

  // ---- Mongo query for cheap filters ----
  const query = {};
  if (difficulty !== undefined) query.difficulty = { $lte: difficulty };
  if (category !== undefined)   query.category   = category;

  let recipes = await Recipe.find(query).lean();

  // ---- post-filter by ingredient subset (in JS for clarity) ----
  if (ingredientIds !== undefined) {
    const available = new Set(ingredientIds);
    recipes = recipes.filter(recipe => {
      for (const step of recipe.steps) {
        if (Array.isArray(step.ingredients)) {
          for (const item of step.ingredients) {
            if (!available.has(item.ingredientId)) return false;
          }
        }
      }
      return true;
    });
  }

  return recipes;
}

/**
 * Overwrites a recipe completely (no version history, per spec).
 * Re-runs all validations.
 */
async function updateRecipe(id, data) {
  if (!id) throw new Error('updateRecipe: id is required');
  const existing = await Recipe.findById(id);
  if (!existing) throw new Error(`updateRecipe: id ${id} not found`);

  validateCrossDbReferences(data);

  // Overwrite: assign the new doc, keep _id and timestamps
  Object.assign(existing, data);
  existing.markModified('steps');
  await existing.save();   // runs validators
  return existing.toObject();
}

async function deleteRecipe(id) {
  if (!id) throw new Error('deleteRecipe: id is required');
  const result = await Recipe.findByIdAndDelete(id);
  if (!result) throw new Error(`deleteRecipe: id ${id} not found`);
  return true;
}

module.exports = {
  createRecipe,
  getRecipeById,
  getRecipeByCode,
  getAllRecipes,
  updateRecipe,
  deleteRecipe,
  CATEGORIES
};
