const mongoose = require('mongoose');

const CATEGORIES = ['עוגות', 'עוגיות', 'לחמים', 'קינוחים'];
const STEP_TYPES = [
  'ADD',
  'MIX',
  'MIX_ADD',
  'WHIP',
  'WHIP_ADD',
  'INSTRUCTION',
  'FINISH'
];

// =====================================================
//  Sub-schemas
// =====================================================

// Used inside ADD_INGREDIENTS and MIX_WHILE_ADDING steps.
// ingredientId / unitId are INTEGERS pointing to SQLite.
const ingredientItemSchema = new mongoose.Schema({
  ingredientId: { type: Number, required: true, min: 1 },
  unitId:       { type: Number, required: true, min: 1 },
  amount:       { type: Number, required: true, min: 0.0001 }
}, { _id: false });

// Base step schema with a discriminator key.
// Per-type fields are added below via stepsPath.discriminator(...).
const stepSchema = new mongoose.Schema(
  {},
  { discriminatorKey: 'type', _id: false }
);

// =====================================================
//  Recipe schema
// =====================================================
const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  nameEn: {
    type: String,
    required: true,
    trim: true,
    minlength: 1   // שם באנגלית לתצוגה על מסך TFT
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: CATEGORIES,
      message: `category must be one of: ${CATEGORIES.join(', ')}`
    }
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    validate: {
      validator: Number.isInteger,
      message: 'difficulty must be 1 (easy), 2 (medium), or 3 (hard)'
    }
  },
  prepTimeMin: {
    type: Number,
    required: true,
    min: 1
  },
  baseServings: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'baseServings must be a positive integer'
    }
  },
  code: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'code must be a positive integer'
    }
  },
  finishRecordingId: {
    type: Number,
    default: null
  },
  steps: {
    type: [stepSchema],
    validate: {
      validator: arr => Array.isArray(arr) && arr.length >= 1,
      message: 'steps must contain at least one step'
    }
  }
}, { timestamps: true });

// =====================================================
//  Step discriminators (one per type)
//  Each defines its own required fields.
// =====================================================
const stepsPath = recipeSchema.path('steps');

// ADD — one or more ingredients in sequence, motor off
stepsPath.discriminator('ADD', new mongoose.Schema({
  ingredients: {
    type: [ingredientItemSchema],
    required: true,
    validate: {
      validator: arr => Array.isArray(arr) && arr.length >= 1,
      message: 'ADD: ingredients must contain at least one item'
    }
  }
}, { _id: false }));

// MIX — motor only, fixed duration
stepsPath.discriminator('MIX', new mongoose.Schema({
  motorSpeed: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: { validator: Number.isInteger, message: 'MIX.motorSpeed must be integer 1-10' }
  },
  durationSec: { type: Number, required: true, min: 0.01 }
}, { _id: false }));

// MIX_ADD — motor on, ingredients added in sequence, optional extra mix after.
// durationSec=0 per ingredient means more ingredients coming; last ingredient has durationSec>0.
stepsPath.discriminator('MIX_ADD', new mongoose.Schema({
  motorSpeed: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: { validator: Number.isInteger, message: 'MIX_ADD.motorSpeed must be integer 1-10' }
  },
  ingredients: {
    type: [ingredientItemSchema],
    required: true,
    validate: {
      validator: arr => Array.isArray(arr) && arr.length >= 1,
      message: 'MIX_ADD: ingredients must contain at least one item'
    }
  },
  durationSec: { type: Number, default: 0, min: 0 }  // זמן ערבוב נוסף אחרי הרכיב האחרון
}, { _id: false }));

// WHIP — whip until target height, calculated from foam ingredient + foamTypeId.
// foamTypeId matches FOAM_TYPES_TABLE in firmware.
stepsPath.discriminator('WHIP', new mongoose.Schema({
  motorSpeed:       { type: Number, required: true, min: 1, max: 10,
                      validate: { validator: Number.isInteger, message: 'WHIP.motorSpeed must be integer 1-10' } },
  foamTypeId:       { type: Number, required: true, min: 1 },
  foamIngredientId: { type: Number, required: true, min: 1 },  // ingredientId ב-SQLite
  foamUnitId:       { type: Number, required: true, min: 1 },  // unitId ב-SQLite
  foamAmount:       { type: Number, required: true, min: 0.0001 }  // כמות הרכיב המוקצף (לפי baseServings)
}, { _id: false }));

// WHIP_ADD — whip until target height, then add ingredients one by one.
// foamTypeId + foamIngredient determine target height (calculated in firmware).
// durationSec = extra mix time after the last ingredient (0 = no extra mix).
stepsPath.discriminator('WHIP_ADD', new mongoose.Schema({
  motorSpeed: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: { validator: Number.isInteger, message: 'WHIP_ADD.motorSpeed must be integer 1-10' }
  },
  foamTypeId:       { type: Number, required: true, min: 1 },
  foamIngredientId: { type: Number, required: true, min: 1 },
  foamUnitId:       { type: Number, required: true, min: 1 },
  foamAmount:       { type: Number, required: true, min: 0.0001 },
  ingredients: {
    type: [ingredientItemSchema],
    required: true,
    validate: {
      validator: arr => Array.isArray(arr) && arr.length >= 1,
      message: 'WHIP_ADD: ingredients must contain at least one item'
    }
  },
  durationSec: { type: Number, default: 0, min: 0 }  // זמן ערבוב נוסף אחרי הרכיב האחרון
}, { _id: false }));

// INSTRUCTION — displays text on TFT screen and optionally plays a recording.
// recordingId is null until audio sync is implemented.
stepsPath.discriminator('INSTRUCTION', new mongoose.Schema({
  instructionText: { type: String, required: true, trim: true, minlength: 1 },
  recordingId:     { type: Number, default: null }
}, { _id: false }));

// FINISH — no extra fields. Plays recipe.finishRecordingId.
stepsPath.discriminator('FINISH', new mongoose.Schema({}, { _id: false }));

// =====================================================
//  Indexes for filtering
// =====================================================
recipeSchema.index({ category: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ code: 1 }, { unique: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = { Recipe, CATEGORIES, STEP_TYPES };
