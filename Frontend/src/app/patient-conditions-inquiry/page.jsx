/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  User,
  Phone,
  Mail,
  Activity,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";

// Use localhost for development, Render for production
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://nutribot-backend-9e3a.onrender.com"
    : "http://localhost:5000";

const diseaseQuestions: Record<string, any[]> = {
  diabetes: [
    {
      id: "fasting_sugar",
      question: "Fasting sugar level (mg/dL)",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "postmeal_sugar",
      question: "Post-meal sugar level (mg/dL)",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "hba1c",
      question: "HbA1c level",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "diabetes_medication",
      question: "Diabetes medication",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  blood_pressure: [
    {
      id: "systolic_bp",
      question: "Systolic BP (upper value)",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "diastolic_bp",
      question: "Diastolic BP (lower value)",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "bp_medication",
      question: "BP medication",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  cholesterol: [
    {
      id: "total_cholesterol",
      question: "Total cholesterol level",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
  ],
  thyroid: [
    {
      id: "tsh_level",
      question: "TSH level",
      type: "text",
      placeholder: "Enter value or 'n'",
    },
    {
      id: "thyroid_type",
      question: "Thyroid type",
      type: "radio",
      options: ["Hypothyroid", "Hyperthyroid", "Not sure"],
    },
  ],
  heart_health: [
    {
      id: "heart_diagnosis",
      question: "Diagnosed with heart issues",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  liver_issues: [
    {
      id: "fatty_liver",
      question: "Fatty liver issues",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  arthritis: [
    {
      id: "pain_issue",
      question: "Pain issue description",
      type: "text",
      placeholder: "Describe your pain",
    },
  ],
  pcos: [
    {
      id: "menstrual_cycle",
      question: "Menstrual cycle regular",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
};

// Display names for UI
const diseaseDisplayNames: Record<string, string> = {
  diabetes: "Diabetes",
  blood_pressure: "Blood Pressure",
  cholesterol: "Cholesterol",
  thyroid: "Thyroid",
  heart_health: "Heart Health",
  liver_issues: "Liver Issues",
  arthritis: "Arthritis",
  pcos: "PCOS",
};

interface FormData {
  diseases: string[];
  name: string;
  phone: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  email: string;
  conditionDetails: Record<string, Record<string, any>>;
}

type ToastType = "success" | "error" | "warn";

function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: ToastType;
  onClose: () => void;
}) {
  const colors: Record<ToastType, string> = {
    success: "bg-emerald-50 border-emerald-400 text-emerald-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warn: "bg-amber-50 border-amber-400 text-amber-800",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warn: <Info className="w-5 h-5 text-amber-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${colors[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium leading-snug flex-1">{msg}</span>
      <button
        onClick={onClose}
        className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function App() {
  const [form, setForm] = useState<FormData>({
    diseases: [],
    name: "",
    phone: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    email: "",
    conditionDetails: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(
    null,
  );

  // wake up Render's free tier on mount
  useEffect(() => {
    const wake = async () => {
      try {
        await fetch(`${BASE_URL}/api/patient/all?page=1&limit=1`);
        setBackendReady(true);
      } catch {
        setBackendReady(true); // still let user try even if ping fails
      }
    };
    wake();
  }, []);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // hide PCOS if gender is Male
  const availableDiseases = Object.keys(diseaseQuestions).filter(
    (d) => d !== "pcos" || form.gender === "" || form.gender === "Female",
  );

  const handleDiseaseChange = (disease: string) => {
    if (form.diseases.includes(disease)) {
      const newDiseases = form.diseases.filter((d) => d !== disease);
      const newDetails = { ...form.conditionDetails };
      delete newDetails[disease];
      setForm({ ...form, diseases: newDiseases, conditionDetails: newDetails });
    } else {
      setForm({
        ...form,
        diseases: [...form.diseases, disease],
        conditionDetails: { ...form.conditionDetails, [disease]: {} },
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    // if gender switches to Male, auto-remove PCOS
    if (name === "gender" && value === "Male") {
      const newDiseases = form.diseases.filter((d) => d !== "pcos");
      const newDetails = { ...form.conditionDetails };
      delete newDetails["pcos"];
      setForm({
        ...form,
        gender: value,
        diseases: newDiseases,
        conditionDetails: newDetails,
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleConditionDetailChange = (
    disease: string,
    questionId: string,
    value: any,
  ) => {
    setForm({
      ...form,
      conditionDetails: {
        ...form.conditionDetails,
        [disease]: { ...form.conditionDetails[disease], [questionId]: value },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) return showToast("Full name is required.", "warn");
    if (!form.phone.trim())
      return showToast("Phone number is required.", "warn");
    if (!form.email.trim())
      return showToast("Email address is required.", "warn");
    if (!form.age) return showToast("Age is required.", "warn");
    if (!form.gender) return showToast("Please select a gender.", "warn");
    if (!form.weight.trim()) return showToast("Weight is required.", "warn");

    setIsSubmitting(true);

    try {
      // Map question IDs to proper schema field names
      const fieldMapping: Record<string, Record<string, string>> = {
        diabetes: {
          fasting_sugar: "fastingSugar",
          postmeal_sugar: "postMealSugar",
          hba1c: "hba1c",
          diabetes_medication: "medication",
        },
        blood_pressure: {
          systolic_bp: "systolic",
          diastolic_bp: "diastolic",
          bp_medication: "medication",
        },
        cholesterol: {
          total_cholesterol: "totalCholesterol",
        },
        thyroid: {
          tsh_level: "tsh",
          thyroid_type: "thyroidType",
        },
        heart_health: {
          heart_diagnosis: "diagnosed",
        },
        pcos: {
          menstrual_cycle: "cycleRegular",
        },
        liver_issues: {
          fatty_liver: "fattyLiver",
        },
        arthritis: {
          pain_issue: "issue",
        },
      };

      // Build conditions object with proper field names
      const conditions: Record<string, any> = {};
      Object.entries(form.conditionDetails).forEach(([disease, details]) => {
        const schemaDiseaseName =
          disease === "blood_pressure"
            ? "bloodPressure"
            : disease === "heart_health"
              ? "heartHealth"
              : disease === "liver_issues"
                ? "liverIssues"
                : disease === "arthritis"
                  ? "arthritisJointPain"
                  : disease === "cholesterol"
                    ? "cholesterolLipids"
                    : disease;

        const mapping = fieldMapping[disease] || {};
        const conditionData: Record<string, any> = {};

        Object.entries(details).forEach(([qId, val]) => {
          const fieldName = mapping[qId] || qId;
          const strVal = String(val ?? "").trim();

          // Convert values
          if (strVal === "" || strVal.toLowerCase() === "n") {
            conditionData[fieldName] = null;
          } else if (
            fieldName === "medication" ||
            fieldName === "cycleRegular" ||
            fieldName === "diagnosed" ||
            fieldName === "fattyLiver"
          ) {
            // Boolean fields
            conditionData[fieldName] = strVal.toLowerCase() === "yes";
          } else if (
            fieldName === "fastingSugar" ||
            fieldName === "postMealSugar" ||
            fieldName === "hba1c" ||
            fieldName === "totalCholesterol" ||
            fieldName === "systolic" ||
            fieldName === "diastolic" ||
            fieldName === "tsh"
          ) {
            // Numeric fields
            conditionData[fieldName] = parseFloat(strVal) || null;
          } else {
            // String fields
            conditionData[fieldName] = strVal || null;
          }
        });

        conditions[schemaDiseaseName] = conditionData;
      });

      // height: number if parseable, else omit entirely
      const heightNum = parseFloat(form.height);

      const payload = {
        phoneNumber: form.phone.trim(),
        email: form.email.trim(),
        name: form.name.trim(),
        selectedConditions: form.diseases,
        responses: {
          gender: form.gender.toLowerCase(),
          age: Number(form.age),
          weightKg: parseFloat(form.weight),
          ...(Number.isFinite(heightNum) ? { heightCm: heightNum } : {}),
          ...(form.diseases.length > 0 ? { conditions } : {}),
        },
      };

      const res = await fetch(`${BASE_URL}/api/questionnaire/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = Array.isArray(data?.details)
          ? data.details.join("\n")
          : (data?.error ?? "Submission failed.");
        throw new Error(detail);
      }

      showToast("✅ Submitted successfully!", "success");

      // reset form
      setForm({
        diseases: [],
        name: "",
        phone: "",
        age: "",
        gender: "",
        height: "",
        weight: "",
        email: "",
        conditionDetails: {},
      });
    } catch (err: any) {
      console.error("❌ Error:", err);
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 font-sans selection:bg-[#71d2ba]/30">
      <AnimatePresence>
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#71d2ba] to-[#468374] px-8 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Health Assessment
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-lg"
              >
                Complete your profile for personalized nutrition guidance
              </motion.p>
            </div>
          </div>

          {/* backend waking up banner */}
          <AnimatePresence>
            {!backendReady && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-50 border-b border-amber-200"
              >
                <div className="px-8 py-3 flex items-center gap-3 text-amber-800 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>
                    Waking up the server — this may take up to 30 seconds on
                    first load...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="p-8 space-y-12">
            {/* ── 1. Medical Conditions ─────────────────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#71d2ba]/20 flex items-center justify-center text-[#468374] font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Medical Conditions
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableDiseases.map((disease) => (
                  <motion.div
                    key={disease}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDiseaseChange(disease)}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${form.diseases.includes(disease)
                      ? "border-[#468374] bg-[#468374]/5 shadow-md shadow-[#468374]/10"
                      : "border-slate-100 bg-slate-50/50 hover:border-[#71d2ba] hover:bg-white"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mb-3 flex items-center justify-center transition-colors ${form.diseases.includes(disease)
                        ? "border-[#468374] bg-[#468374]"
                        : "border-slate-300 group-hover:border-[#71d2ba]"
                        }`}
                    >
                      {form.diseases.includes(disease) && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-semibold text-center transition-colors ${form.diseases.includes(disease)
                        ? "text-[#468374]"
                        : "text-slate-600"
                        }`}
                    >
                      {diseaseDisplayNames[disease]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── Dynamic Condition Questions ───────────────────────── */}
            <AnimatePresence>
              {form.diseases.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-8"
                >
                  {form.diseases.map((disease) => (
                    <motion.div
                      key={disease}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100"
                    >
                      <h3 className="text-md font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#468374]" />
                        {diseaseDisplayNames[disease]} Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {diseaseQuestions[disease]?.map((q) => (
                          <div key={q.id} className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 ml-1">
                              {q.question}
                            </label>

                            {q.type === "select" ? (
                              <div className="relative">
                                <select
                                  value={
                                    form.conditionDetails[disease]?.[q.id] ?? ""
                                  }
                                  onChange={(e) =>
                                    handleConditionDetailChange(
                                      disease,
                                      q.id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all appearance-none"
                                >
                                  <option value="">Select option</option>
                                  {q.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                            ) : q.type === "radio" ? (
                              <div className="flex gap-4 p-1">
                                {q.options?.map((opt: string) => (
                                  <label
                                    key={opt}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.conditionDetails[disease]?.[q.id] ===
                                      opt
                                      ? "border-[#468374] bg-[#468374]/5 text-[#468374]"
                                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                      }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`${disease}_${q.id}`}
                                      value={opt}
                                      checked={
                                        form.conditionDetails[disease]?.[
                                        q.id
                                        ] === opt
                                      }
                                      onChange={(e) =>
                                        handleConditionDetailChange(
                                          disease,
                                          q.id,
                                          e.target.value,
                                        )
                                      }
                                      className="hidden"
                                    />
                                    <span className="text-sm font-medium">
                                      {opt}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={
                                  form.conditionDetails[disease]?.[q.id] ?? ""
                                }
                                onChange={(e) =>
                                  handleConditionDetailChange(
                                    disease,
                                    q.id,
                                    e.target.value,
                                  )
                                }
                                placeholder={q.placeholder}
                                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── 2. Personal Information ───────────────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-[#71d2ba]/20 flex items-center justify-center text-[#468374] font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 ml-1">
                    <User className="w-4 h-4" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 ml-1">
                    <Mail className="w-4 h-4" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 ml-1">
                    <Phone className="w-4 h-4" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. 923001234567"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="25"
                    required
                    min={1}
                    max={120}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {["Male", "Female"].map((g) => (
                      <label
                        key={g}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.gender === g
                          ? "border-[#468374] bg-[#468374]/5 text-[#468374]"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                          }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={form.gender === g}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="text-sm font-semibold">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="70"
                    required
                    min={1}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">
                    Height (cm)
                  </label>
                  <input
                    type="text"
                    name="height"
                    value={form.height}
                    onChange={handleChange}
                    placeholder="175 or 'n'"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-[#468374] focus:ring-4 focus:ring-[#71d2ba]/10 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || !backendReady}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${isSubmitting || !backendReady
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-[#71d2ba] to-[#468374] text-white shadow-[#468374]/20 hover:shadow-[#468374]/40"
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : !backendReady ? (
                "Waiting for Server..."
              ) : (
                "Complete Assessment"
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Your data is secure and will only be used for health assessment
          purposes.
        </p>
      </div>
    </div>
  );
}