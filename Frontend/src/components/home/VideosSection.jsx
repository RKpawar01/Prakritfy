import React from "react";

const VideosSection = () => {
  const videos = [
    {
      title: "Health education: principles & objectives",
      videoId: "uwNNzsIkjiY",
    },
    { title: "Module 2: Health Education", videoId: "qaJpyz6i-z0" },
    { title: "Primary Health Care Basics", videoId: "LzunsryuENI" },
    { title: "Health education saves lives", videoId: "je3vetaZhUE" },
    { title: "Empathy in Patient Care", videoId: "cDDWvj_q-o8" },
    { title: "Guideline 5: Health Education", videoId: "Htfo27Y7ZT8" },
    { title: "Health Professions Education", videoId: "l49X98VkqJQ" },
    { title: "Introduction to Public Health", videoId: "-dmJSLNgjxo" },
    { title: "AI in Health Care", videoId: "wD1qn2i3Wb4" },
    { title: "Social Health & Longevity", videoId: "LpSDuDIaBGk" },
  ];

  return (
    <div className="w-full overflow-hidden  py-6 bg-gray-600">
      <div
        className="text-center justify-center font-bold text-[white]
            underline text-4xl p-6  "
      >
        Our Services
      </div>
      <div
        className="text-center justify-center font-bold text-[Yellow]
             text-xl   p-2"
      >
        Click to Watch
      </div>
      <div className="flex gap-8 flex-nowrap animate-scroll ">
        {videos.map((item, index) => (
          <div key={index} className="min-w-[320px] text-white transition-all duration-300 hover:scale-105 hover:shadow-xl">
              
            <a
              href={`https://www.youtube.com/watch?v=${item.videoId}`}
              target="_blank"
              rel="noopener noreferrer ">
              <img
                src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                alt={item.title}
                className="w-full h-52 object-cover rounded-lg cursor-pointer "
              />
            </a>

            <p className="mt-2  text-center text-lg">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideosSection;
