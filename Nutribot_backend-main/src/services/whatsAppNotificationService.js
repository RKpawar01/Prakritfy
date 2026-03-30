const nodemailer = require("nodemailer");

const NOTIFICATION_EMAIL =
  process.env.WHATSAPP_INQUIRY_NOTIFICATION_EMAIL ||
  "arun.satija@progneur.com";

const CONDITION_LABELS = {
  diabetes: "Diabetes",
  cholesterolLipids: "Cholesterol / Lipids",
  bloodPressure: "Blood Pressure",
  heartHealth: "Heart Health",
  thyroid: "Thyroid",
  pcos: "PCOS",
  liverIssues: "Liver Issues",
  arthritisJointPain: "Arthritis / Joint Pain",
  none: "None",
};

function formatBoolean(value) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not provided";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function buildHtml(inquiry) {
  const responses = inquiry.responses || {};
  const conditions = responses.conditions || {};

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
      <h2>New WhatsApp Chronic Care Inquiry</h2>
      <p><strong>Name:</strong> ${formatValue(inquiry.name)}</p>
      <p><strong>Phone:</strong> ${formatValue(inquiry.phoneNumber)}</p>
      <p><strong>Age:</strong> ${formatValue(responses.age)}</p>
      <p><strong>Gender:</strong> ${formatValue(responses.gender)}</p>
      <p><strong>Height (cm):</strong> ${formatValue(responses.heightCm)}</p>
      <p><strong>Weight (kg):</strong> ${formatValue(responses.weightKg)}</p>
      <p><strong>Selected conditions:</strong> ${formatValue(
        inquiry.selectedConditions
          ?.map((condition) => CONDITION_LABELS[condition] || condition)
          .join(", ")
      )}</p>
      <hr />
      <h3>Condition Details</h3>
      <p><strong>Diabetes fasting sugar:</strong> ${formatValue(
        conditions.diabetes?.fastingSugar
      )}</p>
      <p><strong>Diabetes post-meal sugar:</strong> ${formatValue(
        conditions.diabetes?.postMealSugar
      )}</p>
      <p><strong>Diabetes HbA1c:</strong> ${formatValue(conditions.diabetes?.hba1c)}</p>
      <p><strong>Diabetes medication:</strong> ${formatBoolean(
        conditions.diabetes?.medication
      )}</p>
      <p><strong>Total cholesterol:</strong> ${formatValue(
        conditions.cholesterolLipids?.totalCholesterol
      )}</p>
      <p><strong>Systolic BP:</strong> ${formatValue(
        conditions.bloodPressure?.systolic
      )}</p>
      <p><strong>Diastolic BP:</strong> ${formatValue(
        conditions.bloodPressure?.diastolic
      )}</p>
      <p><strong>BP medication:</strong> ${formatBoolean(
        conditions.bloodPressure?.medication
      )}</p>
      <p><strong>Heart diagnosis:</strong> ${formatBoolean(
        conditions.heartHealth?.diagnosed
      )}</p>
      <p><strong>TSH:</strong> ${formatValue(conditions.thyroid?.tsh)}</p>
      <p><strong>Thyroid type:</strong> ${formatValue(
        conditions.thyroid?.thyroidType
      )}</p>
      <p><strong>Fatty liver:</strong> ${formatBoolean(
        conditions.liverIssues?.fattyLiver
      )}</p>
      <p><strong>Joint pain issue:</strong> ${formatValue(
        conditions.arthritisJointPain?.issue
      )}</p>
      <p><strong>PCOS cycle regular:</strong> ${formatBoolean(
        conditions.pcos?.cycleRegular
      )}</p>
      <p><strong>PCOS skipped reason:</strong> ${formatValue(
        conditions.pcos?.skippedReason
      )}</p>
      <hr />
      <p><strong>Completed at:</strong> ${formatValue(inquiry.completedAt)}</p>
    </div>
  `;
}

async function sendWhatsAppInquiryNotification(inquiry) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(
      `📩 [DEV MODE] WhatsApp inquiry notification for ${inquiry.phoneNumber} -> ${NOTIFICATION_EMAIL}`
    );
    return;
  }

  await transporter.sendMail({
    from: `"NutriBot" <${process.env.EMAIL_USER}>`,
    to: NOTIFICATION_EMAIL,
    subject: "New WhatsApp Chronic Care Inquiry",
    html: buildHtml(inquiry),
  });
}

module.exports = {
  sendWhatsAppInquiryNotification,
};
