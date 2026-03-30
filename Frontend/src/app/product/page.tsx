"use client";

import { useState, useMemo } from "react";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import ProductSearch from "@/components/search/ProductSearch";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Star, ShoppingBag, Heart, Eye, Shield, Truck, RefreshCw, X } from "lucide-react";

export default function ProductPage() {
  const products = [
    {
      id: 1,
      image: "/Product1.jpeg",
      name: "Shilajit Gold Resin",
      mrp: 1999,
      rating: 4.4,
      reviews: 2341,
      badge: "Bestseller",
      origin: "Himalayan Gold",
      benefits: ["Immunity", "Energy", "Longevity"],
      inStock: true
    },
    {
      id: 2,
      image: "/Product2.jpeg",
      name: "Himalayan Shilajit",
      mrp: 1599,
      rating: 4.2,
      reviews: 1820,
      badge: "Premium",
      origin: "Nepal Himalayas",
      benefits: ["Vitality", "Strength", "Recovery"],
      inStock: true
    },
    {
      id: 3,
      image: "/Product3.jpeg",
      name: "Herbal Juice",
      mrp: 1499,
      rating: 4.1,
      reviews: 980,
      badge: "New",
      origin: "Organic Valley",
      benefits: ["Detox", "Wellness", "Glow"],
      inStock: true
    },
    {
      id: 4,
      image: "/Product4.jpeg",
      name: "Wellness Capsule",
      mrp: 1299,
      rating: 4.3,
      reviews: 1210,
      badge: "Popular",
      origin: "Ayurvedic Formula",
      benefits: ["Daily Wellness", "Balance", "Immunity"],
      inStock: false
    },
    {
      id: 5,
      image: "/Product5.jpeg",
      name: "Ayurvedic Oil",
      mrp: 1399,
      rating: 4.0,
      reviews: 760,
      badge: "Therapy",
      origin: "Kerala Tradition",
      benefits: ["Pain Relief", "Flexibility", "Rejuvenation"],
      inStock: true
    },
    {
      id: 6,
      image: "/Product6.jpeg",
      name: "Health Tonic",
      mrp: 1099,
      rating: 4.5,
      reviews: 3120,
      badge: "Top Rated",
      origin: "Himalayan Herbs",
      benefits: ["Strength", "Immunity", "Stamina"],
      inStock: true
    },
  ];

  // State management
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [showQuickView, setShowQuickView] = useState<number | null>(null);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.mrp - b.mrp);
        break;
      case "price-high":
        filtered.sort((a, b) => b.mrp - a.mrp);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // featured - keep original order
        break;
    }

    return filtered;
  }, [search, sortBy]);

  // Wishlist functions
  const toggleWishlist = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWishlist(prev => {
      const newWishlist = prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
      
      showNotification(
        prev.includes(id) ? "Removed from wishlist" : "Added to wishlist",
        "success"
      );
      
      return newWishlist;
    });
  };

  // Cart functions
  const addToCart = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const product = products.find(p => p.id === id);
    
    if (!product?.inStock) {
      showNotification("Product is out of stock", "error");
      return;
    }

    setCart(prev => {
      if (!prev.includes(id)) {
        showNotification("Added to cart successfully", "success");
        return [...prev, id];
      } else {
        showNotification("Item already in cart", "error");
        return prev;
      }
    });
  };

  // Notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Quick view function
  const quickView = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowQuickView(id);
  };

  // Clear search
  const clearSearch = () => {
    setSearch("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f0f0' }}>
      {/* Navbar */}
      <div style={{ backgroundColor: '#71d2ba' }}>
        <NavbarDemo />
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {products.find(p => p.id === showQuickView) && (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-2xl font-serif font-bold text-gray-900">
                      {products.find(p => p.id === showQuickView)?.name}
                    </div>
                    <button
                      onClick={() => setShowQuickView(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={products.find(p => p.id === showQuickView)?.image}
                        alt="Product"
                        className="w-full h-64 object-contain"
                      />
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <span className="text-sm text-orange-600 font-semibold">
                          {products.find(p => p.id === showQuickView)?.origin}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={`${
                                  i < Math.floor(products.find(p => p.id === showQuickView)?.rating || 0)
                                    ? "fill-yellow-400 stroke-yellow-400"
                                    : "stroke-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({products.find(p => p.id === showQuickView)?.reviews.toLocaleString()} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{products.find(p => p.id === showQuickView)?.mrp.toLocaleString()}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="font-semibold mb-2">Benefits:</div>
                        <div className="flex flex-wrap gap-2">
                          {products.find(p => p.id === showQuickView)?.benefits.map((benefit, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className={`text-sm font-semibold ${
                          products.find(p => p.id === showQuickView)?.inStock 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {products.find(p => p.id === showQuickView)?.inStock 
                            ? '✓ In Stock' 
                            : '✗ Out of Stock'}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            addToCart(showQuickView);
                            setShowQuickView(null);
                          }}
                          disabled={!products.find(p => p.id === showQuickView)?.inStock}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={(e) => {
                            toggleWishlist(showQuickView, e);
                          }}
                          className="p-3 border-2 border-gray-200 hover:border-orange-500 rounded-xl transition"
                        >
                          <Heart
                            size={20}
                            className={`${
                              wishlist.includes(showQuickView)
                                ? "fill-red-500 stroke-red-500"
                                : "stroke-gray-600"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#71d2ba' }}>
        <div className="absolute inset-0 bg-black/5" />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="text-4xl md:text-5xl font-serif font-bold text-white">
              Pure • Natural • Authentic
            </div>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
              Discover our curated collection of premium wellness products, 
              sourced from the pristine Himalayas and crafted with ancient wisdom.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters Section */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#71d2ba] focus:border-transparent"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-4">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 transition ${
                  viewMode === "grid" 
                    ? "bg-[#71d2ba] text-white" 
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 transition ${
                  viewMode === "list" 
                    ? "bg-[#71d2ba] text-white" 
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                ☰
              </button>
            </div>
          </div>
          
          <ProductSearch onSearch={setSearch} />
        </div>

        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-2xl font-serif text-gray-900">
            {search ? (
              <>
                <span className="text-gray-500">Search results for</span>{" "}
                <span className="text-[#71d2ba] border-b-2 border-[#71d2ba]/20 pb-1">
                  "{search}"
                </span>
              </>
            ) : (
              "Our Premium Collection"
            )}
          </div>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {filteredProducts.length} products
          </span>
        </div>

        {/* Product Grid/List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }`}
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative bg-white rounded-2xl ${
                  viewMode === "grid"
                    ? "shadow-lg hover:shadow-2xl"
                    : "flex gap-6 shadow-md hover:shadow-xl"
                } overflow-hidden transition-all duration-500 hover:-translate-y-1`}
                onHoverStart={() => setHoveredId(product.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                {/* Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#71d2ba] to-[#5fb8a0] text-white text-xs font-semibold rounded-full shadow-lg">
                    {product.badge}
                  </span>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => toggleWishlist(product.id, e)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 group"
                >
                  <Heart
                    size={18}
                    className={`transition-colors duration-300 ${
                      wishlist.includes(product.id)
                        ? "fill-red-500 stroke-red-500"
                        : "stroke-gray-600 group-hover:stroke-red-500"
                    }`}
                  />
                </button>

                {/* Image Container */}
                <div
                  className={`${
                    viewMode === "grid" ? "h-64" : "w-48 h-48"
                  } relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-contain p-6 transition-transform duration-700 ${
                      hoveredId === product.id ? "scale-110" : "scale-100"
                    }`}
                  />
                  
                  {/* Quick View Overlay */}
                  <AnimatePresence>
                    {hoveredId === product.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center gap-3"
                      >
                        <button 
                          onClick={(e) => quickView(product.id, e)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#71d2ba] hover:text-white transition-all duration-300 transform hover:scale-110"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={(e) => addToCart(product.id, e)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#71d2ba] hover:text-white transition-all duration-300 transform hover:scale-110"
                        >
                          <ShoppingBag size={20} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Out of Stock Overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-900">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="mb-2">
                    <p className="text-xs text-[#71d2ba] font-semibold uppercase tracking-wider">
                      {product.origin}
                    </p>
                    <div className="text-lg font-semibold text-gray-900 hover:text-[#71d2ba] cursor-pointer transition-colors line-clamp-2">
                      {product.name}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-2 my-3">
                    {product.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#71d2ba]/10 text-[#71d2ba] text-xs rounded-full border border-[#71d2ba]/20"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 stroke-yellow-400"
                              : "stroke-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => addToCart(product.id, e)}
                      disabled={!product.inStock}
                      className="flex-1 bg-gradient-to-r from-[#71d2ba] to-[#5fb8a0] hover:from-[#5fb8a0] hover:to-[#4da690] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <ShoppingBag size={18} />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button
                      onClick={(e) => quickView(product.id, e)}
                      className="p-3 border-2 border-gray-200 hover:border-[#71d2ba] rounded-xl transition-all duration-300 hover:shadow-lg group"
                    >
                      <Eye size={18} className="text-gray-600 group-hover:text-[#71d2ba]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </div>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching "{search}"
              </p>
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gradient-to-r from-[#71d2ba] to-[#5fb8a0] text-white rounded-xl hover:from-[#5fb8a0] hover:to-[#4da690] transition-all duration-300"
              >
                Clear Search
              </button>
            </div>
          </motion.div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#71d2ba]/10 rounded-lg">
                <ShoppingBag className="text-[#71d2ba]" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
                </p>
                <p className="text-sm text-gray-600">
                  Total: ₹{cart.reduce((sum, id) => {
                    const product = products.find(p => p.id === id);
                    return sum + (product?.mrp || 0);
                  }, 0).toLocaleString()}
                </p>
              </div>
            </div>
            <button className="px-6 py-2 bg-[#71d2ba] text-white rounded-lg hover:bg-[#5fb8a0] transition-all duration-300">
              View Cart
            </button>
          </motion.div>
        )}

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Premium Quality", desc: "Authenticated & Tested" },
            { icon: Truck, title: "Free Shipping", desc: "On orders above ₹999" },
            { icon: RefreshCw, title: "Easy Returns", desc: "30-day return policy" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-4"
            >
              <div className="p-3 bg-[#71d2ba]/10 rounded-lg">
                <feature.icon className="text-[#71d2ba]" size={24} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{feature.title}</div>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}