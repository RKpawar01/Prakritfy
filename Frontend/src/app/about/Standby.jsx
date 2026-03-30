import { image } from '@heroui/theme';
import React from 'react'
export const valuesIcons = [
  {
    id: 1,
    title: "Design for people",
    subtitle: "You in the center of our focus",
    image:"https://img.icons8.com/?size=100&id=neQaGfUPYY7u&format=png&color=000000"
    
    },
  {
    id: 2,
    title: "Integrative & interdisciplinary",
    subtitle: "program solutions",
    image: "https://img.icons8.com/?size=100&id=ll1Ce1YeVoWc&format=png&color=000000"
  },
  {
    id: 3,
    title: "Build and deliver",
    subtitle: "with empathy",
    image:"https://img.icons8.com/?size=100&id=XDH0Z4c2jynP&format=png&color=000000"
  },
  {
    id: 4,
    title: "Committed to",
    subtitle: "sustainable results",
    image:"https://img.icons8.com/?size=100&id=f3o1AGoVZ2Un&format=png&color=000000"
  },
  {
    id: 5,
    title: "Empowering health",
    subtitle: "and wellness for every individual",
    image:"https://img.icons8.com/?size=100&id=9shlfoGKqCS7&format=png&color=000000"
  },
  {
    id: 6,
    title: "Run towards",
    subtitle: "hard problems",
    image:"https://img.icons8.com/?size=100&id=V8DoLg02M4Fb&format=png&color=000000"
  },
  {
    id: 7,
    title: "Evidence based,",
    subtitle: "cutting edge",
    image:"https://img.icons8.com/?size=100&id=95112&format=png&color=000000"
  },
  {
    id: 8,
    title: "Keep learning,",
    subtitle: "keep growing",
    image:"https://img.icons8.com/?size=100&id=72390&format=png&color=000000"
    
  }
];

const Standby = () => {
  return (
    <div className='bg-[#022333] '>
        
    <div className=' text-[#1ba6ec] text-center text-4xl font-bold pt-10 underline'>
      What we stand by
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-10 gap-6">
        {valuesIcons.map((item)=>(
            <div
      key={item.id}
      className={`bg-[#193847]   rounded-3xl m-10 pb-5 relative`}
    >
        <div  className='flex items-center justify-center p-10'>
            <img src={item.image} alt="" />
        </div>
      
      
      <p className="text-lg text-white text-center">{item.title}</p>
      <p className="text-lg text-white text-center">{item.subtitle}</p>


     
    </div>
        ))}
      </div>

    </div>
  )
}

export default Standby
