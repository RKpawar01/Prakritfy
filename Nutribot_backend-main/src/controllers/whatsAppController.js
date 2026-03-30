const {
  extractIncomingInput,
  handleInquiryMessage,
} = require("../services/whatsAppService");
const WhatsAppInquiry = require("../models/WhatsAppInquiry");

// ===== QUESTIONNAIRE VALIDATION HELPERS =====

const validateRequiredFields = (data) => {
  const errors = [];

  if (!data.phoneNumber || typeof data.phoneNumber !== "string" || !data.phoneNumber.trim()) {
    errors.push("Phone number is required and must be a string");
  }

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    errors.push("Email is required and must be a valid email");
  }

  return errors;
};

const validateDiseases = (diseases) => {
  const validDiseases = [
    "diabetes",
    "blood_pressure",
    "cholesterol",
    "thyroid",
    "heart_health",
    "liver_issues",
    "arthritis",
    "pcos",
  ];

  if (!Array.isArray(diseases)) {
    return ["Diseases must be an array"];
  }

  const errors = [];
  diseases.forEach((disease, index) => {
    if (!validDiseases.includes(disease)) {
      errors.push(
        `Invalid disease at index ${index}: "${disease}". Valid diseases are: ${validDiseases.join(", ")}`
      );
    }
  });

  return errors;
};

const validateGenderSpecificDiseases = (gender, diseases) => {
  const errors = [];

  if (!gender || gender.toLowerCase() === "female") {
    return errors;
  }

  if (diseases && diseases.includes("pcos")) {
    errors.push("PCOS is only applicable for Female gender");
  }

  return errors;
};

const validateAnswers = (answers) => {
  const errors = [];

  if (!Array.isArray(answers)) {
    errors.push("Answers must be an array");
    return errors;
  }

  answers.forEach((answer, index) => {
    if (!answer.disease || typeof answer.disease !== "string") {
      errors.push(
        `Answer at index ${index}: disease field is required and must be a string`
      );
    }

    if (!answer.questionId || typeof answer.questionId !== "string") {
      errors.push(
        `Answer at index ${index}: questionId field is required and must be a string`
      );
    }

    const validDiseases = [
      "Diabetes",
      "Blood Pressure",
      "Cholesterol",
      "Thyroid",
      "Heart Health",
      "Liver Issues",
      "Arthritis",
      "PCOS",
    ];
    if (answer.disease && !validDiseases.includes(answer.disease)) {
      errors.push(
        `Answer at index ${index}: Invalid disease "${answer.disease}"`
      );
    }
  });

  return errors;
};

const normalizeAnswers = (answers) => {
  return answers.map((answer) => ({
    ...answer,
    answer: answer.answer === "n" || answer.answer === "N" ? null : answer.answer,
  }));
};

// @route GET /webhook
exports.verifyWebhook = async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

exports.receiveWebhook = async (req, res) => {

  try {

    console.log("BODY:", JSON.stringify(req.body, null, 2));

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    console.log("MESSAGE:", message);

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const input = extractIncomingInput(message);

    console.log("FROM:", from);
    console.log("INPUT:", input);

    await handleInquiryMessage(from, input);

    return res.sendStatus(200);

  } catch (error) {

    console.error("FULL ERROR:", error);

    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });

  }

};

// ===== QUESTIONNAIRE API ENDPOINTS =====

// @route POST /webhook/questionnaire/create
// @description Create/update WhatsApp inquiry with questionnaire data
// @access Public
exports.createQuestionnaire = async (req, res) => {
  try {
    const { phoneNumber, email, name, selectedConditions, responses } = req.body;

    // Validation
    const requiredErrors = validateRequiredFields({ phoneNumber, email });
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: requiredErrors,
      });
    }

    if (selectedConditions) {
      const diseaseErrors = validateDiseases(selectedConditions);
      if (diseaseErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: diseaseErrors,
        });
      }

      const genderFromResponse = responses?.gender || null;
      const genderErrors = validateGenderSpecificDiseases(genderFromResponse, selectedConditions);
      if (genderErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: genderErrors,
        });
      }
    }

    // Create or update inquiry
    let inquiry = await WhatsAppInquiry.findOne({ phoneNumber: phoneNumber.trim() });

    if (inquiry) {
      inquiry.email = email.trim();
      if (name) inquiry.name = name.trim();
      if (responses) inquiry.responses = responses;
      inquiry.selectedConditions = [...new Set(selectedConditions)];
      inquiry.step = "DONE";
      inquiry.completedAt = new Date();
    } else {
      inquiry = new WhatsAppInquiry({
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        name: name ? name.trim() : null,
        selectedConditions: [...new Set(selectedConditions)],
        responses: responses || {},
        step: "DONE",
        completedAt: new Date(),
      });
    }

    await inquiry.save();

    res.status(201).json({
      success: true,
      message: "Questionnaire saved successfully",
      data: {
        inquiryId: inquiry._id,
        name: inquiry.name,
        phoneNumber: inquiry.phoneNumber,
        diseasesCount: inquiry.selectedConditions.length,
        answersCount: inquiry.questionnaireAnswers?.length || 0,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving questionnaire:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save questionnaire",
      message: error.message,
    });
  }
};

// @route GET /webhook/questionnaire/phone/:phoneNumber
// @description Get inquiry by phone number
// @access Public
exports.getQuestionnaireByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber || typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const inquiry = await WhatsAppInquiry.findOne({ phoneNumber: phoneNumber.trim() });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found with this phone number",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry by phone:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiry",
      message: error.message,
    });
  }
};

// @route GET /webhook/questionnaire/:id
// @description Get inquiry by ID
// @access Public
exports.getQuestionnaireById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
    }

    const inquiry = await WhatsAppInquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiry",
      message: error.message,
    });
  }
};

// @route GET /webhook/questionnaire/all?page=1&limit=10
// @description Get all inquiries with pagination
// @access Public
exports.getAllQuestionnaires = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const inquiries = await WhatsAppInquiry.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-questionnaireAnswers");

    const total = await WhatsAppInquiry.countDocuments();

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inquiries",
      message: error.message,
    });
  }
};

// @route PUT /webhook/questionnaire/:id
// @description Update inquiry with new answers
// @access Public
exports.updateQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, age, gender, height, weight } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
    }

    if (answers) {
      const answerErrors = validateAnswers(answers);
      if (answerErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: answerErrors,
        });
      }
    }

    const inquiry = await WhatsAppInquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: "Inquiry not found",
      });
    }

    if (answers) {
      const normalizedAnswers = normalizeAnswers(answers);
      inquiry.questionnaireAnswers = normalizedAnswers;
    }

    if (age) inquiry.responses.age = age;
    if (gender) inquiry.responses.gender = gender.toLowerCase();
    if (height) inquiry.responses.heightCm = height;
    if (weight) inquiry.responses.weightKg = weight;

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      data: {
        inquiryId: inquiry._id,
        name: inquiry.name,
        phoneNumber: inquiry.phoneNumber,
        answersCount: inquiry.questionnaireAnswers?.length || 0,
        updatedAt: inquiry.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update inquiry",
      message: error.message,
    });
  }
};

// @route GET /webhook/questionnaire/stats/summary
// @description Get survey summary statistics
// @access Public
exports.getQuestionnaireStats = async (req, res) => {
  try {
    const totalInquiries = await WhatsAppInquiry.countDocuments();
    const diseaseStats = await WhatsAppInquiry.aggregate([
      { $unwind: "$selectedConditions" },
      { $group: { _id: "$selectedConditions", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const genderStats = await WhatsAppInquiry.aggregate([
      { $match: { "responses.gender": { $ne: null } } },
      { $group: { _id: "$responses.gender", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInquiries,
        diseaseStats,
        genderStats,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      message: error.message,
    });
  }
};