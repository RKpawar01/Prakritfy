"use client";
export default function ProductSearch({ onSearch }) {
  return (
    <div className="relative w-[300px] grid grid-cols-2">
      {/* Search Icon */}
      

      {/* Input */}
      <input
        type="search"
        placeholder="   Search products"
        onChange={(e) => onSearch(e.target.value)}
        className="w-full border ring-2 ring-[#04a2f7] rounded rounded-4xl gap-10 pr-3 py-2 text-sm 
                   focus:outline-none focus:ring-2 focus:ring-[#025582]"
      />

    </div>
  );
}
