const router = require("express").Router();
const { chatWithAI } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", chatWithAI);

module.exports = router;
