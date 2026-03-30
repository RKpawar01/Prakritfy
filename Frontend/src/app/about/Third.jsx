import React from "react";
import { FaCalendarAlt, FaStethoscope } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";

const Third = () => {
  return (
    <div className="bg-[#f1f9f6] mt-10 max-w-6xl mx-auto p-5 rounded-[2rem]  shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="text-6xl"></div>

        <div>
          <div className="text-3xl md:text-4xl font-semibold mb-4">
            Prakritify was founded by{" "}
            <span className="font-bold">3 passionate professionals</span>
          </div>

          <p className="text-lg text-gray-700 mb-4">
            Who came together with a common intention – they were tired of the
            rhetoric that chronic diseases are for life and wanted to simplify
            treatment and get rid of chronic illness for life.
          </p>

          <p className="text-lg text-gray-700">
            From our own individual experiences, each of us came to the
            realization that not only is disease reversal possible, but also
            that it is just the first step. Prakritify was started with the
            below philosophy in mind.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-12 h-px bg-gray-300" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        
        {/* Stat 1 */}
        <div>
          <div className="text-3xl font-bold">40+ years</div>
          <div className="flex items-center justify-center gap-2 text-emerald-600 mt-2">
            <FaCalendarAlt className="text-emerald-500 text-xl" />
            <span>of collective scientific research</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div>
          <div className="text-3xl font-bold">Over 9.7k patients</div>
          <div className="flex items-center justify-center gap-2 text-emerald-600 mt-2">
            <FaStethoscope className="text-emerald-500 text-xl" />
            <span>treated successfully</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div>
          <div className="text-3xl font-bold">12+ experts</div>
          <div className="flex items-center justify-center gap-2 text-emerald-600 mt-2">
            <IoIosPeople className="text-emerald-500 text-xl" />
            <span>in integrative interdisciplinary team</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Third;
