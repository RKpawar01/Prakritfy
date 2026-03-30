# Health Questionnaire System - Integration & Setup Guide

## What Was Created

Your backend now has a complete health questionnaire system with:

### 1. **Patient Model** (`src/models/Patient.js`)
- Stores patient basic info (name, phone, age, gender, height, weight)
- Flexible answers structure for disease-specific questions
- Supports 8 diseases (Diabetes, BP, Cholesterol, Thyroid, Heart Health, Liver, Arthritis, PCOS)
- PCOS validation (female only)
- Auto-converts "n" answers to null

### 2. **Patient Controller** (`src/controllers/patientController.js`)
- Full validation logic
- 6 API endpoints
- Error handling
- Gender-disease validation

### 3. **Patient Routes** (`src/routes/patientRoutes.js`)
- Integrated into your Express app
- Base path: `/api/patient`

### 4. **Documentation**
- API documentation (`PATIENT_QUESTIONNAIRE_API.md`)
- Example requests (`QUESTIONNAIRE_EXAMPLES.md`)

---

## API Endpoints for Frontend Developer

### Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/patient/create` | Submit questionnaire |
| GET | `/api/patient/all?page=1&limit=10` | List all patients |
| GET | `/api/patient/:id` | Get patient details |
| GET | `/api/patient/phone/:phone` | Get patient by phone |
| PUT | `/api/patient/:id` | Update patient |
| GET | `/api/patient/stats/summary` | Get statistics |

---

## How to Use (Frontend Developer)

### Step 1: Build the Form

Your frontend should collect:
```javascript
{
  name: "user input",
  phone: "+919876543210",  // From WhatsApp contact
  age: "user input",
  gender: "user selection",
  height: "user input",
  weight: "user input",
  diseases: ["selected diseases"],
  answers: [
    {
      disease: "disease name",
      questionId: "unique_id",
      question: "question text",
      answer: "user answer or 'n' for no"
    }
  ]
}
```

### Step 2: Submit to API
```javascript
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

const result = await response.json();
if (result.success) {
  const patientId = result.data.patientId;
  // Store patientId for future reference
}
```

### Step 3: Retrieve Patient Data
```javascript
// Get patient by ID
const response = await fetch(`http://localhost:5000/api/patient/${patientId}`);

// Or by phone (WhatsApp bot scenario)
const response = await fetch(`http://localhost:5000/api/patient/phone/${phoneNumber}`);
```

---

## Integration with WhatsApp Bot

### Current Flow
Your WhatsApp bot collects data and you can now save it:

```javascript
// In your WhatsApp controller, after collecting answers:
const patientData = {
  name: userData.name,
  phone: userData.phoneNumber,  // From WhatsApp API
  age: userData.age,
  gender: userData.gender,
  diseases: userData.selectedDiseases,
  answers: userData.questionAnswers,
  source: "whatsapp"  // Track it came from WhatsApp
};

// Save to database
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData)
});
```

### Example: Get Patient by Phone (for WhatsApp follow-ups)
```javascript
// When user messages again
const phoneNumber = incomingMessage.phoneNumber;  // From WhatsApp

const response = await fetch(`http://localhost:5000/api/patient/phone/${phoneNumber}`);
const existingPatient = await response.json();

if (existingPatient.success) {
  // Patient exists, show their previous answers
  const previousAnswers = existingPatient.data.answers;
} else {
  // New patient, start fresh questionnaire
}
```

---

## Testing the API

### Using cURL (Command Line)

#### 1. Create a patient
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "phone": "+919876543210",
    "age": 45,
    "gender": "Male",
    "height": 175,
    "weight": 75,
    "diseases": ["Diabetes"],
    "answers": [{
      "disease": "Diabetes",
      "questionId": "q1",
      "answer": "Yes"
    }]
  }'
```

#### 2. Get all patients
```bash
curl -X GET http://localhost:5000/api/patient/all
```

#### 3. Get patient by ID (replace with actual ID)
```bash
curl -X GET http://localhost:5000/api/patient/507f1f77bcf86cd799439011
```

#### 4. Get statistics
```bash
curl -X GET http://localhost:5000/api/patient/stats/summary
```

---

## Testing with Postman

### 1. Import Collection
Create a new Postman collection with these requests:

### Request 1: Create Patient
```
POST http://localhost:5000/api/patient/create
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+919876543210",
  "age": 45,
  "gender": "Male",
  "height": 175,
  "weight": 75,
  "diseases": ["Diabetes", "Blood Pressure"],
  "answers": [
    {
      "disease": "Diabetes",
      "questionId": "q1",
      "question": "Family history?",
      "answer": "Yes"
    },
    {
      "disease": "Blood Pressure",
      "questionId": "bp1",
      "question": "Current reading?",
      "answer": "140/90"
    }
  ]
}
```

### Request 2: Get All Patients
```
GET http://localhost:5000/api/patient/all?page=1&limit=10
```

### Request 3: Get Patient Stats
```
GET http://localhost:5000/api/patient/stats/summary
```

---

## Validation Rules to Follow

### 1. Required Fields
- `name` - Must be provided and non-empty
- `phone` - Must be provided

### 2. Disease Rules
- Only these 8 diseases allowed: Diabetes, Blood Pressure, Cholesterol, Thyroid, Heart Health, Liver Issues, Arthritis, PCOS
- PCOS **only** for Female gender
- Must be an array

### 3. Answer Rules
- Each answer needs `disease` and `questionId`
- If user says "No" or "n", frontend can send "n" which API converts to null
- `answer` can be null, string, number, or boolean

### 4. Numeric Limits
- Age: 1-150
- Height: 50-250 cm
- Weight: 10-500 kg

---

## Response Handling (Frontend)

### Success Handling
```javascript
if (result.success) {
  // Extract patient ID for future reference
  const patientId = result.data.patientId;
  console.log(`Patient saved: ${patientId}`);
  
  // Show success message
  showNotification("Questionnaire saved successfully!");
  
  // Store patientId in local storage or state
  localStorage.setItem('patientId', patientId);
}
```

### Error Handling
```javascript
if (!result.success) {
  // Show validation errors
  if (result.details) {
    result.details.forEach(error => {
      console.error(`Validation error: ${error}`);
    });
    showErrors(result.details);
  } else {
    showError(result.error);
  }
}
```

---

## Database Queries (MongoDB)

### Find all patients with Diabetes
```javascript
db.patients.find({ diseases: "Diabetes" })
```

### Find female patients with PCOS
```javascript
db.patients.find({ gender: "Female", diseases: "PCOS" })
```

### Find patients by phone
```javascript
db.patients.findOne({ phone: "+919876543210" })
```

### Get count by disease
```javascript
db.patients.aggregate([
  { $unwind: "$diseases" },
  { $group: { _id: "$diseases", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## Folder Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── Patient.js          ← NEW
│   │   ├── User.js
│   │   └── ...
│   ├── controllers/
│   │   ├── patientController.js ← NEW
│   │   ├── authController.js
│   │   └── ...
│   ├── routes/
│   │   ├── patientRoutes.js     ← NEW
│   │   ├── authRoutes.js
│   │   └── ...
│   └── ...
├── app.js                        ← UPDATED
├── server.js
├── PATIENT_QUESTIONNAIRE_API.md  ← NEW
├── QUESTIONNAIRE_EXAMPLES.md     ← NEW
└── ...
```

---

## What to Tell Frontend Developer

### API Base URL
```
http://localhost:5000/api/patient
```

### Main Endpoint (for form submission)
```
POST /api/patient/create
```

### How to Get Patient ID Back
```javascript
const result = await submitForm(formData);
const patientId = result.data.patientId;  // Use this for future queries
```

### For WhatsApp Bot Integrations
```
GET /api/patient/phone/:phoneNumber  // Get patient by WhatsApp number
```

---

## Features Summary

✅ **Full validation** - All required field checks  
✅ **Gender-specific rules** - PCOS only for females  
✅ **Flexible answers** - Store any type of response  
✅ **Auto-normalization** - "n" converts to null  
✅ **Pagination** - For listing patients  
✅ **Statistics** - Track disease distribution  
✅ **Update support** - Add more answers later  
✅ **WhatsApp integration** - Phone-based lookups  
✅ **MongoDB optimized** - Proper indexing  
✅ **Production-ready** - Error handling, validation, docs

---

## Troubleshooting

### API Not Responding
- Check server is running on port 5000
- Check MongoDB is connected
- Look for connection errors in console

### Validation Errors Appearing
- Check all required fields are provided
- Verify disease names are spelled correctly
- Ensure PCOS is only sent for Female gender

### Phone Number Issues
- Use E.164 format: `+[country][number]`
- Remove spaces or dashes
- Example: `+919876543210` not `+91 98765 43210`

### Can't Find Patients by Phone
- Make sure phone number is exactly the same as saved
- Check for leading/trailing spaces
- URL encode special characters

---

## Next Steps

1. **Frontend Developer**: Start building the form UI
2. **Use the POST endpoint** to submit questionnaires
3. **Store the patientId** returned for future reference
4. **For WhatsApp bot**: Use GET by phone endpoint to retrieve existing patients
5. **Send feedback** on any API changes needed

---

## Questions?

See detailed API docs in `PATIENT_QUESTIONNAIRE_API.md`  
See example requests in `QUESTIONNAIRE_EXAMPLES.md`
