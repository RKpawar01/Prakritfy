# Health Questionnaire API Reference

**Base URL:** 
- Development: `http://localhost:5000`
- Production: `https://nutribot-backend-9e3a.onrender.com`

**API Prefix:** `/api/questionnaire`

---

## 1. Create/Update Questionnaire

### Request
```
POST /api/questionnaire/create
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "923001234567",
  "age": 35,
  "gender": "male",
  "height": 180,
  "weight": 75,
  "diseases": ["Diabetes", "Blood Pressure"],
  "answers": [
    {
      "disease": "Diabetes",
      "questionId": "q1",
      "question": "Do you have diabetes?",
      "answer": "yes"
    },
    {
      "disease": "Blood Pressure",
      "questionId": "q2",
      "question": "High BP history?",
      "answer": true
    },
    {
      "disease": "Diabetes",
      "questionId": "q3",
      "question": "Family history?",
      "answer": "n"
    }
  ]
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "Questionnaire saved successfully",
  "data": {
    "inquiryId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phoneNumber": "923001234567",
    "diseasesCount": 2,
    "answersCount": 3,
    "createdAt": "2026-03-30T10:30:00.000Z"
  }
}
```

**Error Response (400 - Validation Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Name is required and must be a non-empty string",
    "Invalid disease at index 0: \"Cancer\". Valid diseases are: Diabetes, Blood Pressure, Cholesterol, Thyroid, Heart Health, Liver Issues, Arthritis, PCOS"
  ]
}
```

**Field Requirements:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | String | Yes | Phone number (mobile) |
| email | String | Yes | Email address |
| name | String | No | Patient name (optional) |
| selectedConditions | Array | No | Array of condition names |
| responses | Object | No | Health data (gender, age, height, weight, conditions) |

**Valid Diseases:**
- Diabetes
- Blood Pressure
- Cholesterol
- Thyroid
- Heart Health
- Liver Issues
- Arthritis
- PCOS (Female only)

**Special Rules:**
- Answer "n" or "N" → converts to null automatically
- PCOS is female-only (will reject if gender is male)
- Answers can be: string, number, boolean, or "n" (converts to null)

---

## 2. Get by Phone Number

### Request
```
GET /api/questionnaire/phone/:phoneNumber
```

**Example:**
```
GET /api/questionnaire/phone/923001234567
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phoneNumber": "923001234567",
    "name": "John Doe",
    "selectedConditions": ["Diabetes", "Blood Pressure"],
    "responses": {
      "age": 35,
      "gender": "male",
      "heightCm": 180,
      "weightKg": 75
    },
    "questionnaireAnswers": [
      {
        "disease": "Diabetes",
        "questionId": "q1",
        "question": "Do you have diabetes?",
        "answer": "yes"
      },
      {
        "disease": "Blood Pressure",
        "questionId": "q2",
        "question": "High BP history?",
        "answer": true
      }
    ],
    "completedAt": "2026-03-30T10:30:00.000Z",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

**Error Response (404 - Not Found):**
```json
{
  "success": false,
  "error": "Inquiry not found with this phone number"
}
```

**Error Response (400 - Invalid Input):**
```json
{
  "success": false,
  "error": "Phone number is required"
}
```

---

## 3. Get by ID

### Request
```
GET /api/questionnaire/by-id/:id
```

**Example:**
```
GET /api/questionnaire/by-id/507f1f77bcf86cd799439011
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phoneNumber": "923001234567",
    "name": "John Doe",
    "selectedConditions": ["Diabetes", "Blood Pressure"],
    "responses": {
      "age": 35,
      "gender": "male",
      "heightCm": 180,
      "weightKg": 75
    },
    "questionnaireAnswers": [
      {
        "disease": "Diabetes",
        "questionId": "q1",
        "question": "Do you have diabetes?",
        "answer": "yes"
      }
    ],
    "completedAt": "2026-03-30T10:30:00.000Z",
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "error": "Invalid ID format"
}
```

**Error Response (404 - Not Found):**
```json
{
  "success": false,
  "error": "Inquiry not found"
}
```

---

## 4. Get All Questionnaires (Paginated)

### Request
```
GET /api/questionnaire/all?page=1&limit=10
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number (starts at 1) |
| limit | Number | 10 | Records per page |

**Response (200 - Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phoneNumber": "923001234567",
      "name": "John Doe",
      "selectedConditions": ["Diabetes", "Blood Pressure"],
      "responses": {
        "age": 35,
        "gender": "male",
        "heightCm": 180,
        "weightKg": 75
      },
      "completedAt": "2026-03-30T10:30:00.000Z",
      "createdAt": "2026-03-30T10:30:00.000Z",
      "updatedAt": "2026-03-30T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "phoneNumber": "923009876543",
      "name": "Jane Smith",
      "selectedConditions": ["PCOS", "Thyroid"],
      "responses": {
        "age": 28,
        "gender": "female",
        "heightCm": 165,
        "weightKg": 62
      },
      "completedAt": "2026-03-30T10:25:00.000Z",
      "createdAt": "2026-03-30T10:25:00.000Z",
      "updatedAt": "2026-03-30T10:25:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

**Note:** `questionnaireAnswers` are excluded from this endpoint for performance.

---

## 5. Update Questionnaire

### Request
```
PUT /api/questionnaire/:id
Content-Type: application/json
```

**Body (All fields optional):**
```json
{
  "answers": [
    {
      "disease": "Diabetes",
      "questionId": "q1",
      "question": "Updated question?",
      "answer": "updated answer"
    }
  ],
  "age": 36,
  "gender": "female",
  "height": 175,
  "weight": 72
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Inquiry updated successfully",
  "data": {
    "inquiryId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "phoneNumber": "923001234567",
    "answersCount": 1,
    "updatedAt": "2026-03-30T11:00:00.000Z"
  }
}
```

**Error Response (404 - Not Found):**
```json
{
  "success": false,
  "error": "Inquiry not found"
}
```

**Error Response (400 - Invalid Answers):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Answer at index 0: disease field is required and must be a string",
    "Answer at index 0: Invalid disease \"InvalidDisease\""
  ]
}
```

---

## 6. Get Statistics Summary

### Request
```
GET /api/questionnaire/stats/summary
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "totalInquiries": 45,
    "diseaseStats": [
      {
        "_id": "Diabetes",
        "count": 15
      },
      {
        "_id": "Blood Pressure",
        "count": 12
      },
      {
        "_id": "Thyroid",
        "count": 10
      },
      {
        "_id": "PCOS",
        "count": 8
      },
      {
        "_id": "Cholesterol",
        "count": 6
      },
      {
        "_id": "Heart Health",
        "count": 3
      },
      {
        "_id": "Arthritis",
        "count": 2
      },
      {
        "_id": "Liver Issues",
        "count": 1
      }
    ],
    "genderStats": [
      {
        "_id": "male",
        "count": 28
      },
      {
        "_id": "female",
        "count": 17
      }
    ]
  }
}
```

---

## Common Error Responses

**500 - Server Error:**
```json
{
  "success": false,
  "error": "Failed to save questionnaire",
  "message": "MongoDB connection error"
}
```

**400 - Validation Error (Multiple Issues):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "PCOS is only applicable for Female gender",
    "Invalid disease at index 2: \"Cancer\""
  ]
}
```

---

## Frontend Integration Example (JavaScript/React)

```javascript
// Create/Update
const createQuestionnaire = async (data) => {
  const response = await fetch(
    'http://localhost:5000/api/questionnaire/create',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  return response.json();
};

// Get by phone
const getByPhone = async (phone) => {
  const response = await fetch(
    `http://localhost:5000/api/questionnaire/phone/${phone}`
  );
  return response.json();
};

// Get by ID
const getById = async (id) => {
  const response = await fetch(
    `http://localhost:5000/api/questionnaire/by-id/${id}`
  );
  return response.json();
};

// Get all (paginated)
const getAll = async (page = 1, limit = 10) => {
  const response = await fetch(
    `http://localhost:5000/api/questionnaire/all?page=${page}&limit=${limit}`
  );
  return response.json();
};

// Update
const updateQuestionnaire = async (id, data) => {
  const response = await fetch(
    `http://localhost:5000/api/questionnaire/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  );
  return response.json();
};

// Get stats
const getStats = async () => {
  const response = await fetch(
    `http://localhost:5000/api/questionnaire/stats/summary`
  );
  return response.json();
};
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Key Rules for Frontend Developer

1. **Answer Conversion:** Send "n" or "N" to represent null values - backend converts automatically
2. **Gender Format:** Always lowercase ("male" or "female")
3. **PCOS Restriction:** Only allow PCOS selection if gender is female
4. **Phone Format:** Store WhatsApp phone numbers as strings
5. **Diseases Array:** Must be non-empty array with valid disease names
6. **Pagination:** Default page=1, limit=10 for all list requests
7. **IDs:** MongoDB ObjectIDs are 24-character hex strings

