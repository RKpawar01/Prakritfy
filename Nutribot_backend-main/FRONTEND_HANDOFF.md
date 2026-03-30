# 🚀 Health Questionnaire API - Handoff to Frontend Developer

## What's Implemented

Your backend now has a **production-ready health questionnaire system** with:

✅ **Complete API** - 6 endpoints for questionnaire management  
✅ **Full validation** - Required fields, disease validation, gender rules  
✅ **Flexible data storage** - Dynamic disease-specific questions  
✅ **MongoDB integration** - Persistent patient data  
✅ **WhatsApp support** - Phone-based patient lookup  
✅ **Error handling** - Comprehensive validation messages  
✅ **Documentation** - Complete API docs + examples  

---

## 📋 Quick API Reference

### Base URL
```
http://localhost:5000/api/patient
```

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/create` | Submit questionnaire |
| **GET** | `/all?page=1&limit=10` | List patients |
| **GET** | `/:id` | Get patient by ID |
| **GET** | `/phone/:phone` | Get patient by phone |
| **PUT** | `/:id` | Update patient |
| **GET** | `/stats/summary` | Get statistics |

---

## 🎯 Main Endpoint: Create Patient

### URL
```
POST http://localhost:5000/api/patient/create
```

### Request Format
```javascript
{
  "name": "John Doe",              // Required
  "phone": "+919876543210",         // Required
  "age": 45,                        // Optional
  "gender": "Male",                 // Optional: Male/Female/Other
  "height": 175,                    // Optional (cm)
  "weight": 75,                     // Optional (kg)
  "diseases": [                     // Array of disease names
    "Diabetes",
    "Blood Pressure",
    "Cholesterol"
  ],
  "answers": [                      // Array of answers
    {
      "disease": "Diabetes",        // Disease name
      "questionId": "q1",           // Unique question ID
      "question": "Do you have diabetes?",  // Optional
      "answer": "Yes"               // Can be string, number, null, or "n"
    },
    {
      "disease": "Blood Pressure",
      "questionId": "bp1",
      "answer": "n"                 // "n" will be converted to null
    }
  ]
}
```

### Response (Success)
```javascript
{
  "success": true,
  "message": "Patient questionnaire saved successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",  // 👈 Save this!
    "name": "John Doe",
    "phone": "+919876543210",
    "diseasesCount": 3,
    "answersCount": 4,
    "createdAt": "2026-03-30T10:30:00.000Z"
  }
}
```

### Response (Error)
```javascript
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Name is required and must be a non-empty string",
    "PCOS is only applicable for Female gender"
  ]
}
```

---

## 🔄 Quick Frontend Implementation

### Step 1: Collect Form Data
```javascript
const questionnaireData = {
  name: formName,
  phone: formPhone,
  age: formAge,
  gender: formGender,
  height: formHeight,
  weight: formWeight,
  diseases: selectedDiseases,  // Array of disease names
  answers: userAnswers         // Array of {disease, questionId, answer}
};
```

### Step 2: Submit to API
```javascript
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(questionnaireData)
});

const result = await response.json();

if (result.success) {
  // Success! Patient saved with ID:
  const patientId = result.data.patientId;
  localStorage.setItem('patientId', patientId);
} else {
  // Show validation errors
  console.error(result.details);
}
```

### Step 3: Retrieve Patient Data
```javascript
// Get patient by ID
const patientId = localStorage.getItem('patientId');
const response = await fetch(`http://localhost:5000/api/patient/${patientId}`);
const patient = await response.json();

// Or get by phone (for WhatsApp bot)
const response = await fetch(`http://localhost:5000/api/patient/phone/${phoneNumber}`);
const patient = await response.json();
```

---

## 📊 Supported Diseases

**8 total diseases:**
1. Diabetes
2. Blood Pressure
3. Cholesterol
4. Thyroid
5. Heart Health
6. Liver Issues
7. Arthritis
8. **PCOS** (Female only)

---

## ⚙️ Rules to Follow

### 1. Required Fields
- ✅ `name` - 2+ characters
- ✅ `phone` - E.164 format recommended (e.g., +919876543210)
- ❌ Everything else is optional but recommended

### 2. Disease Validation
- Must use disease names exactly as listed above
- Can't include PCOS if gender is "Male"
- Multiple diseases are supported

### 3. Answer Handling
- Each answer needs: `disease`, `questionId`, `answer`
- If user says "No" or enters "n" → send "n" and API converts to null
- Answers can be: string, number, boolean, or null

### 4. Phone Format
- Use E.164 format: `+[country][number]`
- Example: `+919876543210` ✓
- Example: `+441234567890` ✓
- Example: `919876543210` ✗

---

## 🎨 Example: Complete Form Submission

```javascript
// Example with all fields
const formData = {
  name: "Raj Kumar",
  phone: "+919876543210",
  age: 45,
  gender: "Male",
  height: 175,
  weight: 85,
  diseases: ["Diabetes", "Blood Pressure", "Cholesterol"],
  answers: [
    // Diabetes questions
    {
      disease: "Diabetes",
      questionId: "diabetes_q1",
      question: "Do you have family history?",
      answer: "Yes"
    },
    {
      disease: "Diabetes",
      questionId: "diabetes_q2",
      question: "HbA1c level?",
      answer: "6.5"
    },
    {
      disease: "Diabetes",
      questionId: "diabetes_q3",
      question: "Exercise regularly?",
      answer: "n"  // 👈 Will be stored as null
    },
    // Blood Pressure questions
    {
      disease: "Blood Pressure",
      questionId: "bp_q1",
      question: "Current BP reading?",
      answer: "140/90"
    },
    // Cholesterol questions
    {
      disease: "Cholesterol",
      questionId: "chol_q1",
      question: "Total cholesterol?",
      answer: "220"
    }
  ]
};

// Submit
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

const result = await response.json();
console.log(result.data.patientId);  // Use this ID for future queries
```

---

## 🧪 Testing

### Test in Browser Console
```javascript
fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test",
    phone: "+919876543210",
    diseases: ["Diabetes"],
    answers: [{ disease: "Diabetes", questionId: "q1", answer: "Yes" }]
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

### Test Endpoints
```bash
# Create
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+919876543210","diseases":["Diabetes"],"answers":[{"disease":"Diabetes","questionId":"q1","answer":"Yes"}]}'

# Get all
curl http://localhost:5000/api/patient/all

# Get by ID
curl http://localhost:5000/api/patient/507f1f77bcf86cd799439011

# Get stats
curl http://localhost:5000/api/patient/stats/summary
```

---

## 📁 Files Created

### Backend
- ✅ `backend/src/models/Patient.js` - Patient schema
- ✅ `backend/src/controllers/patientController.js` - API logic
- ✅ `backend/src/routes/patientRoutes.js` - Route definitions
- ✅ `backend/app.js` - Updated with routes

### Documentation
- 📄 `PATIENT_QUESTIONNAIRE_API.md` - Complete API docs
- 📄 `QUESTIONNAIRE_EXAMPLES.md` - Example requests
- 📄 `QUESTIONNAIRE_SETUP.md` - Integration guide
- 📄 `TESTING_GUIDE.md` - Testing instructions
- 📄 `QUESTIONNAIRE_FRONTEND.jsx` - React example code

---

## 🔗 For WhatsApp Bot

### Get Patient by Phone (Follow-up Messages)
```javascript
const phoneFromWhatsApp = "+919876543210";
const response = await fetch(
  `http://localhost:5000/api/patient/phone/${encodeURIComponent(phoneFromWhatsApp)}`
);
const patient = await response.json();

if (patient.success) {
  // Patient exists - show previous answers
  const previousAnswers = patient.data.answers;
} else {
  // New patient - start fresh
}
```

---

## ❌ Common Errors & Fixes

### Error: "PCOS is only applicable for Female gender"
**Problem:** 
- Sent PCOS as disease with Male gender
**Fix:**
```javascript
if (gender === "Male" && diseases.includes("PCOS")) {
  diseases = diseases.filter(d => d !== "PCOS");
}
```

### Error: "Name is required"
**Problem:** Name field is empty
**Fix:** Validate before submit
```javascript
if (!name || name.trim().length < 2) {
  alert("Please enter a valid name");
  return;
}
```

### Error: "Invalid disease"
**Problem:** Disease name is misspelled
**Fix:** Check spelling exactly, case-sensitive
```javascript
// ❌ Wrong: "diabetis" or "DIABETES"
// ✅ Right: "Diabetes"
```

### Phone Number Issues
**Problem:** Can't find patient by phone
**Fix:** Ensure exact match with saved phone
```javascript
// Must be exactly: "+919876543210"
// Not: "+91 98765 43210" or "919876543210"
```

---

## 🎓 Key Implementation Notes

1. **Store patientId** - Save returned ID for future references
2. **"n" conversion** - You can send "n" for "No" answers
3. **Optional fields** - Only name and phone are required
4. **Gender-specific** - Show PCOS only if gender is Female
5. **Error handling** - Always check `result.success`
6. **Phone format** - Use consistent E.164 format

---

## 📚 Full Documentation

For complete documentation, see:
- API Details: `PATIENT_QUESTIONNAIRE_API.md`
- Example Requests: `QUESTIONNAIRE_EXAMPLES.md`
- Setup & Integration: `QUESTIONNAIRE_SETUP.md`
- Testing Guide: `TESTING_GUIDE.md`
- React Code Example: `QUESTIONNAIRE_FRONTEND.jsx`

---

## 🚀 Ready to Go!

Everything is set up and ready. You have:

✅ Backend API with 6 endpoints  
✅ MongoDB integration  
✅ Full validation  
✅ Complete documentation  
✅ Example code  
✅ Testing guides  

**Frontend developer can start building the form immediately!**

---

## Questions?

Refer to the comprehensive documentation files:
1. `PATIENT_QUESTIONNAIRE_API.md` - API specifications
2. `QUESTIONNAIRE_EXAMPLES.md` - Real examples
3. `TESTING_GUIDE.md` - How to test
4. `QUESTIONNAIRE_SETUP.md` - Integration details

All endpoints are working and tested! 🎉
