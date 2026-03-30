# Health Questionnaire API - Example Requests

## Example 1: Diabetes Patient (Male)

### Request
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "phone": "+919876543210",
    "age": 45,
    "gender": "Male",
    "height": 175,
    "weight": 85,
    "diseases": ["Diabetes", "Blood Pressure"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q1",
        "question": "Do you have a family history of diabetes?",
        "answer": "Yes"
      },
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q2",
        "question": "What is your HbA1c level?",
        "answer": "6.8"
      },
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q3",
        "question": "Do you exercise regularly?",
        "answer": "n"
      },
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q4",
        "question": "Any complications?",
        "answer": "None"
      },
      {
        "disease": "Blood Pressure",
        "questionId": "bp_q1",
        "question": "Do you have high blood pressure?",
        "answer": "Yes"
      },
      {
        "disease": "Blood Pressure",
        "questionId": "bp_q2",
        "question": "Current BP reading",
        "answer": "140/90"
      },
      {
        "disease": "Blood Pressure",
        "questionId": "bp_q3",
        "question": "On any BP medications?",
        "answer": "Yes"
      }
    ],
    "source": "web",
    "notes": "Patient concerned about energy levels"
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Patient questionnaire saved successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "phone": "+919876543210",
    "diseasesCount": 2,
    "answersCount": 7,
    "createdAt": "2026-03-30T10:30:00.000Z"
  }
}
```

---

## Example 2: PCOS Patient (Female Only)

### Request
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Singh",
    "phone": "+919876543211",
    "age": 28,
    "gender": "Female",
    "height": 162,
    "weight": 68,
    "diseases": ["PCOS", "Thyroid"],
    "answers": [
      {
        "disease": "PCOS",
        "questionId": "pcos_q1",
        "question": "Do you have irregular periods?",
        "answer": "Yes"
      },
      {
        "disease": "PCOS",
        "questionId": "pcos_q2",
        "question": "Any hirsutism (excess hair growth)?",
        "answer": "Yes"
      },
      {
        "disease": "PCOS",
        "questionId": "pcos_q3",
        "question": "Weight gain issues?",
        "answer": "Yes"
      },
      {
        "disease": "Thyroid",
        "questionId": "thyroid_q1",
        "question": "What is your TSH level?",
        "answer": "3.5"
      },
      {
        "disease": "Thyroid",
        "questionId": "thyroid_q2",
        "question": "Any thyroid medications?",
        "answer": "No"
      }
    ],
    "source": "web"
  }'
```

### Why It Works
- Gender is "Female" ✓
- PCOS is included in diseases ✓
- PCOS questions are included ✓

---

## Example 3: Invalid Request (PCOS for Male)

### Request
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arun Kumar",
    "phone": "+919876543212",
    "age": 35,
    "gender": "Male",
    "diseases": ["PCOS"],
    "answers": []
  }'
```

### Expected Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "PCOS is only applicable for Female gender"
  ]
}
```

---

## Example 4: Comprehensive Health Check (All Diseases)

### Request
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vikram Patel",
    "phone": "+919876543213",
    "age": 55,
    "gender": "Male",
    "height": 180,
    "weight": 95,
    "diseases": ["Diabetes", "Blood Pressure", "Cholesterol", "Heart Health", "Liver Issues"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q1",
        "question": "Family history?",
        "answer": "Yes"
      },
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q2",
        "question": "HbA1c level?",
        "answer": "7.2"
      },
      {
        "disease": "Blood Pressure",
        "questionId": "bp_q1",
        "question": "Current BP?",
        "answer": "145/95"
      },
      {
        "disease": "Cholesterol",
        "questionId": "chol_q1",
        "question": "Total cholesterol?",
        "answer": "240"
      },
      {
        "disease": "Cholesterol",
        "questionId": "chol_q2",
        "question": "LDL level?",
        "answer": "160"
      },
      {
        "disease": "Heart Health",
        "questionId": "heart_q1",
        "question": "Any chest pain?",
        "answer": "n"
      },
      {
        "disease": "Heart Health",
        "questionId": "heart_q2",
        "question": "On cardiac medications?",
        "answer": "No"
      },
      {
        "disease": "Liver Issues",
        "questionId": "liver_q1",
        "question": "Liver enzymes elevated?",
        "answer": "n"
      }
    ],
    "source": "web"
  }'
```

---

## Example 5: Minimal Request (Only Required Fields)

### Request
```bash
curl -X POST http://localhost:5000/api/patient/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Simple Patient",
    "phone": "+919876543214",
    "diseases": ["Diabetes"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "q1",
        "answer": "Yes"
      }
    ]
  }'
```

---

## Example 6: Get Patient by ID

### Request
```bash
curl -X GET http://localhost:5000/api/patient/507f1f77bcf86cd799439011
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "phone": "+919876543210",
    "age": 45,
    "gender": "Male",
    "height": 175,
    "weight": 85,
    "diseases": ["Diabetes", "Blood Pressure"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q1",
        "question": "Do you have a family history of diabetes?",
        "answer": "Yes"
      },
      {
        "disease": "Diabetes",
        "questionId": "diabetes_q2",
        "question": "What is your HbA1c level?",
        "answer": "6.8"
      }
    ],
    "status": "completed",
    "source": "web",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

---

## Example 7: Get All Patients (Paginated)

### Request
```bash
curl -X GET "http://localhost:5000/api/patient/all?page=1&limit=5"
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Raj Kumar",
      "phone": "+919876543210",
      "age": 45,
      "gender": "Male",
      "diseases": ["Diabetes", "Blood Pressure"],
      "createdAt": "2026-03-30T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Priya Singh",
      "phone": "+919876543211",
      "age": 28,
      "gender": "Female",
      "diseases": ["PCOS", "Thyroid"],
      "createdAt": "2026-03-30T10:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 5,
    "pages": 3
  }
}
```

---

## Example 8: Get Patient by Phone

### Request
```bash
curl -X GET "http://localhost:5000/api/patient/phone/%2B919876543210"
```
*Note: Phone number should be URL encoded. `+` becomes `%2B`*

### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "phone": "+919876543210",
    "age": 45,
    "gender": "Male",
    "height": 175,
    "weight": 85,
    "diseases": ["Diabetes", "Blood Pressure"],
    "answers": [...],
    "status": "completed",
    "source": "web",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

---

## Example 9: Update Patient with Additional Answers

### Request
```bash
curl -X PUT http://localhost:5000/api/patient/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "disease": "Cholesterol",
        "questionId": "chol_q1",
        "question": "Total cholesterol level?",
        "answer": "220"
      },
      {
        "disease": "Cholesterol",
        "questionId": "chol_q2",
        "question": "On any cholesterol medications?",
        "answer": "Yes"
      }
    ],
    "notes": "Added cholesterol assessment"
  }'
```

### Response
```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "phone": "+919876543210",
    "answersCount": 9,
    "updatedAt": "2026-03-30T11:00:00.000Z"
  }
}
```

---

## Example 10: Get Statistics

### Request
```bash
curl -X GET http://localhost:5000/api/patient/stats/summary
```

### Response
```json
{
  "success": true,
  "data": {
    "totalPatients": 42,
    "diseaseStats": [
      {
        "_id": "Diabetes",
        "count": 18
      },
      {
        "_id": "Blood Pressure",
        "count": 15
      },
      {
        "_id": "Cholesterol",
        "count": 12
      },
      {
        "_id": "Heart Health",
        "count": 8
      },
      {
        "_id": "Thyroid",
        "count": 7
      },
      {
        "_id": "PCOS",
        "count": 5
      },
      {
        "_id": "Liver Issues",
        "count": 4
      },
      {
        "_id": "Arthritis",
        "count": 3
      }
    ],
    "genderStats": [
      {
        "_id": "Male",
        "count": 25
      },
      {
        "_id": "Female",
        "count": 17
      }
    ]
  }
}
```

---

## Common Errors and Solutions

### Error: PCOS not allowed for Male
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["PCOS is only applicable for Female gender"]
}
```
**Solution:** Only include PCOS in diseases array if gender is "Female"

### Error: Invalid disease name
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["Invalid disease at index 0: \"Diabeties\". Valid diseases are: Diabetes, Blood Pressure, ..."]
}
```
**Solution:** Check disease name spelling. Valid diseases are listed in API docs.

### Error: Missing required fields
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["Name is required and must be a non-empty string"]
}
```
**Solution:** Ensure `name` and `phone` are always provided.

### Error: Invalid phone format
**Note:** API accepts any phone format, but E.164 format recommended: `+[country code][number]`

---

## Testing in Frontend

### Using Fetch API (React)
```javascript
async function submitQuestionnaire(formData) {
  try {
    const response = await fetch('http://localhost:5000/api/patient/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Patient saved:', result.data.patientId);
      // Redirect or show success message
    } else {
      console.error('Validation errors:', result.details);
      // Show errors to user
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

### Using Axios (React)
```javascript
import axios from 'axios';

async function submitQuestionnaire(formData) {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/patient/create',
      formData
    );
    console.log('Success:', response.data.data.patientId);
  } catch (error) {
    console.error('Errors:', error.response.data.details);
  }
}
```

---

## Frontend Form Data Structure

Your form should collect data in this structure:

```javascript
const formData = {
  // Patient basic info
  name: "string",
  phone: "string",
  age: "number",
  gender: "enum",
  height: "number",
  weight: "number",
  
  // Disease selection
  diseases: ["array", "of", "disease", "names"],
  
  // Questionnaire answers
  answers: [
    {
      disease: "string",
      questionId: "string",
      question: "string",
      answer: "string or null"
    }
  ]
};
```
