"use client";

import { useState, useMemo } from "react";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import ProductSearch from "@/components/search/ProductSearch";

export default function ProductPage() {
  const products = [
    {
      id: 1,
      image: "/Product1.jpeg",
      name: "Shilajit Gold Resin",
      mrp: 1999,
      rating: 4.4,
      reviews: 2341,
    },
    {
      id: 2,
      image: "/Product2.jpeg",
      name: "Himalayan Shilajit",
      mrp: 1599,
      rating: 4.2,
      reviews: 1820,
    },
    {
      id: 3,
      image: "/Product3.jpeg",
      name: "Herbal Juice",
      mrp: 1499,
      rating: 4.1,
      reviews: 980,
    },
    {
      id: 4,
      image: "/Product4.jpeg",
      name: "Wellness Capsule",
      mrp: 1299,
      rating: 4.3,
      reviews: 1210,
    },
    {
      id: 5,
      image: "/Product5.jpeg",
      name: "Ayurvedic Oil",
      mrp: 1399,
      rating: 4.0,
      reviews: 760,
    },
    {
      id: 6,
      image: "/Product6.jpeg",
      name: "Health Tonic",
      mrp: 1099,
      rating: 4.5,
      reviews: 3120,
    },
  ];

  // 🔍 search state
  const [search, setSearch] = useState("");

  // ⚡ memoized filtering
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [search, products]);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Navbar */}
      <div className="bg-[#71d2ba]">
        <NavbarDemo />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search */}
          <div className="flex  justify-end pl-5 mb-4">
            <ProductSearch onSearch={setSearch} />

          </div>

          <h1 className="text-2xl font-semibold mb-6">
            Results for{" "}
            <span className="text-orange-600">
              {search || "Health Products"}
            </span>
          </h1>

          {/* Product Grid */}
          <div className="grid grid-cols-1 mt-5 h-auto sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded shadow hover:shadow-lg hover:scale-105 transition p-4 flex flex-col"
              >
                <div className="h-[180px] flex justify-center items-center mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full object-contain"
                  />
                </div>

                <h3 className="text-sm font-medium line-clamp-2 hover:text-orange-600 cursor-pointer mb-2">
                  {product.name}
                </h3>

                <div className="flex items-center text-sm mb-2">
                  <span className="text-yellow-500">
                    {"★".repeat(Math.floor(product.rating))}
                  </span>
                  <span className="text-gray-400 ml-1">
                    ({product.reviews})
                  </span>
                </div>
                {/* 
                <div className="mb-2">
                  <span className="text-lg font-bold">₹{product.price}</span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    ₹{product.mrp}
                  </span>
                </div> */}

                {/* <p className="text-xs text-gray-600 mb-4">
                  FREE delivery <span className="font-semibold">Tomorrow</span>
                </p> */}

                {/* <div className="bg-white mt-5 border text-center hover:bg-black hover:text-white text-sm font-semibold py-2 rounded-full mb-2 transition">
                  <button >
                  Add to Cart
                </button>
                </div>

                <div className="bg-yellow-500 text-center hover:bg-yellow-600 rounded-full text-sm font-semibold text-white py-2 transition">
                  <button >
                  Buy Now
                </button>
                </div> */}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-500 mt-10">
              No products found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
