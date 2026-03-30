const mongoose = require("mongoose");

const whatsAppInquirySchema = new mongoose.Schema({

  phoneNumber: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    default: null,
    trim: true
  },
  step: String,
  selectedConditions: {
    type: [String],
    default: []
  },

  pendingConditions: {
    type: [String],
    default: []
  },

  activeCondition: String,

  conditionQuestionIndex: {
    type: Number,
    default: 0
  },

  generalQuestionIndex: {
    type: Number,
    default: 0
  },

  responses: {

    age: Number,

    gender: {
      type: String,
      enum: ["male","female",null],
      default: null
    },

    heightCm: Number,

    weightKg: Number,

    conditions: {

      diabetes:{
        fastingSugar:Number,
        postMealSugar:Number,
        hba1c:Number,
        medication:Boolean
      },

      cholesterolLipids:{
        totalCholesterol:Number
      },

      bloodPressure:{
        systolic:Number,
        diastolic:Number,
        medication:Boolean
      },

      heartHealth:{
        diagnosed:Boolean
      },

      thyroid:{
        tsh:Number,
        thyroidType:String
      },

      pcos:{
        cycleRegular:Boolean
      },

      liverIssues:{
        fattyLiver:Boolean
      },

      arthritisJointPain:{
        issue:String
      }

    }

  },

  // Flexible questionnaire answers (for new API)
  questionnaireAnswers: [
    {
      disease: {
        type: String,
        enum: [
          "Diabetes",
          "Blood Pressure",
          "Cholesterol",
          "Thyroid",
          "Heart Health",
          "Liver Issues",
          "Arthritis",
          "PCOS",
        ],
      },
      questionId: String,
      question: String,
      answer: mongoose.Schema.Types.Mixed, // Can be String, Number, Boolean, or null
      _id: false,
    },
  ],

  completedAt: Date

},{ timestamps:true });

module.exports = mongoose.model(
  "WhatsAppInquiry",
  whatsAppInquirySchema
);