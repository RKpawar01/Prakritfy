import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import Footer from "@/components/Universal/Footer";
import Foundation from "@/app/about/Foundation";
import Third from "@/app/about/Third";
import PersonalStory from "./PersonalStory";
import Standby from "./Standby";
import Name from "./Name";
import Team from "./Team";

const page = () => {
  return (
    <div className="bg-gradient-to-r from-[#273f22] to-[#646c3f]   ">
      
      <div className="absolute text-white w-full z-10">
        <NavbarDemo />
      </div>

      <div
        className="relative lg:h-[100vh] md:h-[70vh] sm:h-[50vh] pt-5 md:pt-0
        overflow-hidden flex items-center justify-center"
      >
        {/* Background Image */}
        <img
          src="nature.jpg"
          alt="Nature"
          className="w-full h-full object-cover absolute inset-0"
        />

        {/* Centered Overlay Text */}
        <div
          className="relative rounded-3xl h-45 w-2/3 flex mb-10 pb-10 mt-5
          lg:h-80 md:h-80
          items-center justify-center font-bold text-white bg-black/50"
        >
          <div className="absolute font-bold text-xl md:text-4xl lg:text-6xl">
            About Prakritify <br />
            Learn More

            <div className="absolute m-5 p-3 hover:bg-[#175986] hover:text-white
              transition-all duration-300 bg-white text-black lg:text-2xl md:text-xl text-sm rounded-full"
            >
              <button className="flex justify-center w-full items-center h-5 ">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <Foundation />
      {/* <Third />
      <PersonalStory />
      <Standby />
      <Name />
      <Team /> */}

       <Footer />
    </div>
  );
};

export default page;
