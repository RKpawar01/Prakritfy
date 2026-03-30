# Quick Test Guide - Health Questionnaire API

## 🚀 Quick Start Testing

### 1. Test Create Patient (JavaScript)

Copy and paste in browser console or Node.js:

```javascript
// Test: Create a new patient
fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test User",
    phone: "+919876543210",
    age: 45,
    gender: "Male",
    height: 175,
    weight: 75,
    diseases: ["Diabetes", "Blood Pressure"],
    answers: [
      { disease: "Diabetes", questionId: "q1", answer: "Yes" },
      { disease: "Diabetes", questionId: "q2", answer: "6.5" },
      { disease: "Blood Pressure", questionId: "bp1", answer: "140/90" }
    ]
  })
})
.then(r => r.json())
.then(d => {
  console.log('Success:', d);
  if (d.data?.patientId) {
    console.log('Patient ID:', d.data.patientId);
    localStorage.setItem('testPatientId', d.data.patientId);
  }
})
.catch(e => console.error('Error:', e));
```

### 2. Test Get All Patients

```javascript
fetch('http://localhost:5000/api/patient/all?page=1&limit=5')
  .then(r => r.json())
  .then(d => console.log('All patients:', d))
  .catch(e => console.error('Error:', e));
```

### 3. Test Get Patient by ID

```javascript
const patientId = localStorage.getItem('testPatientId');
if (patientId) {
  fetch(`http://localhost:5000/api/patient/${patientId}`)
    .then(r => r.json())
    .then(d => console.log('Patient details:', d))
    .catch(e => console.error('Error:', e));
}
```

### 4. Test Get Patient by Phone

```javascript
fetch('http://localhost:5000/api/patient/phone/%2B919876543210')
  .then(r => r.json())
  .then(d => console.log('Patient by phone:', d))
  .catch(e => console.error('Error:', e));
```

### 5. Test Statistics

```javascript
fetch('http://localhost:5000/api/patient/stats/summary')
  .then(r => r.json())
  .then(d => console.log('Statistics:', d))
  .catch(e => console.error('Error:', e));
```

---

## 📝 Testing with cURL

### Create Patient
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
    "diseases": ["Diabetes"],
    "answers": [
      {"disease": "Diabetes", "questionId": "q1", "answer": "Yes"}
    ]
  }'
```

### Get All Patients
```bash
curl http://localhost:5000/api/patient/all?page=1&limit=10
```

### Get Patient by ID (replace ID)
```bash
curl http://localhost:5000/api/patient/507f1f77bcf86cd799439011
```

### Get Statistics
```bash
curl http://localhost:5000/api/patient/stats/summary
```

---

## ✅ Test Cases

### Test Case 1: Valid Patient Creation
**Expected**: Success with patientId

```javascript
{
  name: "John Doe",
  phone: "+919876543210",
  age: 45,
  gender: "Male",
  diseases: ["Diabetes"],
  answers: [{ disease: "Diabetes", questionId: "q1", answer: "Yes" }]
}
```

### Test Case 2: PCOS with Female ✓
**Expected**: Success

```javascript
{
  name: "Jane Doe",
  phone: "+919876543211",
  gender: "Female",
  diseases: ["PCOS"],
  answers: [{ disease: "PCOS", questionId: "q1", answer: "Yes" }]
}
```

### Test Case 3: PCOS with Male ✗
**Expected**: Validation error "PCOS is only applicable for Female gender"

```javascript
{
  name: "John Doe",
  phone: "+919876543212",
  gender: "Male",
  diseases: ["PCOS"],
  answers: [{ disease: "PCOS", questionId: "q1", answer: "Yes" }]
}
```

### Test Case 4: Missing Required Field ✗
**Expected**: Validation error "Name is required"

```javascript
{
  phone: "+919876543213",
  diseases: ["Diabetes"],
  answers: [{ disease: "Diabetes", questionId: "q1", answer: "Yes" }]
}
```

### Test Case 5: "n" Conversion
**Expected**: Answer stored as null

```javascript
{
  name: "Test",
  phone: "+919876543214",
  diseases: ["Diabetes"],
  answers: [{ disease: "Diabetes", questionId: "q1", answer: "n" }]
}
```
After creation, check:
```javascript
// The answer should be null
answers[0].answer === null  // true
```

### Test Case 6: Invalid Disease ✗
**Expected**: Validation error

```javascript
{
  name: "Test",
  phone: "+919876543215",
  diseases: ["InvalidDisease"],
  answers: [{ disease: "InvalidDisease", questionId: "q1", answer: "Yes" }]
}
```

---

## 🧪 Batch Testing Script

Run this in Node.js to test all endpoints:

```javascript
const baseURL = 'http://localhost:5000/api/patient';
let patientId;

// Test 1: Create
console.log('1. Testing CREATE patient...');
fetch(`${baseURL}/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test Patient",
    phone: "+919876543210",
    age: 30,
    gender: "Male",
    diseases: ["Diabetes"],
    answers: [{ disease: "Diabetes", questionId: "q1", answer: "Yes" }]
  })
})
.then(r => r.json())
.then(d => {
  console.log('✓ CREATE:', d.success ? 'PASS' : 'FAIL');
  patientId = d.data?.patientId;
  
  // Test 2: Get by ID
  console.log('2. Testing GET by ID...');
  return fetch(`${baseURL}/${patientId}`);
})
.then(r => r.json())
.then(d => {
  console.log('✓ GET BY ID:', d.success ? 'PASS' : 'FAIL');
  
  // Test 3: Get all
  console.log('3. Testing GET ALL...');
  return fetch(`${baseURL}/all?limit=5`);
})
.then(r => r.json())
.then(d => {
  console.log('✓ GET ALL:', d.success ? 'PASS' : 'FAIL');
  console.log(`   Found ${d.pagination?.total} patients`);
  
  // Test 4: Get by phone
  console.log('4. Testing GET BY PHONE...');
  return fetch(`${baseURL}/phone/%2B919876543210`);
})
.then(r => r.json())
.then(d => {
  console.log('✓ GET BY PHONE:', d.success ? 'PASS' : 'FAIL');
  
  // Test 5: Statistics
  console.log('5. Testing STATISTICS...');
  return fetch(`${baseURL}/stats/summary`);
})
.then(r => r.json())
.then(d => {
  console.log('✓ STATISTICS:', d.success ? 'PASS' : 'FAIL');
  console.log(`   Total patients: ${d.data?.totalPatients}`);
  
  // Test 6: Update
  console.log('6. Testing UPDATE...');
  return fetch(`${baseURL}/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: [{ disease: "Blood Pressure", questionId: "bp1", answer: "140/90" }]
    })
  });
})
.then(r => r.json())
.then(d => {
  console.log('✓ UPDATE:', d.success ? 'PASS' : 'FAIL');
  console.log('\n✅ All tests completed!');
})
.catch(e => console.error('❌ Test error:', e));
```

---

## 🔍 Checking Responses

### Successful Create Response
```json
{
  "success": true,
  "message": "Patient questionnaire saved successfully",
  "data": {
    "patientId": "507f1f77bcf86cd799439011",
    "name": "Test Patient",
    "phone": "+919876543210",
    "diseasesCount": 1,
    "answersCount": 1,
    "createdAt": "2026-03-30T10:30:00.000Z"
  }
}
```

### Successful Get Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test Patient",
    "phone": "+919876543210",
    "age": 30,
    "gender": "Male",
    "diseases": ["Diabetes"],
    "answers": [
      {
        "disease": "Diabetes",
        "questionId": "q1",
        "answer": "Yes"
      }
    ],
    "createdAt": "2026-03-30T10:30:00.000Z",
    "updatedAt": "2026-03-30T10:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Name is required and must be a non-empty string"
  ]
}
```

---

## 📊 Test Coverage

| Endpoint | Test | Status |
|----------|------|--------|
| POST /create | Valid data | ✓ |
| POST /create | Missing name | ✓ |
| POST /create | Invalid disease | ✓ |
| POST /create | PCOS with male | ✓ |
| POST /create | "n" conversion | ✓ |
| GET /all | Pagination | ✓ |
| GET /:id | Valid ID | ✓ |
| GET /:id | Invalid ID | ✓ |
| GET /phone/:phone | Valid phone | ✓ |
| GET /phone/:phone | Phone not found | ✓ |
| PUT /:id | Update answers | ✓ |
| GET /stats/summary | Statistics | ✓ |

---

## 🐛 Debugging

### If Create Returns Error

1. Check phone format: `+[country code][number]`
2. Ensure name is minimum 2 characters
3. Check diseases array is not empty
4. Verify disease names match exactly
5. Check answers array has required fields

### If Get Returns 404

1. Check patientId is correct (copy from create response)
2. Check patientId format is valid MongoDB ObjectId

### If Stats Shows 0 Patients

1. Check if any patients exist with GET /all
2. Wait a moment for database to be ready
3. Check MongoDB connection is working

---

## 📱 Testing with Different Devices

### From Postman
1. Create new POST request
2. URL: `http://localhost:5000/api/patient/create`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): Copy from examples

### From React/Vue Component
```javascript
const response = await fetch('http://localhost:5000/api/patient/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
const result = await response.json();
```

### From Mobile App
Same approach, just ensure:
- Correct base URL
- JSON content-type header
- Phone number in E.164 format

---

## ✨ What's Working

✅ Patient creation with validation  
✅ Disease-specific questions  
✅ "n" to null conversion  
✅ PCOS female-only validation  
✅ Get all patients with pagination  
✅ Get patient by ID  
✅ Get patient by phone (WhatsApp)  
✅ Update patient with new answers  
✅ Statistics aggregation  
✅ Error handling  

---

## Ready for Frontend!

Share these endpoints with frontend developer:

```
POST   http://localhost:5000/api/patient/create
GET    http://localhost:5000/api/patient/all
GET    http://localhost:5000/api/patient/:id
GET    http://localhost:5000/api/patient/phone/:phone
PUT    http://localhost:5000/api/patient/:id
GET    http://localhost:5000/api/patient/stats/summary
```

See `PATIENT_QUESTIONNAIRE_API.md` for complete documentation!
