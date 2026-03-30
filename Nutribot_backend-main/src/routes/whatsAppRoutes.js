const router = require("express").Router();
const {
  verifyWebhook,
  receiveWebhook,
  createQuestionnaire,
  getQuestionnaireByPhone,
  getQuestionnaireById,
  getAllQuestionnaires,
  updateQuestionnaire,
  getQuestionnaireStats,
} = require("../controllers/whatsAppController");

// WhatsApp webhook routes
router.get("/", verifyWebhook);
router.post("/", receiveWebhook);

// Questionnaire API routes
router.post("/questionnaire/create", createQuestionnaire);
router.get("/questionnaire/all", getAllQuestionnaires);
router.get("/questionnaire/stats/summary", getQuestionnaireStats);
router.get("/questionnaire/:id", getQuestionnaireById);
router.get("/questionnaire/phone/:phoneNumber", getQuestionnaireByPhone);
router.put("/questionnaire/:id", updateQuestionnaire);

module.exports = router;
