const express = require("express");
const router = express.Router();
const {
  createQuestionnaire,
  getQuestionnaireByPhone,
  getQuestionnaireById,
  getAllQuestionnaires,
  updateQuestionnaire,
  getQuestionnaireStats,
} = require("../controllers/whatsAppController");

// PUBLIC ENDPOINTS - No authentication required
// These are for external websites/frontends to collect health questionnaires

/**
 * POST /api/questionnaire/create
 * Create or update a health questionnaire
 */
router.post("/create", createQuestionnaire);

/**
 * GET /api/questionnaire/phone/:phoneNumber
 * Get questionnaire by phone number
 */
router.get("/phone/:phoneNumber", getQuestionnaireByPhone);

/**
 * GET /api/questionnaire/by-id/:id
 * Get questionnaire by MongoDB ID
 */
router.get("/by-id/:id", getQuestionnaireById);

/**
 * GET /api/questionnaire/all
 * Get all questionnaires with pagination
 * Query params: page, limit
 */
router.get("/all", getAllQuestionnaires);

/**
 * PUT /api/questionnaire/:id
 * Update questionnaire responses and conditions
 */
router.put("/:id", updateQuestionnaire);

/**
 * GET /api/questionnaire/stats/summary
 * Get aggregated statistics (disease distribution, gender breakdown)
 */
router.get("/stats/summary", getQuestionnaireStats);

module.exports = router;
