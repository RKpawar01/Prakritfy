"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
  Droplet,
  Thermometer,
  Shield,
  Waves,
  Bone,
  Sparkles,
  ArrowRight,
  ClipboardList,
  BarChart3,
  Crown,
  Gem,
  Star,
  Leaf,
  TrendingUp,
  Zap,
} from "lucide-react";
import Footer from "@/components/Universal/Footer";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";

// Use Render production API only
const BASE_URL = "https://nutribot-backend-9e3a.onrender.com";

const diseaseQuestions: Record<string, any[]> = {
  diabetes: [
    {
      id: "fasting_sugar",
      question: "Fasting sugar level (mg/dL)",
      type: "text",
      placeholder: "    Enter value",
    },
    {
      id: "postmeal_sugar",
      question: "Post-meal sugar level (mg/dL)",
      type: "text",
      placeholder: "  Enter value",
    },
    {
      id: "hba1c",
      question: "HbA1c level",
      type: "text",
      placeholder: "  Enter value",
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
      placeholder: "  Enter value",
    },
    {
      id: "diastolic_bp",
      question: "Diastolic BP (lower value)",
      type: "text",
      placeholder: "  Enter value",
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
      placeholder: "  Enter value",
    },
  ],
  thyroid: [
    {
      id: "tsh_level",
      question: "TSH level",
      type: "text",
      placeholder: "    Enter value",
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

// Display names and icons for UI
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

const diseaseIcons: Record<string, React.ReactNode> = {
  diabetes: <Droplet className="w-5 h-5" />,
  blood_pressure: <Activity className="w-5 h-5" />,
  cholesterol: <BarChart3 className="w-5 h-5" />,
  thyroid: <Thermometer className="w-5 h-5" />,
  heart_health: <Heart className="w-5 h-5" />,
  liver_issues: <Shield className="w-5 h-5" />,
  arthritis: <Bone className="w-5 h-5" />,
  pcos: <Waves className="w-5 h-5" />,
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
    success:
      "bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-xl border-emerald-200/50 text-emerald-800",
    error:
      "bg-gradient-to-r from-red-50 to-rose-50 backdrop-blur-xl border-red-200/50 text-red-800",
    warn: "bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-xl border-amber-200/50 text-amber-800",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warn: <Info className="w-5 h-5 text-amber-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl max-w-sm ${colors[type]}`}
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

export default function EmeraldPremiumHealthForm() {
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
  const [activeSection, setActiveSection] = useState<string>("conditions");
  const [hoveredDisease, setHoveredDisease] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // wake up Render's free tier on mount and set mounted flag
  useEffect(() => {
    setMounted(true);
    const wake = async () => {
      try {
        await fetch(`${BASE_URL}/api/questionnaire/all?page=1&limit=1`);
        setBackendReady(true);
      } catch {
        setBackendReady(true);
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
    setIsSubmitting(true);

    try {
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

          if (strVal === "" || strVal.toLowerCase() === "n") {
            conditionData[fieldName] = null;
          } else if (
            fieldName === "medication" ||
            fieldName === "cycleRegular" ||
            fieldName === "diagnosed" ||
            fieldName === "fattyLiver"
          ) {
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
            conditionData[fieldName] = parseFloat(strVal) || null;
          } else {
            conditionData[fieldName] = strVal || null;
          }
        });

        conditions[schemaDiseaseName] = conditionData;
      });

      const heightNum = parseFloat(form.height);

      const payload = {
        phoneNumber: form.phone.trim(),
        name: form.name.trim(),
        ...(form.email && form.email.trim()
          ? { email: form.email.trim() }
          : {}),
        selectedConditions: form.diseases,
        responses: {
          ...(form.gender ? { gender: form.gender.toLowerCase() } : {}),
          ...(form.age ? { age: Number(form.age) } : {}),
          ...(form.weight ? { weightKg: parseFloat(form.weight) } : {}),
          ...(Number.isFinite(heightNum) ? { heightCm: heightNum } : {}),
          ...(form.diseases.length > 0 ? { conditions } : {}),
        },
      };

      console.log(
        "📤 Sending payload to backend:",
        JSON.stringify(payload, null, 2),
      );

      const res = await fetch(`${BASE_URL}/api/questionnaire/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("📥 Response from backend:", data);

      if (!res.ok) {
        const detail = Array.isArray(data?.details)
          ? data.details.join("\n")
          : (data?.error ?? "Submission failed.");
        throw new Error(detail);
      }

      showToast("✨ Assessment submitted successfully!", "success");

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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-green-950  px-4 font-sans selection:bg-emerald-400/30 overflow-hidden relative">
      {/* Animated gradient orbs - Green theme */}
      <NavbarDemo />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 via-green-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-emerald-400/20 via-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-400/10 via-green-400/10 to-teal-400/10 rounded-full blur-3xl animate-spin-slow" />

        {/* Floating particles - only render on client after mount */}
        {mounted &&
          [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 5}s`,
              }}
            />
          ))}
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Floating Navigation - Premium Green */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-6 z-40 mb-8 hidden md:flex justify-center"
        >
          <div className="bg-white/10 backdrop-blur-2xl rounded-full shadow-2xl border border-white/20 p-1.5 flex gap-3">
            {[
              {
                id: "conditions",
                label: "Conditions",
                icon: <Activity className="w-8 h-4 pr-5 m-3" />,
              },
              {
                id: "personal",
                label: "Personal Info",
                icon: <User className="w-8 h-4 pr-5 m-3" />,
              },
            ].map((section) => (
              <div
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? "text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                {activeSection === section.id && (
                  <motion.div
                    layoutId="active-nav-green"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {section.icon}
                  {section.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Backend waking banner */}
        <AnimatePresence>
          {!backendReady && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-6 py-4 flex items-center gap-3 text-emerald-200 shadow-xl">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">
                  Initializing secure connection — this may take a few
                  moments...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative"
        >
          {/* Glow effect - Green */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 rounded-3xl blur-2xl opacity-50" />

          {/* Main card */}
          <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Premium Header with Emerald gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 px-8 py-12">
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              />

              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-40 -mb-40 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mb-3"
                  >
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg">
                      <Leaf className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                      Prakritify Health Assessment
                    </h1>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/90 text-lg max-w-2xl"
                  >
                    Personalized wellness insights powered by nature & science
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-3"
                >
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/30 shadow-lg">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Star className="w-4 h-4" />
                      <span>Confidential</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Premium badge */}
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-12">
              {/* ── 1. Medical Conditions ─────────────────────────────── */}
              <section id="conditions">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    01
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
                    Medical Conditions
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent ml-4" />
                </div>

                <div className="mb-4">
                  <div className="text-sm text-white/60 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Select all conditions that apply
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {availableDiseases.map((disease) => (
                    <motion.div
                      key={disease}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.97 }}
                      onHoverStart={() => setHoveredDisease(disease)}
                      onHoverEnd={() => setHoveredDisease(null)}
                      onClick={() => handleDiseaseChange(disease)}
                      className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer transition-all duration-500 ${
                        form.diseases.includes(disease)
                          ? "bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/20"
                          : "bg-white/5 border border-white/10 hover:border-emerald-400/30 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                          form.diseases.includes(disease)
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg"
                            : "bg-white/10 text-white/40 group-hover:bg-white/20 group-hover:text-emerald-400"
                        }`}
                      >
                        {diseaseIcons[disease]}
                      </div>
                      <span
                        className={`text-sm font-semibold text-center transition-colors ${
                          form.diseases.includes(disease)
                            ? "text-emerald-300"
                            : "text-white/60 group-hover:text-white"
                        }`}
                      >
                        {diseaseDisplayNames[disease]}
                      </span>
                      {form.diseases.includes(disease) && (
                        <motion.div
                          layoutId="active-dot-emerald"
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white/20 shadow-lg"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white m-1" />
                        </motion.div>
                      )}
                      {hoveredDisease === disease &&
                        !form.diseases.includes(disease) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 rounded-2xl border border-emerald-400/30 shadow-lg shadow-emerald-500/20 pointer-events-none"
                          />
                        )}
                    </motion.div>
                  ))}
                </div>

                {form.diseases.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full border border-emerald-400/30">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">
                        {form.diseases.length} condition
                        {form.diseases.length !== 1 ? "s" : ""} selected
                      </span>
                    </div>
                  </motion.div>
                )}
              </section>

              {/* ── Dynamic Condition Questions ───────────────────────── */}
              <AnimatePresence>
                {form.diseases.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        Condition Details
                      </h3>
                    </div>

                    {form.diseases.map((disease) => (
                      <motion.div
                        key={disease}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-emerald-400/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
                          <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl text-emerald-400">
                            {diseaseIcons[disease]}
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {diseaseDisplayNames[disease]} Assessment
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {diseaseQuestions[disease]?.map((q) => (
                            <div key={q.id} className="space-y-2">
                              <label className="text-sm font-semibold text-white/70 ml-1">
                                {q.question}
                              </label>

                              {q.type === "select" ? (
                                <div className="relative">
                                  <select
                                    value={
                                      form.conditionDetails[disease]?.[q.id] ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleConditionDetailChange(
                                        disease,
                                        q.id,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full p-3 pr-10 bg-white border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                                  >
                                    <option value="" className="bg-white">
                                      Select option
                                    </option>
                                    {q.options?.map((opt: string) => (
                                      <option
                                        key={opt}
                                        value={opt}
                                        className="bg-white"
                                      >
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                              ) : q.type === "radio" ? (
                                <div className="flex gap-3 flex-wrap">
                                  {q.options?.map((opt: string) => (
                                    <label
                                      key={opt}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                                        form.conditionDetails[disease]?.[
                                          q.id
                                        ] === opt
                                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                                          : "border-white/20 bg-white/5 text-white/60 hover:border-emerald-400/50 hover:bg-white/10"
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
                                  className="w-full p-3 bg-white border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all"
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
              <section id="personal">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    02
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
                    Personal Information
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  {/* Full Name */}
                  <div className="space-y-2 group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white/70 ml-1">
                      <User className="w-4 h-4 text-emerald-400" />
                      Full Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="     Enter your full name"
                      required
                      className="w-full p-3.5 bg-white border border-white/20 rounded-xl text-white placeholder-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all group-hover:border-white/30"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-2 group">
                    <label className="text-sm font-semibold text-white/70 ml-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="   Enter your age"
                      min={1}
                      max={120}
                      className="w-full p-3.5 bg-white border border-white/20 rounded-xl text-white placeholder-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all group-hover:border-white"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/70 ml-1">
                      Gender
                    </label>
                    <div className="flex gap-4">
                      {["Male", "Female"].map((g) => (
                        <label
                          key={g}
                          className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            form.gender === g
                              ? "border-emerald-400 bg-emerald-500 text-emerald-300 shadow-lg"
                              : "border-white/20 bg-white/5 text-white/60 hover:border-emerald-400/50 hover:bg-white/10"
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
                  <div className="space-y-2 group">
                    <label className="text-sm font-semibold text-white/70 ml-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      placeholder="     Enter your weight"
                      min={1}
                      className="w-full p-3.5 bg-white border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all group-hover:border-white/30"
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-2 group">
                    <label className="text-sm font-semibold text-white/70 ml-1">
                      Height (cm)
                    </label>
                    <input
                      type="text"
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      placeholder="     Enter height or 'n'"
                      className="w-full p-3.5 bg-white border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all group-hover:border-white/30"
                    />
                    <div className="text-xs text-white/40 mt-1 ml-1">
                      Enter 'n' if not known
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white/70 ml-1">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      Phone Number <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="     e.g. 923001234567"
                      required
                      className="w-full p-3.5 bg-white border border-white/20 rounded-xl text-white placeholder-black focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all group-hover:border-white/30"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2 group md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white/70 ml-1">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full p-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Premium Submit Button - Emerald Green */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition ${
                  isSubmitting
                    ? "bg-gray-500 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.5;
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
}
