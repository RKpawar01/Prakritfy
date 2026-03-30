const axios = require("axios");
const WhatsAppInquiry = require("../models/WhatsAppInquiry");
const { sendWhatsAppInquiryNotification }
 = require("../services/whatsAppNotificationService");

const GRAPH_API_VERSION =
 process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";

/* ---------------------------------- */

const CONDITION_MAP = {
 "1":"diabetes",
 "2":"cholesterolLipids",
 "3":"bloodPressure",
 "4":"heartHealth",
 "5":"thyroid",
 "6":"pcos",
 "7":"liverIssues",
 "8":"arthritisJointPain"
};

/* clearer questions */

const CONDITION_FLOW = {

 diabetes:[

  {
   key:"fastingSugar",
   q:"Fasting sugar?\nExample: 95 mg/dL\n(Type number only or n)"
  },

  {
   key:"postMealSugar",
   q:"Post meal sugar?\nExample: 140 mg/dL\n(Type number only or n)"
  },

  {
   key:"hba1c",
   q:"HbA1c value?\nExample: 6.5\n(Type number only or n)"
  },

  {
   key:"medication",
   q:"Are you taking diabetes medicine?",
   type:"yesno"
  }

 ],

 bloodPressure:[

  {
   key:"systolic",
   q:"Systolic BP?\nExample: 120\n(Type number only or n)"
  },

  {
   key:"diastolic",
   q:"Diastolic BP?\nExample: 80\n(Type number only or n)"
  },

  {
   key:"medication",
   q:"Are you taking BP medicine?",
   type:"yesno"
  }

 ],

 cholesterolLipids:[

  {
   key:"totalCholesterol",
   q:"Total cholesterol?\nExample: 180 mg/dL\n(Type number only or n)"
  }

 ],

 thyroid:[

  {
   key:"tsh",
   q:"TSH value?\nExample: 2.5\n(Type number only or n)"
  }

 ],

 heartHealth:[

  {
   key:"diagnosed",
   q:"Have you been diagnosed with heart disease?",
   type:"yesno"
  }

 ],

 liverIssues:[

  {
   key:"fattyLiver",
   q:"Have you been diagnosed with fatty liver?",
   type:"yesno"
  }

 ],

 arthritisJointPain:[

  {
   key:"issue",
   q:"Which joint has pain?\nExample: knee / back / shoulder"
  }

 ],

 pcos:[

  {
   key:"cycleRegular",
   q:"Is menstrual cycle regular?",
   type:"yesno"
  }
]

};

/* patient details */

const GENERAL_FLOW = [

 {key:"name", q:"Patient name?"},

 {key:"age", q:"Age?\nExample: 35"},

 {key:"gender", q:"Select gender", type:"gender"},

 {key:"heightCm", q:"Height?\nExample: 170 cm"},

 {key:"weightKg", q:"Weight?\nExample: 65 kg"}

];

/* ---------------------------------- */

function apiUrl(){

 return `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

}

function headers(){

 return {

  Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`,

  "Content-Type":"application/json"

 };

}

/* ---------------------------------- */

async function sendText(to,text){

 return axios.post(

  apiUrl(),

  {

   messaging_product:"whatsapp",

   to,

   text:{body:text}

  },

  {headers:headers()}

 );

}

async function sendYesNo(to,text){

 return axios.post(

  apiUrl(),

  {

   messaging_product:"whatsapp",

   to,

   type:"interactive",

   interactive:{

    type:"button",

    body:{text},

    action:{

     buttons:[

      {type:"reply",reply:{id:"yes",title:"Yes"}},

      {type:"reply",reply:{id:"no",title:"No"}}

     ]

    }

   }

  },

  {headers:headers()}

 );

}

async function sendGender(to){

 return axios.post(

  apiUrl(),

  {

   messaging_product:"whatsapp",

   to,

   type:"interactive",

   interactive:{

    type:"button",

    body:{text:"Select gender"},

    action:{

     buttons:[

      {type:"reply",reply:{id:"male",title:"Male"}},

      {type:"reply",reply:{id:"female",title:"Female"}}

     ]

    }

   }

  },

  {headers:headers()}

 );

}

/* condition selection */

async function sendConditionList(phone, selected=[]){

 const selectedText =
 selected.length
 ? `\n\nSelected:\n• ${selected.join("\n• ")}`
 : "";

 return axios.post(

  apiUrl(),

  {

   messaging_product:"whatsapp",

   to:phone,

   type:"interactive",

   interactive:{

    type:"list",

    body:{

text:
`Select your health condition(s).

You can select multiple.
Click *Done* when finished.${selectedText}`

    },

    action:{

     button:"Select",

     sections:[

      {

       title:"Conditions",

       rows:[

        {id:"1",title:"Diabetes"},

        {id:"2",title:"Cholesterol"},

        {id:"3",title:"Blood Pressure"},

        {id:"4",title:"Heart"},

        {id:"5",title:"Thyroid"},

        {id:"6",title:"PCOS"},

        {id:"7",title:"Liver"},

        {id:"8",title:"Arthritis"},

        {id:"done",title:"✅ Done selecting"}

       ]

      }

     ]

    }

   }

  },

  {headers:headers()}

 );

}

/* ---------------------------------- */

async function sendPatientList(phone){

 const patients =
 await WhatsAppInquiry.aggregate([

  { $match:{ phoneNumber:phone, name:{$ne:null} } },

  { $sort:{createdAt:-1} },

  { $group:{ _id:"$name", doc:{$first:"$$ROOT"} } },

  { $replaceRoot:{newRoot:"$doc"} }

 ]);

 if(!patients.length){

  return startNewInquiry(phone);

 }

 const rows = patients.map(p=>({

  id:`patient_${p._id}`,

  title:p.name

 }));

 rows.push({

  id:"new_patient",

  title:"New Patient"

 });

 return axios.post(

  apiUrl(),

  {

   messaging_product:"whatsapp",

   to:phone,

   type:"interactive",

   interactive:{

    type:"list",

    body:{text:"Select patient"},

    action:{

     button:"Choose",

     sections:[{title:"Patients",rows}]

    }

   }

  },

  {headers:headers()}

 );

}

/* ---------------------------------- */

function extractIncomingInput(message){

 return (

  message?.interactive?.button_reply?.id ||

  message?.interactive?.list_reply?.id ||

  message?.text?.body?.trim()

 );

}

/* ---------------------------------- */

async function startNewInquiry(phone){

 await WhatsAppInquiry.create({

  phoneNumber:phone,

  step:"ASK_DISEASE_SELECTION",

  selectedConditions:[],

  pendingConditions:[],

  responses:{conditions:{}}

 });

 return sendConditionList(phone);

}

/* ---------------------------------- */

async function handleConditionSelect(inquiry,phone,input){

 if(input==="done"){

  if(!inquiry.selectedConditions.length){

   return sendText(phone,"Please select at least 1 condition.");

  }

  inquiry.pendingConditions=[...inquiry.selectedConditions];

  inquiry.activeCondition=inquiry.pendingConditions.shift();

  inquiry.conditionQuestionIndex=0;

  inquiry.step="ASK_CONDITION";

  await inquiry.save();

  return askCondition(inquiry,phone);

 }

 const cond = CONDITION_MAP[input];

 if(!cond)

  return sendConditionList(phone,inquiry.selectedConditions);

 if(!inquiry.selectedConditions.includes(cond))

  inquiry.selectedConditions.push(cond);

 await inquiry.save();

 return sendConditionList(phone,inquiry.selectedConditions);

}

/* ---------------------------------- */

async function askCondition(inquiry,phone){

 const cond = inquiry.activeCondition;

 const questions = CONDITION_FLOW[cond];

 const q = questions?.[inquiry.conditionQuestionIndex];

 if(!q){

  inquiry.activeCondition=inquiry.pendingConditions.shift();

  inquiry.conditionQuestionIndex=0;

  if(!inquiry.activeCondition){

    if(inquiry.name){

      inquiry.step="DONE";
     
      inquiry.completedAt=new Date();
     
      await inquiry.save();
     
      try{
     
        await sendWhatsAppInquiryNotification(inquiry);
     
      }catch(e){
     
        console.log("email error", e.message);
     
      }
     
      return sendFinalMessage(phone);
     
     }

   inquiry.step="ASK_GENERAL";

   inquiry.generalQuestionIndex=0;

   await inquiry.save();

   return askGeneral(inquiry,phone);

  }

  await inquiry.save();

  return askCondition(inquiry,phone);

 }

 const prefix =
 `(${inquiry.conditionQuestionIndex+1}/${questions.length})\n`;

 if(q.type==="yesno")

  return sendYesNo(phone,prefix+q.q);

 return sendText(phone,prefix+q.q);

}

/* ---------------------------------- */

async function handleConditionAnswer(inquiry,phone,input){

 const cond=inquiry.activeCondition;

 const q=
 CONDITION_FLOW[cond][inquiry.conditionQuestionIndex];

 let value=input==="n"?null:input;

 if(q.type==="yesno")

  value=input==="yes";

 if(!inquiry.responses.conditions[cond])

  inquiry.responses.conditions[cond]={};

 inquiry.responses.conditions[cond][q.key]=value;

 inquiry.markModified("responses");

 inquiry.conditionQuestionIndex++;

 await inquiry.save();

 return askCondition(inquiry,phone);

}

/* ---------------------------------- */

async function askGeneral(inquiry,phone){

 const q=
 GENERAL_FLOW[inquiry.generalQuestionIndex];

 if(!q){

  inquiry.step="DONE";
 
  inquiry.completedAt=new Date();
 
  await inquiry.save();
 
  try{
 
    await sendWhatsAppInquiryNotification(inquiry);
 
  }catch(e){
 
    console.log("email error", e.message);
 
  }
 
  return sendFinalMessage(phone);
 
 }

 if(q.type==="gender")

  return sendGender(phone);

 return sendText(phone,q.q);

}

async function handleGeneralAnswer(inquiry,phone,input){

 const q=
 GENERAL_FLOW[inquiry.generalQuestionIndex];

 let value=input==="n"?null:input;

 if(q.key==="name")

  inquiry.name=value;

 else{

  inquiry.responses[q.key]=value;

  inquiry.markModified("responses");

 }

 inquiry.generalQuestionIndex++;

 await inquiry.save();

 return askGeneral(inquiry,phone);

}

/* ---------------------------------- */

async function handlePatientSelect(phone,input){

 if(input==="new_patient")

  return startNewInquiry(phone);

 if(input.startsWith("patient_")){

  const id=input.replace("patient_","");

  const patient=
  await WhatsAppInquiry.findById(id);

  if(!patient)

   return sendPatientList(phone);

  await WhatsAppInquiry.create({

   phoneNumber:phone,

   name:patient.name,

   responses:{
    age:patient.responses?.age,
    gender:patient.responses?.gender,
    heightCm:patient.responses?.heightCm,
    weightKg:patient.responses?.weightKg,
    conditions:{}
   },

   step:"ASK_DISEASE_SELECTION",

   selectedConditions:[],

   pendingConditions:[]

  });

  return sendConditionList(phone);

 }

}

/* ---------------------------------- */

async function handleInquiryMessage(phone,input){

 const text=(input||"").toLowerCase().trim();

 if(["hi","hello","restart"].includes(text)){

  await sendText(

   phone,

`Welcome to Prakritify 🌿

We’ll ask a few questions to understand your disease, lifestyle and diet.

You can type "restart" anytime to begin again.`

  );

  return sendPatientList(phone);

 }

 if(input==="new_patient" || input.startsWith("patient_"))

  return handlePatientSelect(phone,input);

 const inquiry=
 await WhatsAppInquiry.findOne({

  phoneNumber:phone,

  step:{

   $in:[
    "ASK_DISEASE_SELECTION",
    "ASK_CONDITION",
    "ASK_GENERAL"
   ]

  }

 })

 .sort({createdAt:-1});

 if(!inquiry)

  return sendPatientList(phone);

 if(inquiry.step==="ASK_DISEASE_SELECTION")

  return handleConditionSelect(inquiry,phone,input);

 if(inquiry.step==="ASK_CONDITION")

  return handleConditionAnswer(inquiry,phone,input);

 if(inquiry.step==="ASK_GENERAL")

  return handleGeneralAnswer(inquiry,phone,input);

}
async function sendFinalMessage(phone){

  return sendText(
 
   phone,
 
 `Thanks for your interest. Our team will shortly get back to you.
 
 Check Nutritional deficiency here:
 ${process.env.NUTRITIONAL_DEFICIENCY_LINK}`
 
  );
 
 }

module.exports={

 extractIncomingInput,

 handleInquiryMessage

};


//working version 1
// const axios = require("axios");
// const WhatsAppInquiry = require("../models/WhatsAppInquiry");
// const { sendWhatsAppInquiryNotification }
//  = require("../services/whatsAppNotificationService");

// const GRAPH_API_VERSION =
//  process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";

// /* ---------------------------------- */

// const CONDITION_MAP = {
//  "1":"diabetes",
//  "2":"cholesterolLipids",
//  "3":"bloodPressure",
//  "4":"heartHealth",
//  "5":"thyroid",
//  "6":"pcos",
//  "7":"liverIssues",
//  "8":"arthritisJointPain"
// };

// const CONDITION_FLOW = {

//  diabetes:[
//   {key:"fastingSugar", q:"Fasting sugar (mg/dL)? or n"},
//   {key:"postMealSugar", q:"Post meal sugar (mg/dL)? or n"},
//   {key:"hba1c", q:"HbA1c? or n"},
//   {key:"medication", q:"Taking diabetes medicine?", type:"yesno"}
//  ],

//  bloodPressure:[
//   {key:"systolic", q:"Systolic BP? or n"},
//   {key:"diastolic", q:"Diastolic BP? or n"},
//   {key:"medication", q:"Taking BP medicine?", type:"yesno"}
//  ],

//  cholesterolLipids:[
//   {key:"totalCholesterol", q:"Total cholesterol? or n"}
//  ],

//  thyroid:[
//   {key:"tsh", q:"TSH value? or n"}
//  ],

//  heartHealth:[
//   {key:"diagnosed", q:"Heart issue diagnosed?", type:"yesno"}
//  ],

//  liverIssues:[
//   {key:"fattyLiver", q:"Fatty liver?", type:"yesno"}
//  ],

//  arthritisJointPain:[
//   {key:"issue", q:"Which joint pain?"}
//  ],

//  pcos:[
//   {key:"cycleRegular", q:"Cycle regular?", type:"yesno"}
//  ]

// };

// const GENERAL_FLOW = [

//  {key:"name", q:"Patient name?"},
//  {key:"age", q:"Age?"},
//  {key:"gender", q:"Select gender", type:"gender"},
//  {key:"heightCm", q:"Height (cm)?"},
//  {key:"weightKg", q:"Weight (kg)?"}

// ];


// function apiUrl(){

//  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;

// }

// function headers(){

//  return {

//   Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`,

//   "Content-Type":"application/json"

//  };

// }

// /* ---------------------------------- */

// async function sendText(to,text){

//  return axios.post(

//   apiUrl(),

//   {

//    messaging_product:"whatsapp",
//    to,
//    text:{body:text}

//   },

//   {headers:headers()}

//  );

// }

// async function sendYesNo(to,text){

//  return axios.post(

//   apiUrl(),

//   {

//    messaging_product:"whatsapp",

//    to,

//    type:"interactive",

//    interactive:{

//     type:"button",

//     body:{text},

//     action:{

//      buttons:[

//       {type:"reply",reply:{id:"yes",title:"Yes"}},

//       {type:"reply",reply:{id:"no",title:"No"}}

//      ]

//     }

//    }

//   },

//   {headers:headers()}

//  );

// }

// async function sendGender(to){

//  return axios.post(

//   apiUrl(),

//   {

//    messaging_product:"whatsapp",

//    to,

//    type:"interactive",

//    interactive:{

//     type:"button",

//     body:{text:"Select gender"},

//     action:{

//      buttons:[

//       {type:"reply",reply:{id:"male",title:"Male"}},

//       {type:"reply",reply:{id:"female",title:"Female"}}

//      ]

//     }

//    }

//   },

//   {headers:headers()}

//  );

// }

// async function sendConditionList(phone){

//  return axios.post(

//   apiUrl(),

//   {

//    messaging_product:"whatsapp",

//    to:phone,

//    type:"interactive",

//    interactive:{

//     type:"list",

//     body:{text:"Select condition(s)"},

//     action:{

//      button:"Choose",

//      sections:[

//       {

//        title:"Conditions",

//        rows:[

//         {id:"1",title:"Diabetes"},

//         {id:"2",title:"Cholesterol"},

//         {id:"3",title:"Blood Pressure"},

//         {id:"4",title:"Heart"},

//         {id:"5",title:"Thyroid"},

//         {id:"6",title:"PCOS"},

//         {id:"7",title:"Liver"},

//         {id:"8",title:"Arthritis"},

//         {id:"done",title:"Done"}

//        ]

//       }

//      ]

//     }

//    }

//   },

//   {headers:headers()}

//  );

// }

// /* ---------------------------------- */
// async function sendPatientList(phone){

//   const patients =
//   await WhatsAppInquiry.aggregate([
 
//    {
//     $match:{
//      phoneNumber:phone,
//      name:{$ne:null}
//     }
//    },
 
//    {
//     $sort:{createdAt:-1}
//    },
 
//    /* pick latest record per patient name */
 
//    {
//     $group:{
//      _id:"$name",
//      doc:{$first:"$$ROOT"}
//     }
//    },
 
//    {
//     $replaceRoot:{newRoot:"$doc"}
//    }
 
//   ]);
 
//   if(!patients.length){
 
//    return startNewInquiry(phone);
 
//   }
 
//   const rows = patients.map(p=>({
 
//    id:`patient_${p._id}`,
 
//    title:p.name
 
//   }));
 
//   rows.push({
 
//    id:"new_patient",
 
//    title:"New Patient"
 
//   });
 
//   return axios.post(
 
//    apiUrl(),
 
//    {
 
//     messaging_product:"whatsapp",
 
//     to:phone,
 
//     type:"interactive",
 
//     interactive:{
 
//      type:"list",
 
//      body:{text:"Select patient"},
 
//      action:{
 
//       button:"Choose",
 
//       sections:[
 
//        {
 
//         title:"Patients",
 
//         rows
 
//        }
 
//       ]
 
//      }
 
//     }
 
//    },
 
//    {headers:headers()}
 
//   );

//  }

// /* ---------------------------------- */

// function extractIncomingInput(message){

//  return (

//   message?.interactive?.button_reply?.id ||

//   message?.interactive?.list_reply?.id ||

//   message?.text?.body?.trim()

//  );

// }

// /* ---------------------------------- */

// async function startNewInquiry(phone){

  
//  const inquiry =
//  await WhatsAppInquiry.create({

//   phoneNumber:phone,

//   step:"ASK_DISEASE_SELECTION",

//   selectedConditions:[],

//   pendingConditions:[],

//   responses:{conditions:{}}

//  });

//  return sendConditionList(phone);

// }

// /* ---------------------------------- */

// async function handleConditionSelect(inquiry,phone,input){

//  if(input==="done"){

//   inquiry.pendingConditions=[...inquiry.selectedConditions];

//   inquiry.activeCondition=inquiry.pendingConditions.shift();

//   inquiry.conditionQuestionIndex=0;

//   inquiry.step="ASK_CONDITION";

//   await inquiry.save();

//   return askCondition(inquiry,phone);

//  }

//  const cond = CONDITION_MAP[input];

//  if(!cond)
//   return sendConditionList(phone);

//  if(!inquiry.selectedConditions.includes(cond))
//   inquiry.selectedConditions.push(cond);

//  await inquiry.save();

//  return sendConditionList(phone);

// }

// async function askCondition(inquiry,phone){

//   const cond = inquiry.activeCondition;
 
//   const q =
//   CONDITION_FLOW[cond]?.[
//   inquiry.conditionQuestionIndex
//   ];
 
//   /* all questions finished */
 
//   if(!q){
 
//    inquiry.activeCondition =
//    inquiry.pendingConditions.shift();
 
//    inquiry.conditionQuestionIndex = 0;
 
//    /* no more conditions */
 
//    if(!inquiry.activeCondition){
 
//      /* existing patient → skip general questions */
 
//      if(inquiry.name){
 
//        inquiry.step="DONE";
 
//        inquiry.completedAt=new Date();
 
//        await inquiry.save();

//        await sendWhatsAppInquiryNotification(inquiry);
 
//        return sendFinalMessage(phone);
 
//      }
 
//      /* new patient → ask details */
 
//      inquiry.step="ASK_GENERAL";
 
//      inquiry.generalQuestionIndex=0;
 
//      await inquiry.save();
 
//      return askGeneral(inquiry,phone);
 
//    }
 
//    await inquiry.save();
 
//    return askCondition(inquiry,phone);
 
//   }
 
//   /* ask next condition question */
 
//   if(q.type==="yesno")
 
//    return sendYesNo(phone,q.q);
 
//   return sendText(phone,q.q);
 
//  }

// /* ---------------------------------- */

// async function handleConditionAnswer(inquiry,phone,input){

//  const cond=inquiry.activeCondition;

//  const q =
//  CONDITION_FLOW[cond][
//  inquiry.conditionQuestionIndex
//  ];

//  let value = input==="n" ? null : input;

//  if(q.type==="yesno")
//   value = input==="yes";

//  if(!inquiry.responses.conditions[cond])
//   inquiry.responses.conditions[cond] = {};

//  inquiry.responses.conditions[cond][q.key] = value;

//  inquiry.markModified("responses");

//  inquiry.conditionQuestionIndex++;

//  await inquiry.save();

//  return askCondition(inquiry,phone);

// }

// /* ---------------------------------- */

// async function askGeneral(inquiry,phone){

//  const q =
//  GENERAL_FLOW[
//  inquiry.generalQuestionIndex
//  ];

//  if(!q){

//   inquiry.step="DONE";

//   inquiry.completedAt=new Date();

//   await inquiry.save();

//   await sendWhatsAppInquiryNotification(inquiry);

//   return sendFinalMessage(phone);

//  }

//  if(q.type==="gender")
//   return sendGender(phone);

//  return sendText(phone,q.q);

// }

// async function handleGeneralAnswer(inquiry,phone,input){

//  const q =
//  GENERAL_FLOW[
//  inquiry.generalQuestionIndex
//  ];

//  let value = input==="n" ? null : input;

//  if(q.key==="name"){

//   inquiry.name = value;

//  }

//  else{

//   inquiry.responses[q.key] = value;

//   inquiry.markModified("responses");

//  }

//  inquiry.generalQuestionIndex++;

//  await inquiry.save();

//  return askGeneral(inquiry,phone);

// }

// async function handlePatientSelect(phone,input){

//   if(input==="new_patient"){
 
//     return startNewInquiry(phone);
 
//   }
 
//   if(input.startsWith("patient_")){
 
//     const id = input.replace("patient_","");
 
//     const patient =
//     await WhatsAppInquiry.findById(id);
 
//     if(!patient){
 
//       return sendPatientList(phone);
 
//     }
 
//     await WhatsAppInquiry.create({
 
//       phoneNumber:phone,
 
//       name:patient.name,
 
//       responses:{
//         age:patient.responses?.age || null,
//         gender:patient.responses?.gender || null,
//         heightCm:patient.responses?.heightCm || null,
//         weightKg:patient.responses?.weightKg || null,
//         conditions:{}
//       },
 
//       step:"ASK_DISEASE_SELECTION",
 
//       selectedConditions:[],
 
//       pendingConditions:[]
 
//     });
 
//     return sendConditionList(phone);
 
//   }
 
//  }
// async function handleInquiryMessage(phone,input){

//   const text = (input || "").toLowerCase().trim();
 
//   /* user starting chat */
 
//   if(["hi","hello","restart"].includes(text)){
 
//     await sendText(

//       phone,
   
//    `Welcome to Prakritify 🌿
   
//    We’ll ask a few questions to understand your disease, lifestyle and diet.
   
//    You can type "restart" anytime to begin again.`
   
//      );
   
//      return sendPatientList(phone);
   
//     }
 
//   /* PATIENT selected */
 
//   if(input === "new_patient" || input.startsWith("patient_")){
 
//     return handlePatientSelect(phone,input);
 
//   }
 
//   /* find latest running inquiry */
 
//   const inquiry =
//   await WhatsAppInquiry.findOne({
 
//     phoneNumber:phone,
 
//     step:{$in:[
//       "ASK_DISEASE_SELECTION",
//       "ASK_CONDITION",
//       "ASK_GENERAL"
//     ]}
 
//   })
 
//   .sort({createdAt:-1});
 
//   /* if no running inquiry, show patient list */
 
//   if(!inquiry){
 
//     return sendPatientList(phone);
 
//   }
 
//   /* continue flow */
 
//   if(inquiry.step==="ASK_DISEASE_SELECTION"){
 
//     return handleConditionSelect(inquiry,phone,input);
 
//   }
 
//   if(inquiry.step==="ASK_CONDITION"){
 
//     return handleConditionAnswer(inquiry,phone,input);
 
//   }
 
//   if(inquiry.step==="ASK_GENERAL"){
 
//     return handleGeneralAnswer(inquiry,phone,input);
 
//   }
 
//  }

//  async function sendFinalMessage(phone){

//   return axios.post(
 
//    apiUrl(),
 
//    {
 
//     messaging_product:"whatsapp",
 
//     to:phone,
 
//     type:"interactive",
 
//     interactive:{
 
//      type:"cta_url",
 
//      body:{
 
//  text:`Thanks for your interest. Our team will shortly get back to you.
 
//  For Nutritional deficiency identification please click below link.`
 
//      },
 
//      action:{
 
//       name:"cta_url",
 
//       parameters:{
 
//        display_text:"Check Nutritional Deficiency",
 
//        url:process.env.NUTRITIONAL_DEFICIENCY_LINK
 
//       }
 
//      }
 
//     }
 
//    },
 
//    {headers:headers()}
 
//   );
 
//  }

// module.exports={

//  extractIncomingInput,

//  handleInquiryMessage

// };