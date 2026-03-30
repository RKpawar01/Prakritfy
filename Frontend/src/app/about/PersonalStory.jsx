import { LuQuote } from "react-icons/lu";
  const testimonials = [
  {
    id: 1,
    text: "Thanks to a truly caring customer from my previous venture, I was introduced to a new lifestyle. My family, including my 9 year old daughter, has been medicine-free for the last 6 odd years now...",
    author: "Anurag Dalmia",
    role: "Founder at Prakritify",
    bgColor: "bg-[#fff1ec]" // light peach
  },
  {
    id: 2,
    text: "In my experience as a general surgeon for almost a decade, I had witnessed many patients suffering from chronic diseases such as Diabetes, Hypertension, Heart disease, Obesity, PCOD, Gout and more...",
    author: "Dr. Thangadurai",
    role: "Founder at Prakritify",
    bgColor: "bg-[#f1f5ff]" // light blue
  },
  {
    id: 3,
    text: "My work is dedicated to the health of humanity and the planet we call home. It is critical that our pursuit of optimal health and longevity begins with an effort towards a collective rise in consciousness...",
    author: "Dr. Ashwani",
    role: "Founder at Prakritify",
    bgColor: "bg-[#eef9ff]" // light cyan
  }
];
const PersonalStory = () => {
    


  return (
<div className="w-[80%] mt-10 mx-auto flex flex-col gap-6">
    <div className="text-black font-bold text-4xl flex items-center justify-center m-10">Our Personal Stories</div>
  {testimonials.map((item) => (
    <div
      key={item.id}
      className={`${item.bgColor} rounded-3xl p-6 relative`}
    >
      <LuQuote className="text-green-500 text-3xl mb-3" />

      <p className="text-lg">{item.text}</p>

      <p className="mt-4 text-[#9198b1]">
        — {item.author}, {item.role}
      </p>
    </div>
  ))}
  <div className="text-white font-bold text-2xl  text-center m-10">
    Move from ‘live with for life’ to ‘reverse for life’… <br />
    Move from Illness to Wellness.
  </div>
</div>
  );
};

export default PersonalStory;
