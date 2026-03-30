# Health Questionnaire API Documentation

## Base URL
```
http://localhost:5000/api/patient
```

---

## 1. Create Patient Questionnaire

### Endpoint
```
POST /api/patient/create
```

### Description
Submit complete health questionnaire data with patient info and disease-specific answers.

### Request Body
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "age": 45,
  "gender": "Male",
  "height": 175,
  "weight": 75,
  "diseases": ["Diabetes", "Blood Pressure", "Cholesterol"],
  "answers": [
    {
      "disease": "Diabetes",
      "questionId": "q1",
      "question": "Do you have a family history of diabetes?",
      "answer": "Yes"
    },
    {
      "disease": "Diabetes",
      "questionId": "q2",
      "question": "What is your HbA1c level?",
      "answer": "6.5"
    },
    {
      "disease": "Diabetes",
      "questionId": "q3",
      "question": "Do you exercise regularly?",
      "answer": "n"
    },
    {
      "disease": "Blood Pressure",
      "questionId": "bp1",
      "question": "Do you have high blood pressure?",
      "answer": "Yes"
    },
    {
      "disease": "Blood Pressure",
      "questionId": "bp2",
      "question": "What is your current BP reading?",
      "answer": "140/90"
    },
    {
      "disease": "Cholesterol",
      "questionId": "ch1",
      "question": "What is your cholesterol level?",
      "answer": "220"
    }
  ],
  "notes": "Optional notes about the patient"
}
```

### Fields Explanation

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | Min 2 characters |
| phone | String | Yes | E.164 format (e.g., +919876543210) |
| age | Number | No | 1-150 years |
| gender | String | No | "Male", "Female", or "Other" |
| height | Number | No | In cm (50-250) |
| weight | Number | No | In kg (10-500) |
| diseases | Array | Yes | Valid: Diabetes, Blood Pressure, Cholesterol, Thyroid, Heart Health, Liver Issues, Arthritis, PCOS |
| answers | Array | Yes | Array of answer objects |
| notes | String | No | Additional notes |

### Answer Object Structure
```json
{
  "disease": "String (required)",
  "questionId": "String (required)",
  "question": "String (optional)",
  "answer": "String | Number | Boolean | null"
}
```

**Special Case**: If user enters "n" or "N", it's automatically converted to `null`

### Response (Success - 201)
```json
{
  "success": true,
  "message": "Patient questionnaire saved successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+919876543210",
    "diseasesCount": 3,
    "answersCount": 6,
    "createdAt": "2026-03-30T10:30:00.000Z"
  }
}
```

### Response (Validation Error - 400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Phone is required and must be a string",
    "Invalid disease at index 0: \"InvalidDisease\""
  ]
}
```

---

## 2. Get All Patients

### Endpoint
```
GET /api/patient/all?page=1&limit=10
```

### Query Parameters
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| page | Number | 1 | Page number |
| limit | Number | 10 | Records per page |

### Response (Success - 200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "+919876543210",
      "age": 45,
      "gender": "Male",
      "diseases": ["Diabetes", "Blood Pressure"],
      "createdAt": "2026-03-30T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

## 3. Get Patient by ID

### Endpoint
```
GET /api/patient/:id
```

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| id | String | Yes (MongoDB ObjectId) |

### Example
```
GET /api/patient/507f1f77bcf86cd799439011
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+919876543210",
    "age": 45,
    "gender": "Male",
    "height": 175,
    "weight": 75,
    "diseases": ["Diabetes", "Blood Pressure", "Cholesterol"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "q1",
        "question": "Do you have a family history of diabetes?",
        "answer": "Yes"
      },
      {
        "disease": "Diabetes",
        "questionId": "q2",
        "question": "What is your HbA1c level?",
        "answer": "6.5"
      }
    ],
    "status": "completed",
    "source": "web",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

### Response (Error - 404)
```json
{
  "success": false,
  "error": "Patient not found"
}
```

---

## 4. Get Patient by Phone Number

### Endpoint
```
GET /api/patient/phone/:phone
```

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| phone | String | Yes |

### Example
```
GET /api/patient/phone/+919876543210
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+919876543210",
    ...
  }
}
```

---

## 5. Update Patient

### Endpoint
```
PUT /api/patient/:id
```

### Request Body (Any of these fields are optional)
```json
{
  "answers": [
    {
      "disease": "PCOS",
      "questionId": "pcos1",
      "question": "Do you have irregular periods?",
      "answer": "Yes"
    }
  ],
  "age": 45,
  "gender": "Female",
  "height": 165,
  "weight": 68,
  "notes": "Updated notes"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phone": "+919876543210",
    "answersCount": 8,
    "updatedAt": "2026-03-30T11:45:00.000Z"
  }
}
```

---

## 6. Get Patient Statistics

### Endpoint
```
GET /api/patient/stats/summary
```

### Response (Success - 200)
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

## Supported Diseases

1. **Diabetes**
2. **Blood Pressure**
3. **Cholesterol**
4. **Thyroid**
5. **Heart Health**
6. **Liver Issues**
7. **Arthritis**
8. **PCOS** (Female only)

---

## Validation Rules

### 1. Required Fields
- `name` - Must be a non-empty string, min 2 characters
- `phone` - Must be a valid phone number

### 2. Disease Validation
- Must be valid disease names from the supported list
- PCOS is **only allowed** for Female gender
- Diseases must be an array, can be empty but should have at least one for meaningful data

### 3. Answers Validation
- Each answer must have `disease` and `questionId` fields
- `answer` field can be string, number, boolean, or null
- If user enters "n" or "N", it's automatically converted to null

### 4. Numeric Fields
- `age`: 1-150
- `height`: 50-250 cm
- `weight`: 10-500 kg

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["error message 1", "error message 2"]
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Patient not found"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to create patient record",
  "message": "error details"
}
```

---

## Example Usage (JavaScript/Fetch)

### Create Patient
```javascript
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "John Doe",
    phone: "+919876543210",
    age: 45,
    gender: "Male",
    height: 175,
    weight: 75,
    diseases: ["Diabetes", "Blood Pressure"],
    answers: [
      {
        disease: "Diabetes",
        questionId: "q1",
        question: "Do you have family history?",
        answer: "Yes"
      },
      {
        disease: "Diabetes",
        questionId: "q2",
        answer: "n"  // Will be converted to null
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

### Get Patient by ID
```javascript
const patientId = "507f1f77bcf86cd799439011";
const response = await fetch(`http://localhost:5000/api/patient/${patientId}`);
const patient = await response.json();
console.log(patient);
```

### Get All Patients
```javascript
const response = await fetch('http://localhost:5000/api/patient/all?page=1&limit=20');
const data = await response.json();
console.log(data);
```

---

## Integration with WhatsApp Bot

The API supports `source` field to track where the data came from:
- `web` - Web form (default)
- `whatsapp` - WhatsApp bot
- `mobile_app` - Mobile app

Example:
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  ...
  "source": "whatsapp"
}
```

---

## Database Schema

### Patient Collection

```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  diseases: [String],
  answers: [
    {
      disease: String,
      questionId: String,
      question: String,
      answer: Mixed (String | Number | Boolean | null)
    }
  ],
  status: String,        // "completed", "in_progress", "pending"
  source: String,        // "web", "whatsapp", "mobile_app"
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Rate Limiting

These endpoints are protected by general API rate limiter (same as other /api routes).

---

## CORS

API supports CORS. Frontend can call these endpoints from any domain.

---

## Questions?

For questions or issues, check the disease-specific question mapping or contact backend team.
