import React from 'react'
 const features = [
  {
    id: 1,
    title: "We are passionate lot",
    description:
      "Our approach is empathetic and rooted in a holistic integration of cutting-edge science whereby we seek to genuinely empower our clients. We are driven by a genuine purpose of improving the health and wellness for each one of us.",
    image: "https://img.icons8.com/?size=100&id=H7nzwXHBxuzU&format=png&color=000000",
    align: "left",
  },
  {
    id: 2,
    title: "We’re not just disease reversal specialists",
    description:
      "We help you understand your body and environment better so that you can take control of your own health and wellness, and consequently live a medicine & illness-free life.",
    image: "https://img.icons8.com/?size=100&id=2878&format=png&color=000000",
    align: "right",
  },
  {
    id: 3,
    title: "We are motivated by challenges",
    description:
      "At Prakritify, we believe in pushing the boundaries of our potential in order to provide solutions to the toughest problems. We are open to solicitations & internalization so that we may eventually take the best decision in the larger interest of our clientele.",
    image: "https://img.icons8.com/?size=100&id=81237&format=png&color=000000",
    align: "left",
  },
  {
    id: 4,
    title:
      "Our relationship with clients is akin to a guide or a coach, rather than a ‘know-it-all’ teacher.",
    description:
      "We have been down the same path and we use our experience to equip you with the right set of tools, knowledge and awareness that will enhance your wellness experience and give you better results.",
    image: "https://img.icons8.com/?size=100&id=122514&format=png&color=000000",
    align: "right",
  },
  {
    id: 5,
    title: "New standard for chronic disease care",
    description:
      "We are working towards establishing a new standard for chronic disease care and Healthcare, because we are living in the new ways & the old way just isn’t cutting it!",
    image: "https://img.icons8.com/?size=100&id=16958&format=png&color=000000",
    align: "center",
  },
];

const Name = () => {
  return (
    <div className='text-white p-10   '>
      <div>
        <div className='flex items-center justify-center m-10'>

        <img  src="https://img.icons8.com/?size=100&id=zj9VwT0gHqsY&format=png&color=000000" alt="" />
        </div>
        <p className='text-4xl font-bold text-center text-black'>
            More About XXXXXX
        </p>
        <div className="text-xl text-center max-w-3xl mx-auto px-4 m-10">
            Team Prakritify comprises of an integrative team of experts from various disciplines
of science and medicine and some of us even outside the industry.
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 flex">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 ">
    {features.map((item) => (
      <div
        key={item.id}
        className="grid grid-cols-[80px_1fr] gap-6 items-start"
      >
        {/* Icon */}
        <img
          src={item.image}
          alt={item.title}
          className="w-16 h-16 object-contain"
        />

        {/* Text */}
        <div>
          <div className=" text-xl mb-2 text-gray-900 font-bold">
            {item.title}
          </div>
          <p className="text-text-white-700 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

    </div>
  )
}

export default Name
