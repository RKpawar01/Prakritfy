"use client";
import { useState, useMemo, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NavbarDemo } from "@/components/Universal/NavbarDemo";
import {
  Star,
  ShoppingBag,
  Heart,
  X,
  Sparkles,
  Search,
  ArrowRight,
  Clock,
  ShieldCheck,
  Leaf,
  ArrowUpDown,
  Plus,
  ArrowDown,
} from "lucide-react";
import Footer from "@/components/Universal/Footer";

const PRODUCTS = [
  {
    id: 1,
    image: "/Product1.jpeg",
    name: "C Cure Immunity",
    mrp: 1999,
    rating: 4.8,
    reviews: 2341,
    badge: "Bestseller",
    origin: "Himalayan Gold",
    benefits: ["Immunity", "Energy", "Longevity"],
    description:
      "A premium wellness formula designed to boost immunity, increase energy levels, and support long-term health and vitality using rare Himalayan extracts.",
    ingredients: ["Shilajit Extract", "Gold Bhasma", "Ashwagandha", "Gokshura"],
    usage: "Take 1-2 grams twice daily with warm milk or water.",
  },
  {
    id: 2,
    image: "/Product2.jpeg",
    name: "Diabetic Balance",
    mrp: 1599,
    rating: 4.6,
    reviews: 1820,
    badge: "Premium",
    origin: "Nepal Himalayas",
    benefits: ["Vitality", "Strength", "Recovery"],
    description:
      "Specially formulated to help manage blood sugar levels while supporting overall vitality, strength, and recovery through pure Shilajit resin.",
    ingredients: [
      "Pure Shilajit Resin",
      "Fulvic Acid",
      "Humic Acid",
      "Trace Minerals",
    ],
    usage:
      "Dissolve a pea-sized amount in warm water or milk. Consume twice daily.",
  },
  {
    id: 3,
    image: "/Product3.jpeg",
    name: "Herbal Glow Juice",
    mrp: 1499,
    rating: 4.7,
    reviews: 980,
    badge: "New",
    origin: "Organic Valley",
    benefits: ["Detox", "Wellness", "Glow"],
    description:
      "A natural blend of organic ingredients that helps detoxify the body, improve wellness, and enhance skin glow from within.",
    ingredients: ["Aloe Vera", "Wheatgrass", "Amla", "Tulsi", "Ginger"],
    usage: "Take 30ml twice daily before meals.",
  },
  {
    id: 4,
    image: "/Product4.jpeg",
    name: "Asthisudha Fortis",
    mrp: 1299,
    rating: 4.5,
    reviews: 1210,
    badge: "Popular",
    origin: "Ayurvedic Formula",
    benefits: ["Daily Wellness", "Balance", "Immunity"],
    description:
      "An Ayurvedic supplement formulated to support daily wellness, maintain body balance, and strengthen immunity naturally.",
    ingredients: ["Ashwagandha", "Tulsi", "Giloy", "Turmeric", "Ginger"],
    usage: "Take 2 capsules twice daily after meals.",
  },
  {
    id: 5,
    image: "/Product5.jpeg",
    name: "Pure Whey Protein",
    mrp: 1399,
    rating: 4.9,
    reviews: 760,
    badge: "Therapy",
    origin: "Kerala Tradition",
    benefits: ["Muscle Growth", "Recovery", "Strength"],
    description:
      "High-quality protein supplement that supports muscle growth, recovery, and overall strength with essential amino acids.",
    ingredients: [
      "Whey Protein Concentrate",
      "Essential Amino Acids",
      "Digestive Enzymes",
    ],
    usage: "Mix one scoop with water or milk and consume after workouts.",
  },
  {
    id: 6,
    image: "/Product6.jpeg",
    name: "AAmeagraa Vital",
    mrp: 1099,
    rating: 4.7,
    reviews: 3120,
    badge: "Top Rated",
    origin: "Himalayan Herbs",
    benefits: ["Strength", "Immunity", "Stamina"],
    description:
      "A powerful herbal tonic designed to enhance stamina, improve strength, and boost overall immunity using traditional herbs.",
    ingredients: ["Ashwagandha", "Shatavari", "Ginseng", "Brahmi", "Licorice"],
    usage: "Mix 10-15ml with water. Consume twice daily.",
  },
];

export default function App() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<
    (typeof PRODUCTS)[0] | null
  >(null);
  const [sortBy, setSortBy] = useState("featured");
  const [wishlist, setWishlist] = useState<number[]>([]);

  const filteredProducts = useMemo(() => {
    let filtered = PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortBy === "price-low") filtered.sort((a, b) => a.mrp - b.mrp);
    if (sortBy === "price-high") filtered.sort((a, b) => b.mrp - a.mrp);
    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [search, sortBy]);

  const toggleWishlist = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen selection:bg-brand-accent/30 bg-gradient-to-r from-[#061411] via-[#0b2620] to-[#4fb9a0]">
      <NavbarDemo />

      {/* Hero Section */}
      <section className="relative  pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 text-green font-semibold tracking-widest uppercase text-xs mb-6">
                <Sparkles size={14} />
                <span>Ancient Wisdom, Modern Science</span>
              </div>
              <div className="text-6xl md:text-8xl font-serif font-bold leading-[0.9] mb-8 text-brand-primary">
                Purity from the{" "}
                <span className="italic text-brand-secondary">Nature</span>
              </div>
              <div className="text-lg text-brand-primary/60 max-w-lg mb-10 leading-relaxed">
                Experience the transformative power of nature with our curated
                collection of authentic, lab-tested wellness essentials.
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="px-8 py-4 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-secondary transition-all flex items-center gap-2 group">
                  Explore Collection
                  <ArrowDown
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative aspect-square lg:aspect-auto lg:h-[600px] rounded-[40px] overflow-hidden shadow-2xl"
            >
              <img
                src="https://picsum.photos/seed/himalayas/1200/1600"
                alt="Himalayan landscape"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-1">
                      Featured Origin
                    </div>
                    <div className="text-xl font-serif font-bold text-brand-primary">
                      Uttarakhand, India
                    </div>
                  </div>
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${i + 10}`}
                          alt="User"
                        />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-brand-accent flex items-center justify-center text-[10px] font-bold text-white">
                      +2k
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="sticky top-24 z-40 px-6 mb-12">
        <div className="max-w-7xl mx-auto glass rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-lg">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search Here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-3 bg-brand-primary/5 rounded-xl border-none focus:ring-2 focus:ring-brand-accent/20 outline-none text-brand-primary placeholder:text-brand-primary/30"
              style={{ paddingLeft: '16px', paddingRight: '16px' }}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-brand-primary/5 px-4 py-3 rounded-xl border border-brand-primary/10">
              <ArrowUpDown size={18} className="text-brand-primary/40" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer text-brand-primary"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedProduct(product)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-white shadow-sm border border-brand-primary/5 mb-6">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://picsum.photos/seed/${product.id}/600/800`;
                      }}
                    />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {product.badge}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="absolute top-6 right-6 w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Heart
                        size={18}
                        className={
                          wishlist.includes(product.id)
                            ? "fill-rose-500 stroke-rose-500"
                            : "text-brand-primary/40"
                        }
                      />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-full py-4 bg-teal-500 text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-yellow-400 hover:text-black transition-all">
                        <Plus size={20} />
                        Quick Add
                      </div>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/40">
                        {product.origin}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star
                          size={12}
                          className="fill-brand-accent text-brand-accent"
                        />
                        <span className="text-xs font-bold">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-xl font-serif font-bold text-brand-primary mb-1 group-hover:text-brand-secondary transition-colors">
                      {product.name}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-primary">
                        ₹{product.mrp}
                      </span>
                      <span className="text-sm text-brand-primary/30 line-through">
                        ₹{Math.round(product.mrp * 1.2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-brand-primary/40 backdrop-blur-xl"
            />
            <motion.div
              layoutId={`product-${selectedProduct.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-brand-cream rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 bg-white p-12 flex items-center justify-center">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://picsum.photos/seed/${selectedProduct.id}/800/800`;
                  }}
                />
              </div>

              <div className="w-full md:w-1/2 p-12 overflow-y-auto">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {selectedProduct.badge}
                    </span>
                    <span className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest">
                      {selectedProduct.origin}
                    </span>
                  </div>
                  <div className="text-4xl font-serif font-bold text-brand-primary mb-4">
                    {selectedProduct.name}
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < Math.floor(selectedProduct.rating)
                              ? "fill-brand-accent text-brand-accent"
                              : "text-brand-primary/10"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-brand-primary/40">
                      {selectedProduct.reviews} Verified Reviews
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-bold text-brand-primary">
                      ₹{selectedProduct.mrp}
                    </span>
                    <span className="text-lg text-brand-primary/20 line-through">
                      ₹{Math.round(selectedProduct.mrp * 1.2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-8 mb-10">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-3">
                      The Essence
                    </div>
                    <div className="text-brand-primary/70 leading-relaxed">
                      {selectedProduct.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-3">
                        Key Benefits
                      </div>
                      <ul className="space-y-2">
                        {selectedProduct.benefits.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm text-brand-primary/80"
                          >
                            <Leaf size={14} className="text-brand-secondary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-3">
                        Ingredients
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.ingredients.map((i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-brand-primary/5 rounded-md text-[10px] font-medium text-brand-primary/60"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock size={18} className="text-brand-primary/40" />
                      <div className="text-sm font-bold text-brand-primary">
                        Ritual Guide
                      </div>
                    </div>
                    <div className="text-sm text-brand-primary/60">
                      {selectedProduct.usage}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={(e) => toggleWishlist(selectedProduct.id, e)}
                    className="w-16 py-5 border border-brand-primary/10 rounded-2xl flex items-center justify-center hover:bg-brand-primary/5 transition-all"
                  >
                    <Heart
                      size={24}
                      className={
                        wishlist.includes(selectedProduct.id)
                          ? "fill-rose-500 stroke-rose-500"
                          : "text-brand-primary/20"
                      }
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}
