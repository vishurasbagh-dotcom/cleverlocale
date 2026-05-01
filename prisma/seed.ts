import "dotenv/config";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SEED_ROOT_CATEGORIES } from "../src/lib/catalog-categories";
import { getProductImageDir } from "../src/lib/product-image-storage";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ru = (n: number) => Math.round(n * 100);

/** Subcategories per root slug (Indian e‑commerce style). */
const SUBCATEGORIES: Record<string, { slug: string; name: string; description: string }[]> = {
  "grocery-gourmet": [
    { slug: "grocery-staples", name: "Staples (Rice, Atta, Dal & Oil)", description: "Rice, atta, dal, cooking oil" },
    { slug: "grocery-spices-masala", name: "Spices & Masala", description: "Whole spices, powders, blends" },
    { slug: "grocery-snacks", name: "Snacks & Namkeen", description: "Namkeen, biscuits, instant snacks" },
    { slug: "grocery-beverages", name: "Tea, Coffee & Beverages", description: "Tea, coffee, health drinks" },
  ],
  "mobiles-accessories": [
    { slug: "mobile-smartphones", name: "Smartphones", description: "Android smartphones" },
    { slug: "mobile-cases-covers", name: "Cases & Covers", description: "Back covers, tempered glass" },
    { slug: "mobile-chargers-power", name: "Chargers & Power", description: "Cables, adapters, power banks" },
    { slug: "mobile-audio-wearables", name: "Audio & Wearables", description: "Earbuds, neckbands, watches" },
  ],
  "electronics-appliances": [
    { slug: "elec-tv", name: "TV & Home Entertainment", description: "LED TVs, streaming devices" },
    { slug: "elec-audio", name: "Audio & Headphones", description: "Speakers, soundbars, headphones" },
    { slug: "elec-small-appliances", name: "Small Appliances", description: "Mixer, iron, trimmers" },
    { slug: "elec-kitchen-appliances", name: "Kitchen Appliances", description: "Air fryer, OTG, kettles" },
  ],
  fashion: [
    { slug: "fashion-mens", name: "Men’s Clothing", description: "Shirts, jeans, ethnic" },
    { slug: "fashion-womens", name: "Women’s Clothing", description: "Kurtis, sarees, western" },
    { slug: "fashion-footwear", name: "Footwear", description: "Sports shoes, sandals, kolhapuris" },
    { slug: "fashion-ethnic", name: "Ethnic & Festive", description: "Sherwanis, lehengas, dupattas" },
  ],
  "home-kitchen": [
    { slug: "home-cookware", name: "Cookware", description: "Non-stick, pressure cooker, tawas" },
    { slug: "home-dinnerware", name: "Dinnerware & Serveware", description: "Steel, ceramic, glass" },
    { slug: "home-decor", name: "Home Décor", description: "Curtains, lamps, wall art" },
    { slug: "home-storage", name: "Storage & Organisation", description: "Containers, racks, organisers" },
  ],
  "beauty-personal-care": [
    { slug: "beauty-skincare", name: "Skin Care", description: "Face wash, sunscreen, serums" },
    { slug: "beauty-hair", name: "Hair Care", description: "Shampoo, oil, styling" },
    { slug: "beauty-grooming", name: "Shaving & Grooming", description: "Razors, trimmers, beard care" },
    { slug: "beauty-fragrance", name: "Fragrance & Deo", description: "Perfumes, body sprays" },
  ],
  "sports-fitness-outdoors": [
    { slug: "sports-fitness", name: "Fitness Equipment", description: "Dumbbells, mats, resistance" },
    { slug: "sports-cricket", name: "Cricket", description: "Bats, balls, kits" },
    { slug: "sports-badminton", name: "Badminton & Racquet Sports", description: "Racquets, shuttles, shoes" },
    { slug: "sports-yoga", name: "Yoga & Training", description: "Blocks, straps, bottles" },
  ],
  "books-stationery": [
    { slug: "books-fiction", name: "Fiction & Literature", description: "Novels, Indian authors" },
    { slug: "books-exam", name: "Exam Prep", description: "UPSC, SSC, entrance guides" },
    { slug: "books-stationery-office", name: "Stationery & Office", description: "Pens, diaries, desk supplies" },
  ],
  "baby-kids": [
    { slug: "baby-diaper", name: "Diapers & Wipes", description: "Tape, pants, wipes" },
    { slug: "baby-feeding", name: "Feeding & Nursing", description: "Bottles, sippers, sterilisers" },
    { slug: "baby-toys", name: "Toys & Learning", description: "Educational toys, puzzles" },
  ],
};

type VariantRow = {
  v1: string;
  v2: string;
  v3: string;
  priceRupees: number;
  stock: number;
  c1?: string | null;
  c2?: string | null;
  c3?: string | null;
};

type ProductDef = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  picSeeds: string[];
  simple?: { priceRupees: number; stock: number };
  nested?: {
    labels: [string, string, string];
    useColors: boolean;
    rows: VariantRow[];
  };
};

type VendorDef = {
  slug: string;
  shopName: string;
  ownerName: string;
  shopDescription: string;
  city: string;
  locality: string;
  pincode: string;
  addressLine1: string;
  mobileNumber: string;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  products: ProductDef[];
};

const VENDORS: VendorDef[] = [
  {
    slug: "mumbai-masala-mart",
    shopName: "Mumbai Masala Mart",
    ownerName: "Rajesh Patil",
    shopDescription: "Trusted neighbourhood grocer in Andheri — fresh staples, masalas and snacks.",
    city: "Mumbai",
    locality: "Andheri West",
    pincode: "400053",
    addressLine1: "Shop 18, Lokhandwala Complex, Near City Mall",
    mobileNumber: "9820114520",
    latitude: 19.1364,
    longitude: 72.8296,
    isFeatured: true,
    products: [
      {
        slug: "india-gate-basmati-5kg",
        name: "India Gate Classic Basmati Rice (5 kg)",
        description: "Long-grain basmati rice — ideal for biryani and everyday meals.",
        categorySlug: "grocery-staples",
        picSeeds: ["mm-basmati-1", "mm-basmati-2"],
        simple: { priceRupees: 649, stock: 80 },
      },
      {
        slug: "fortune-sunlite-oil-1l",
        name: "Fortune Sunlite Refined Sunflower Oil (1 L)",
        description: "Light cooking oil for everyday Indian cooking.",
        categorySlug: "grocery-staples",
        picSeeds: ["mm-oil-1"],
        simple: { priceRupees: 165, stock: 120 },
      },
      {
        slug: "aashirvaad-atta-variants",
        name: "Aashirvaad Superior Atta",
        description: "Whole wheat atta — choose pack size.",
        categorySlug: "grocery-staples",
        picSeeds: ["mm-atta-1", "mm-atta-2"],
        nested: {
          labels: ["Pack size", "Variant", ""],
          useColors: false,
          rows: [
            { v1: "5 kg", v2: "Standard", v3: "", priceRupees: 245, stock: 60 },
            { v1: "10 kg", v2: "Standard", v3: "", priceRupees: 465, stock: 45 },
            { v1: "5 kg", v2: "Multigrain", v3: "", priceRupees: 289, stock: 30 },
          ],
        },
      },
      {
        slug: "everest-garam-masala",
        name: "Everest Garam Masala (100 g)",
        description: "Aromatic blend for curries and pulaos.",
        categorySlug: "grocery-spices-masala",
        picSeeds: ["mm-masala-1"],
        simple: { priceRupees: 72, stock: 200 },
      },
      {
        slug: "haldiram-bhujia",
        name: "Haldiram’s Aloo Bhujia (1 kg)",
        description: "Crispy namkeen — tea-time favourite.",
        categorySlug: "grocery-snacks",
        picSeeds: ["mm-bhujia-1"],
        simple: { priceRupees: 320, stock: 55 },
      },
      {
        slug: "tata-tea-gold",
        name: "Tata Tea Gold (500 g)",
        description: "Strong flavour for cutting chai and morning cup.",
        categorySlug: "grocery-beverages",
        picSeeds: ["mm-tea-1"],
        simple: { priceRupees: 285, stock: 70 },
      },
      {
        slug: "nescafe-classic",
        name: "Nescafé Classic Coffee (200 g)",
        description: "Instant coffee — rich aroma.",
        categorySlug: "grocery-beverages",
        picSeeds: ["mm-coffee-1"],
        simple: { priceRupees: 525, stock: 40 },
      },
      {
        slug: "toor-dal-1kg",
        name: "Organic Tuar / Toor Dal (1 kg)",
        description: "Unpolished dal for everyday dal-rice.",
        categorySlug: "grocery-staples",
        picSeeds: ["mm-dal-1"],
        simple: { priceRupees: 142, stock: 90 },
      },
      {
        slug: "parle-g-family",
        name: "Parle-G Biscuits (800 g)",
        description: "Classic glucose biscuits — family pack.",
        categorySlug: "grocery-snacks",
        picSeeds: ["mm-parle-1"],
        simple: { priceRupees: 95, stock: 150 },
      },
      {
        slug: "mdh-kitchen-king",
        name: "MDH Kitchen King Masala (100 g)",
        description: "Versatile masala for mixed vegetables and gravies.",
        categorySlug: "grocery-spices-masala",
        picSeeds: ["mm-mdh-1"],
        simple: { priceRupees: 82, stock: 100 },
      },
    ],
  },
  {
    slug: "delhi-tech-plaza",
    shopName: "Delhi Tech Plaza",
    ownerName: "Priya Sharma",
    shopDescription: "Connaught Place electronics — mobiles, audio and smart accessories.",
    city: "New Delhi",
    locality: "Connaught Place",
    pincode: "110001",
    addressLine1: "Block A, Inner Circle, CP",
    mobileNumber: "9810238844",
    latitude: 28.6315,
    longitude: 77.2167,
    isFeatured: true,
    products: [
      {
        slug: "smartphone-style-triple",
        name: "NordEdge 5G Smartphone (demo series)",
        description: "6.7\" display, 50 MP camera — pick storage and colour.",
        categorySlug: "mobile-smartphones",
        picSeeds: ["dt-phone-1", "dt-phone-2", "dt-phone-3"],
        nested: {
          labels: ["Storage", "Colour", "Bundle"],
          useColors: true,
          rows: [
            { v1: "128 GB", v2: "Midnight Black", v3: "Phone only", priceRupees: 18999, stock: 25, c1: "#1a1a2e", c2: "#1a1a2e", c3: "#2d3436" },
            { v1: "128 GB", v2: "Glacier Blue", v3: "Phone only", priceRupees: 18999, stock: 22, c1: "#0984e3", c2: "#0984e3", c3: "#2d3436" },
            { v1: "256 GB", v2: "Midnight Black", v3: "Phone only", priceRupees: 20999, stock: 18, c1: "#1a1a2e", c2: "#1a1a2e", c3: "#2d3436" },
            { v1: "256 GB", v2: "Glacier Blue", v3: "With case", priceRupees: 21499, stock: 15, c1: "#0984e3", c2: "#0984e3", c3: "#636e72" },
          ],
        },
      },
      {
        slug: "wireless-earbuds-triple",
        name: "Noise Buds VS104 Truly Wireless",
        description: "ENC, 40 hr playback — colour and warranty pack.",
        categorySlug: "mobile-audio-wearables",
        picSeeds: ["dt-buds-1", "dt-buds-2"],
        nested: {
          labels: ["Colour", "Warranty", "Edition"],
          useColors: true,
          rows: [
            { v1: "Jet Black", v2: "1 Year", v3: "Standard", priceRupees: 1299, stock: 40, c1: "#2d3436", c2: "#2d3436", c3: null },
            { v1: "Ivory White", v2: "1 Year", v3: "Standard", priceRupees: 1299, stock: 35, c1: "#dfe6e9", c2: "#dfe6e9", c3: null },
            { v1: "Jet Black", v2: "2 Year", v3: "Pro", priceRupees: 1499, stock: 20, c1: "#2d3436", c2: "#2d3436", c3: null },
          ],
        },
      },
      {
        slug: "fast-charger-65w",
        name: "65W USB-C GaN Charger",
        description: "Laptop & phone fast charging — BIS certified.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["dt-chg-1"],
        simple: { priceRupees: 1899, stock: 50 },
      },
      {
        slug: "powerbank-20000",
        name: "Mi 20000 mAh Power Bank 3i",
        description: "Dual USB output, low current mode for wearables.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["dt-pb-1"],
        simple: { priceRupees: 2199, stock: 35 },
      },
      {
        slug: "bluetooth-speaker-nest",
        name: "JBL Go 3 Portable Speaker",
        description: "IP67 waterproof — pick colour.",
        categorySlug: "elec-audio",
        picSeeds: ["dt-jbl-1", "dt-jbl-2"],
        nested: {
          labels: ["Colour", "Region", ""],
          useColors: true,
          rows: [
            { v1: "Black", v2: "India", v3: "", priceRupees: 3299, stock: 18, c1: "#2d3436", c2: null, c3: null },
            { v1: "Blue", v2: "India", v3: "", priceRupees: 3299, stock: 16, c1: "#0984e3", c2: null, c3: null },
            { v1: "Red", v2: "India", v3: "", priceRupees: 3299, stock: 14, c1: "#d63031", c2: null, c3: null },
          ],
        },
      },
      {
        slug: "smartwatch-round",
        name: "Fire-Boltt Phoenix Smartwatch",
        description: "Bluetooth calling, SpO2 — strap and size.",
        categorySlug: "mobile-audio-wearables",
        picSeeds: ["dt-watch-1"],
        nested: {
          labels: ["Strap", "Dial", "Pack"],
          useColors: false,
          rows: [
            { v1: "Silicone Black", v2: "46 mm", v3: "Single", priceRupees: 1799, stock: 30 },
            { v1: "Silicone Blue", v2: "46 mm", v3: "Single", priceRupees: 1799, stock: 28 },
            { v1: "Metal Grey", v2: "46 mm", v3: "Gift box", priceRupees: 2199, stock: 12 },
          ],
        },
      },
      {
        slug: "tablet-stylus-combo",
        name: "10.4\" Android Tablet (demo)",
        description: "Study & entertainment — storage and keyboard bundle.",
        categorySlug: "mobile-smartphones",
        picSeeds: ["dt-tab-1"],
        nested: {
          labels: ["Storage", "Bundle", ""],
          useColors: false,
          rows: [
            { v1: "64 GB", v2: "Tablet only", v3: "", priceRupees: 12499, stock: 15 },
            { v1: "128 GB", v2: "Tablet only", v3: "", priceRupees: 14499, stock: 12 },
            { v1: "128 GB", v2: "With keyboard", v3: "", priceRupees: 15999, stock: 10 },
          ],
        },
      },
      {
        slug: "hdmi-cable-2m",
        name: "AmazonBasics HDMI 2.1 Cable (2 m)",
        description: "4K/120Hz — for TV and console.",
        categorySlug: "elec-tv",
        picSeeds: ["dt-hdmi-1"],
        simple: { priceRupees: 599, stock: 75 },
      },
      {
        slug: "mixer-grinder-750w",
        name: "Prestige Iris 750 W Mixer Grinder",
        description: "3 stainless jars — masala, wet grinding, chutney.",
        categorySlug: "elec-kitchen-appliances",
        picSeeds: ["dt-mixer-1"],
        simple: { priceRupees: 3895, stock: 22 },
      },
      {
        slug: "trimmer-washable",
        name: "Philips BT1232 Beard Trimmer",
        description: "USB charging, stainless steel blades.",
        categorySlug: "elec-small-appliances",
        picSeeds: ["dt-trim-1"],
        simple: { priceRupees: 899, stock: 60 },
      },
    ],
  },
  {
    slug: "bengaluru-ethnic-weaves",
    shopName: "Bengaluru Ethnic Weaves",
    ownerName: "Lakshmi Narayan",
    shopDescription: "Handpicked sarees, kurtis and festive wear from Karnataka & beyond.",
    city: "Bengaluru",
    locality: "Commercial Street",
    pincode: "560001",
    addressLine1: "45 Commercial Street, Shivajinagar",
    mobileNumber: "9845011122",
    latitude: 12.9833,
    longitude: 77.6089,
    isFeatured: false,
    products: [
      {
        slug: "cotton-saree-kanchi-style",
        name: "Cotton Silk Saree with Blouse",
        description: "Lightweight drape — border and blouse piece.",
        categorySlug: "fashion-womens",
        picSeeds: ["be-saree-1", "be-saree-2"],
        nested: {
          labels: ["Colour", "Border", "Blouse"],
          useColors: true,
          rows: [
            { v1: "Magenta", v2: "Gold zari", v3: "Contrast", priceRupees: 1899, stock: 14, c1: "#b71540", c2: "#fdcb6e", c3: "#6c5ce7" },
            { v1: "Navy", v2: "Silver zari", v3: "Matching", priceRupees: 2199, stock: 11, c1: "#1e3799", c2: "#dcdde1", c3: "#1e3799" },
            { v1: "Olive", v2: "Temple border", v3: "Contrast", priceRupees: 2499, stock: 9, c1: "#706fd3", c2: "#f8b500", c3: "#2c2c54" },
          ],
        },
      },
      {
        slug: "mens-linen-shirt",
        name: "Urban India Linen Casual Shirt",
        description: "Breathable linen — size and sleeve.",
        categorySlug: "fashion-mens",
        picSeeds: ["be-shirt-1"],
        nested: {
          labels: ["Size", "Sleeve", ""],
          useColors: false,
          rows: [
            { v1: "M", v2: "Full sleeve", v3: "", priceRupees: 1299, stock: 20 },
            { v1: "L", v2: "Full sleeve", v3: "", priceRupees: 1299, stock: 24 },
            { v1: "XL", v2: "Half sleeve", v3: "", priceRupees: 1199, stock: 18 },
          ],
        },
      },
      {
        slug: "kurta-pyjama-set",
        name: "Manyavar Style Kurta Pyjama Set",
        description: "Festive cotton blend — size variants.",
        categorySlug: "fashion-ethnic",
        picSeeds: ["be-kurta-1"],
        nested: {
          labels: ["Size", "Colour", ""],
          useColors: true,
          rows: [
            { v1: "40", v2: "Ivory", v3: "", priceRupees: 2499, stock: 10, c1: null, c2: "#f5f0e1", c3: null },
            { v1: "42", v2: "Ivory", v3: "", priceRupees: 2499, stock: 12, c1: null, c2: "#f5f0e1", c3: null },
            { v1: "40", v2: "Maroon", v3: "", priceRupees: 2699, stock: 8, c1: null, c2: "#6F1D1B", c3: null },
          ],
        },
      },
      {
        slug: "kolhapuri-chappal",
        name: "Authentic Kolhapuri Leather Chappal",
        description: "Handcrafted — men & women sizes.",
        categorySlug: "fashion-footwear",
        picSeeds: ["be-kolha-1"],
        nested: {
          labels: ["Size (UK)", "Finish", ""],
          useColors: false,
          rows: [
            { v1: "7", v2: "Natural tan", v3: "", priceRupees: 899, stock: 15 },
            { v1: "8", v2: "Natural tan", v3: "", priceRupees: 899, stock: 18 },
            { v1: "9", v2: "Dark brown", v3: "", priceRupees: 949, stock: 12 },
          ],
        },
      },
      {
        slug: "dupatta-phulkari",
        name: "Phulkari Embroidery Dupatta",
        description: "Punjabi-style phulkari on georgette.",
        categorySlug: "fashion-ethnic",
        picSeeds: ["be-dupatta-1"],
        simple: { priceRupees: 799, stock: 25 },
      },
      {
        slug: "jeans-slim-fit",
        name: "Levi’s Slim Fit Jeans (demo)",
        description: "Stretch denim — waist size.",
        categorySlug: "fashion-mens",
        picSeeds: ["be-jeans-1"],
        nested: {
          labels: ["Waist", "Length", ""],
          useColors: false,
          rows: [
            { v1: "32", v2: "32L", v3: "", priceRupees: 2799, stock: 14 },
            { v1: "34", v2: "32L", v3: "", priceRupees: 2799, stock: 16 },
            { v1: "36", v2: "34L", v3: "", priceRupees: 2899, stock: 10 },
          ],
        },
      },
      {
        slug: "sports-shoes-running",
        name: "Asian Running Shoes",
        description: "Lightweight mesh — UK size.",
        categorySlug: "fashion-footwear",
        picSeeds: ["be-shoe-1"],
        nested: {
          labels: ["UK Size", "Colour", ""],
          useColors: true,
          rows: [
            { v1: "8", v2: "Black", v3: "", priceRupees: 999, stock: 22, c1: null, c2: "#2d3436", c3: null },
            { v1: "9", v2: "Black", v3: "", priceRupees: 999, stock: 20, c1: null, c2: "#2d3436", c3: null },
            { v1: "9", v2: "Navy", v3: "", priceRupees: 1049, stock: 15, c1: null, c2: "#1e3799", c3: null },
          ],
        },
      },
      {
        slug: "kids-lehenga-choli",
        name: "Kids Festive Lehenga Choli Set",
        description: "Ages 6–8 / 8–10 — with dupatta.",
        categorySlug: "fashion-ethnic",
        picSeeds: ["be-kids-1"],
        nested: {
          labels: ["Age band", "Colour", ""],
          useColors: true,
          rows: [
            { v1: "6–8 Y", v2: "Pink", v3: "", priceRupees: 1599, stock: 8, c1: null, c2: "#fd79a8", c3: null },
            { v1: "8–10 Y", v2: "Pink", v3: "", priceRupees: 1699, stock: 7, c1: null, c2: "#fd79a8", c3: null },
            { v1: "8–10 Y", v2: "Yellow", v3: "", priceRupees: 1699, stock: 6, c1: null, c2: "#f9ca24", c3: null },
          ],
        },
      },
      {
        slug: "cotton-kurti-office",
        name: "W Women Straight Kurti",
        description: "Office wear cotton — size.",
        categorySlug: "fashion-womens",
        picSeeds: ["be-kurti-1"],
        nested: {
          labels: ["Size", "Sleeve", ""],
          useColors: false,
          rows: [
            { v1: "S", v2: "3/4 sleeve", v3: "", priceRupees: 599, stock: 20 },
            { v1: "M", v2: "3/4 sleeve", v3: "", priceRupees: 599, stock: 25 },
            { v1: "L", v2: "Full sleeve", v3: "", priceRupees: 649, stock: 18 },
          ],
        },
      },
      {
        slug: "stole-wool-blend",
        name: "Pashmina-Style Wool Blend Stole",
        description: "Winter stole — solid colours.",
        categorySlug: "fashion-womens",
        picSeeds: ["be-stole-1"],
        simple: { priceRupees: 449, stock: 40 },
      },
    ],
  },
  {
    slug: "chennai-home-bazaar",
    shopName: "Chennai Home Bazaar",
    ownerName: "Karthik Iyer",
    shopDescription: "T Nagar home store — cookware, storage and décor for Tamil Nadu homes.",
    city: "Chennai",
    locality: "T. Nagar",
    pincode: "600017",
    addressLine1: "12 North Usman Road, Near Pondy Bazaar",
    mobileNumber: "9444022331",
    latitude: 13.0418,
    longitude: 80.2341,
    isFeatured: false,
    products: [
      {
        slug: "prestige-pressure-cooker-5l",
        name: "Prestige Popular Aluminium Pressure Cooker (5 L)",
        description: "ISI marked — with gasket and weight valve.",
        categorySlug: "home-cookware",
        picSeeds: ["ch-pc-1"],
        simple: { priceRupees: 1349, stock: 28 },
      },
      {
        slug: "nonstick-tawa-set",
        name: "Pigeon Non-Stick Tawa & Fry Pan Combo",
        description: "Induction base — 2-piece set.",
        categorySlug: "home-cookware",
        picSeeds: ["ch-tawa-1"],
        simple: { priceRupees: 899, stock: 35 },
      },
      {
        slug: "steel-dinner-set-24",
        name: "Vinod Stainless Steel Dinner Set (24 pcs)",
        description: "Mirror finish — plates, bowls, glasses.",
        categorySlug: "home-dinnerware",
        picSeeds: ["ch-steel-1"],
        nested: {
          labels: ["Grade", "Pieces", ""],
          useColors: false,
          rows: [
            { v1: "Regular", v2: "24 pc", v3: "", priceRupees: 2899, stock: 12 },
            { v1: "Heavy gauge", v2: "24 pc", v3: "", priceRupees: 3499, stock: 8 },
            { v1: "Regular", v2: "36 pc", v3: "", priceRupees: 3899, stock: 6 },
          ],
        },
      },
      {
        slug: "ceramic-bowl-set",
        name: "Clay Craft Ceramic Serving Bowls (Set of 6)",
        description: "Microwave safe — nested serving.",
        categorySlug: "home-dinnerware",
        picSeeds: ["ch-bowl-1"],
        simple: { priceRupees: 1299, stock: 20 },
      },
      {
        slug: "curtain-blackout",
        name: "Story@Home Blackout Curtains (7 ft, 2 panels)",
        description: "Thermal insulated — pick colour.",
        categorySlug: "home-decor",
        picSeeds: ["ch-curtain-1"],
        nested: {
          labels: ["Colour", "Width", ""],
          useColors: true,
          rows: [
            { v1: "Beige", v2: "5 ft window", v3: "", priceRupees: 1299, stock: 14, c1: "#d4a574", c2: null, c3: null },
            { v1: "Navy", v2: "5 ft window", v3: "", priceRupees: 1299, stock: 12, c1: "#1e3799", c2: null, c3: null },
            { v1: "Beige", v2: "7 ft door", v3: "", priceRupees: 1599, stock: 10, c1: "#d4a574", c2: null, c3: null },
          ],
        },
      },
      {
        slug: "storage-container-klip",
        name: "Milton Klip It Storage Containers (Set of 6)",
        description: "Airtight — BPA free.",
        categorySlug: "home-storage",
        picSeeds: ["ch-milton-1"],
        simple: { priceRupees: 449, stock: 55 },
      },
      {
        slug: "wall-shelf-wood",
        name: "Floating Wall Shelf (60 cm)",
        description: "MDF with brackets — walnut finish.",
        categorySlug: "home-decor",
        picSeeds: ["ch-shelf-1"],
        simple: { priceRupees: 799, stock: 22 },
      },
      {
        slug: "water-bottle-steel-1l",
        name: "Milton Thermosteel Flip Lid Bottle (1 L)",
        description: "24 hr hot/cold — colour.",
        categorySlug: "home-storage",
        picSeeds: ["ch-bottle-1"],
        nested: {
          labels: ["Colour", "Cap type", ""],
          useColors: true,
          rows: [
            { v1: "Silver", v2: "Flip", v3: "", priceRupees: 899, stock: 20, c1: "#b2bec3", c2: null, c3: null },
            { v1: "Blue", v2: "Flip", v3: "", priceRupees: 899, stock: 18, c1: "#0984e3", c2: null, c3: null },
          ],
        },
      },
      {
        slug: "bamboo-laundry-basket",
        name: "Handwoven Bamboo Laundry Basket",
        description: "Ventilated — with lid.",
        categorySlug: "home-storage",
        picSeeds: ["ch-laundry-1"],
        simple: { priceRupees: 1299, stock: 15 },
      },
      {
        slug: "led-table-lamp",
        name: "Study LED Table Lamp (Touch dimmer)",
        description: "USB charging port — white & warm modes.",
        categorySlug: "home-decor",
        picSeeds: ["ch-lamp-1"],
        simple: { priceRupees: 649, stock: 30 },
      },
    ],
  },
  {
    slug: "hyderabad-mobile-zone",
    shopName: "Hyderabad Mobile Zone",
    ownerName: "Syed Imran",
    shopDescription: "Banjara Hills mobile store — covers, glass, audio and wearables.",
    city: "Hyderabad",
    locality: "Banjara Hills",
    pincode: "500034",
    addressLine1: "Road No. 12, Near GVK One",
    mobileNumber: "9849098877",
    latitude: 17.4156,
    longitude: 78.4347,
    isFeatured: false,
    products: [
      {
        slug: "tempered-glass-universal",
        name: "Spigen Style Tempered Glass (demo sizes)",
        description: "9H hardness — model and pack.",
        categorySlug: "mobile-cases-covers",
        picSeeds: ["hm-glass-1"],
        nested: {
          labels: ["Phone model", "Pack", ""],
          useColors: false,
          rows: [
            { v1: "6.5\" generic", v2: "1 pc", v3: "", priceRupees: 199, stock: 100 },
            { v1: "6.5\" generic", v2: "2 pc", v3: "", priceRupees: 349, stock: 80 },
            { v1: "6.7\" generic", v2: "1 pc", v3: "", priceRupees: 249, stock: 90 },
          ],
        },
      },
      {
        slug: "silicone-back-cover",
        name: "Soft Silicone Back Cover",
        description: "Matte finish — model and colour.",
        categorySlug: "mobile-cases-covers",
        picSeeds: ["hm-case-1"],
        nested: {
          labels: ["Model series", "Colour", ""],
          useColors: true,
          rows: [
            { v1: "Series A", v2: "Black", v3: "", priceRupees: 299, stock: 45, c1: null, c2: "#2d3436", c3: null },
            { v1: "Series A", v2: "Blue", v3: "", priceRupees: 299, stock: 40, c1: null, c2: "#0984e3", c3: null },
            { v1: "Series B", v2: "Black", v3: "", priceRupees: 349, stock: 35, c1: null, c2: "#2d3436", c3: null },
          ],
        },
      },
      {
        slug: "neckband-bluetooth",
        name: "boAt Rockerz 255 Neckband",
        description: "ASAP charge — colour variant.",
        categorySlug: "mobile-audio-wearables",
        picSeeds: ["hm-neck-1"],
        nested: {
          labels: ["Colour", "Seller warranty", ""],
          useColors: true,
          rows: [
            { v1: "Navy Blue", v2: "1 yr", v3: "", priceRupees: 899, stock: 35, c1: null, c2: "#1e3799", c3: null },
            { v1: "Active Black", v2: "1 yr", v3: "", priceRupees: 899, stock: 40, c1: null, c2: "#2d3436", c3: null },
          ],
        },
      },
      {
        slug: "car-phone-holder",
        name: "Gravity Car Phone Holder (AC vent)",
        description: "Fits 4.7–6.8\" phones.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["hm-car-1"],
        simple: { priceRupees: 399, stock: 50 },
      },
      {
        slug: "selfie-ring-light",
        name: "10\" LED Ring Light with Tripod",
        description: "For reels & video calls.",
        categorySlug: "mobile-cases-covers",
        picSeeds: ["hm-ring-1"],
        simple: { priceRupees: 899, stock: 25 },
      },
      {
        slug: "otg-adapter-typec",
        name: "Type-C OTG Adapter (USB 3.0)",
        description: "Pen drive support for Type-C phones.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["hm-otg-1"],
        simple: { priceRupees: 149, stock: 120 },
      },
      {
        slug: "laptop-stand-alum",
        name: "Aluminium Foldable Laptop Stand",
        description: "6-level tilt — fits 11–17\".",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["hm-stand-1"],
        simple: { priceRupees: 1299, stock: 30 },
      },
      {
        slug: "smartwatch-strap-combo",
        name: "Universal 22 mm Watch Strap (2-pack)",
        description: "Silicone — colour combo.",
        categorySlug: "mobile-audio-wearables",
        picSeeds: ["hm-strap-1"],
        nested: {
          labels: ["Combo", "Colour A", "Colour B"],
          useColors: true,
          rows: [
            { v1: "Sport", v2: "Black", v3: "Grey", priceRupees: 399, stock: 25, c1: "#2d3436", c2: "#636e72", c3: "#2d3436" },
            { v1: "Sport", v2: "Navy", v3: "White", priceRupees: 399, stock: 22, c1: "#0984e3", c2: "#dfe6e9", c3: "#0984e3" },
          ],
        },
      },
      {
        slug: "wireless-mouse-slim",
        name: "Logitech Pebble M350 (demo)",
        description: "Silent clicks — colour.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["hm-mouse-1"],
        nested: {
          labels: ["Colour", "Connectivity", ""],
          useColors: true,
          rows: [
            { v1: "Graphite", v2: "Bluetooth", v3: "", priceRupees: 1495, stock: 18, c1: null, c2: "#2d3436", c3: null },
            { v1: "White", v2: "Bluetooth", v3: "", priceRupees: 1495, stock: 16, c1: null, c2: "#dfe6e9", c3: null },
          ],
        },
      },
      {
        slug: "usb-hub-4port",
        name: "4-Port USB 3.0 Hub",
        description: "Slim hub for laptop.",
        categorySlug: "mobile-chargers-power",
        picSeeds: ["hm-hub-1"],
        simple: { priceRupees: 599, stock: 40 },
      },
    ],
  },
  {
    slug: "kolkata-sports-arena",
    shopName: "Kolkata Sports Arena",
    ownerName: "Debjit Bose",
    shopDescription: "Lake Market sports shop — cricket, badminton and fitness for clubs & schools.",
    city: "Kolkata",
    locality: "Southern Avenue",
    pincode: "700029",
    addressLine1: "88 Southern Avenue, Near Lake Temple",
    mobileNumber: "9830011223",
    latitude: 22.518,
    longitude: 88.363,
    isFeatured: false,
    products: [
      {
        slug: "cricket-bat-kashmir",
        name: "SG Kashmir Willow Cricket Bat",
        description: "Short handle — weight grade.",
        categorySlug: "sports-cricket",
        picSeeds: ["ks-bat-1", "ks-bat-2"],
        nested: {
          labels: ["Weight", "Grip", ""],
          useColors: false,
          rows: [
            { v1: "1180–1220 g", v2: "Standard", v3: "", priceRupees: 1899, stock: 15 },
            { v1: "1180–1220 g", v2: "Octopus", v3: "", priceRupees: 1999, stock: 12 },
            { v1: "1220–1260 g", v2: "Standard", v3: "", priceRupees: 2199, stock: 10 },
          ],
        },
      },
      {
        slug: "cricket-tennis-ball-pack",
        name: "Nivia Heavy Tennis Ball (Pack of 6)",
        description: "Street cricket favourite.",
        categorySlug: "sports-cricket",
        picSeeds: ["ks-ball-1"],
        simple: { priceRupees: 420, stock: 60 },
      },
      {
        slug: "badminton-racquet-nest",
        name: "Yonex GR 303 Badminton Racquet",
        description: "Aluminium — tension and grip.",
        categorySlug: "sports-badminton",
        picSeeds: ["ks-yonex-1"],
        nested: {
          labels: ["String tension", "Grip size", ""],
          useColors: false,
          rows: [
            { v1: "18–20 lbs", v2: "G4", v3: "", priceRupees: 899, stock: 20 },
            { v1: "20–22 lbs", v2: "G4", v3: "", priceRupees: 949, stock: 18 },
            { v1: "18–20 lbs", v2: "G5", v3: "", priceRupees: 899, stock: 16 },
          ],
        },
      },
      {
        slug: "shuttlecock-feather",
        name: "Li-Ning A+ Feather Shuttle (Tube 12)",
        description: "Tournament practice shuttles.",
        categorySlug: "sports-badminton",
        picSeeds: ["ks-shuttle-1"],
        simple: { priceRupees: 1299, stock: 35 },
      },
      {
        slug: "yoga-mat-6mm",
        name: "Strauss Anti-Skid Yoga Mat (6 mm)",
        description: "Colour options.",
        categorySlug: "sports-yoga",
        picSeeds: ["ks-mat-1"],
        nested: {
          labels: ["Colour", "Carry strap", ""],
          useColors: true,
          rows: [
            { v1: "Purple", v2: "Included", v3: "", priceRupees: 699, stock: 25, c1: null, c2: "#6c5ce7", c3: null },
            { v1: "Teal", v2: "Included", v3: "", priceRupees: 699, stock: 22, c1: null, c2: "#00b894", c3: null },
          ],
        },
      },
      {
        slug: "dumbbell-set-pvc",
        name: "Kore PVC Dumbbell Set (2×5 kg)",
        description: "Home gym starter.",
        categorySlug: "sports-fitness",
        picSeeds: ["ks-dumb-1"],
        simple: { priceRupees: 899, stock: 28 },
      },
      {
        slug: "skipping-rope-steel",
        name: "Steel Wire Speed Skipping Rope",
        description: "Adjustable length — bearing handles.",
        categorySlug: "sports-fitness",
        picSeeds: ["ks-rope-1"],
        simple: { priceRupees: 349, stock: 45 },
      },
      {
        slug: "football-size-5",
        name: "Nivia Storm Football (Size 5)",
        description: "Hand-stitched — training ball.",
        categorySlug: "sports-fitness",
        picSeeds: ["ks-football-1"],
        simple: { priceRupees: 599, stock: 30 },
      },
      {
        slug: "sipper-bottle-750",
        name: "Milton Hawk Sipper (750 ml)",
        description: "BPA free — colour.",
        categorySlug: "sports-yoga",
        picSeeds: ["ks-sipper-1"],
        nested: {
          labels: ["Colour", "Cap", ""],
          useColors: true,
          rows: [
            { v1: "Red", v2: "Flip", v3: "", priceRupees: 249, stock: 40, c1: null, c2: "#d63031", c3: null },
            { v1: "Blue", v2: "Flip", v3: "", priceRupees: 249, stock: 38, c1: null, c2: "#0984e3", c3: null },
          ],
        },
      },
      {
        slug: "wrist-band-gym",
        name: "Gym Wrist Support Wraps (Pair)",
        description: "Thumb loop — universal.",
        categorySlug: "sports-fitness",
        picSeeds: ["ks-wrist-1"],
        simple: { priceRupees: 399, stock: 50 },
      },
    ],
  },
];

/** Legacy `vendor@cleverlocale.local` — Ahmedabad Farsan & Snacks */
const LEGACY_VENDOR_PRODUCTS: ProductDef[] = [
  {
    slug: "ahm-gits-dhokla-mix",
    name: "Gits Instant Khaman Dhokla Mix (200 g)",
    description: "Just add curd — soft dhokla in minutes. Gujarati favourite.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-dhokla-1", "ahm-dhokla-2"],
    simple: { priceRupees: 65, stock: 120 },
  },
  {
    slug: "ahm-gathiya-spicy-mild",
    name: "Law Garden Special Gathiya",
    description: "Crispy besan sticks — choose pack and spice level.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-gathiya-1"],
    nested: {
      labels: ["Pack", "Spice", ""],
      useColors: false,
      rows: [
        { v1: "250 g", v2: "Mild", v3: "", priceRupees: 90, stock: 60 },
        { v1: "250 g", v2: "Extra spicy", v3: "", priceRupees: 90, stock: 45 },
        { v1: "500 g", v2: "Mild", v3: "", priceRupees: 165, stock: 40 },
        { v1: "500 g", v2: "Extra spicy", v3: "", priceRupees: 165, stock: 35 },
      ],
    },
  },
  {
    slug: "ahm-chakli-jar",
    name: "Hand-Rolled Chakli (400 g jar)",
    description: "Crunchy rice-and-urad spirals — festival ready.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-chakli-1"],
    simple: { priceRupees: 195, stock: 55 },
  },
  {
    slug: "ahm-khakhra-assorted",
    name: "Jeera Khakhra (Whole Wheat)",
    description: "Roasted thin crackers — flavour and pack.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-khakhra-1", "ahm-khakhra-2"],
    nested: {
      labels: ["Flavour", "Pack", ""],
      useColors: false,
      rows: [
        { v1: "Jeera", v2: "200 g", v3: "", priceRupees: 110, stock: 70 },
        { v1: "Methi", v2: "200 g", v3: "", priceRupees: 115, stock: 65 },
        { v1: "Masala", v2: "400 g", v3: "", priceRupees: 210, stock: 40 },
      ],
    },
  },
  {
    slug: "ahm-sev-kurmura",
    name: "Teekha Sev Kurmura Mix (300 g)",
    description: "Street-style bhel mix — add onions & chutney at home.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-bhel-1"],
    simple: { priceRupees: 85, stock: 90 },
  },
  {
    slug: "ahm-urad-papad",
    name: "Homestyle Urad Dal Papad",
    description: "Sun-dried papad — count per pack.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-papad-1"],
    nested: {
      labels: ["Pieces per pack", "Size", ""],
      useColors: false,
      rows: [
        { v1: "25 pcs", v2: "Regular", v3: "", priceRupees: 140, stock: 50 },
        { v1: "50 pcs", v2: "Regular", v3: "", priceRupees: 265, stock: 35 },
        { v1: "25 pcs", v2: "Mini", v3: "", priceRupees: 125, stock: 40 },
      ],
    },
  },
  {
    slug: "ahm-diwali-farsan-box",
    name: "Festive Farsan Gift Box",
    description: "Assorted namkeen — box size and veg/premium line.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-gift-1", "ahm-gift-2"],
    nested: {
      labels: ["Box", "Line", ""],
      useColors: false,
      rows: [
        { v1: "500 g", v2: "Classic veg", v3: "", priceRupees: 449, stock: 25 },
        { v1: "1 kg", v2: "Classic veg", v3: "", priceRupees: 799, stock: 18 },
        { v1: "1 kg", v2: "Premium (dry fruits)", v3: "", priceRupees: 1299, stock: 12 },
      ],
    },
  },
  {
    slug: "ahm-sonf-mukhwas",
    name: "Royal Sonf Mukhwas (150 g)",
    description: "Sweet fennel mix — after-meal refresher.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-mukhwas-1"],
    simple: { priceRupees: 120, stock: 75 },
  },
  {
    slug: "ahm-poha-chivda",
    name: "Thin Poha Chivda (500 g)",
    description: "Light flattened-rice mixture with curry leaves and peanuts.",
    categorySlug: "grocery-snacks",
    picSeeds: ["ahm-chivda-1"],
    simple: { priceRupees: 175, stock: 48 },
  },
  {
    slug: "ahm-handvo-mix",
    name: "Handvo / Vegetable Cake Mix (500 g)",
    description: "Multigrain savoury cake mix — bake or pan-cook.",
    categorySlug: "grocery-staples",
    picSeeds: ["ahm-handvo-1"],
    simple: { priceRupees: 155, stock: 42 },
  },
];

async function replaceProductImages(productId: string, picSeeds: string[]) {
  await prisma.productImage.deleteMany({ where: { productId } });
  const dir = getProductImageDir(productId);
  await rm(dir, { recursive: true, force: true }).catch(() => {});
  for (let i = 0; i < picSeeds.length; i++) {
    const url = `https://picsum.photos/seed/${encodeURIComponent(picSeeds[i]!)}/600/600.jpg`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const storedName = `${randomBytes(16).toString("hex")}.jpg`;
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, storedName), buf);
      await prisma.productImage.create({
        data: { productId, storedName, sortOrder: i },
      });
    } catch (e) {
      console.warn(`  [images] skipped for product ${productId} (${picSeeds[i]}):`, (e as Error).message);
    }
  }
}

async function upsertProduct(
  vendorId: string,
  categoryBySlug: Record<string, { id: string }>,
  def: ProductDef,
) {
  const cat = categoryBySlug[def.categorySlug];
  if (!cat) {
    throw new Error(`Seed: missing category slug "${def.categorySlug}" for product ${def.slug}`);
  }

  const hasNested = Boolean(def.nested?.rows.length);
  const simple = def.simple;

  const baseStock = simple
    ? simple.stock
    : hasNested
      ? def.nested!.rows.reduce((s, r) => s + r.stock, 0)
      : 0;
  const basePrice = simple ? ru(simple.priceRupees) : 0;

  const product = await prisma.product.upsert({
    where: { vendorId_slug: { vendorId, slug: def.slug } },
    create: {
      vendorId,
      categoryId: cat.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      pricePaise: basePrice,
      stock: baseStock,
      isPublished: true,
      useVariantPricing: hasNested,
      useVariantColors: def.nested?.useColors ?? false,
      variantLabel1: hasNested ? def.nested!.labels[0] : null,
      variantLabel2: hasNested && def.nested!.labels[1] ? def.nested!.labels[1] : null,
      variantLabel3: hasNested && def.nested!.labels[2] ? def.nested!.labels[2] : null,
    },
    update: {
      categoryId: cat.id,
      name: def.name,
      description: def.description,
      pricePaise: basePrice,
      stock: baseStock,
      isPublished: true,
      useVariantPricing: hasNested,
      useVariantColors: def.nested?.useColors ?? false,
      variantLabel1: hasNested ? def.nested!.labels[0] : null,
      variantLabel2: hasNested && def.nested!.labels[1] ? def.nested!.labels[1] : null,
      variantLabel3: hasNested && def.nested!.labels[2] ? def.nested!.labels[2] : null,
    },
  });

  await prisma.productVariant.deleteMany({ where: { productId: product.id } });

  if (hasNested && def.nested) {
    const useColors = def.nested.useColors;
    for (let i = 0; i < def.nested.rows.length; i++) {
      const r = def.nested.rows[i]!;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          value1: r.v1,
          value2: r.v2,
          value3: r.v3,
          pricePaise: ru(r.priceRupees),
          stock: r.stock,
          sortOrder: i,
          color1: useColors && r.c1 ? r.c1 : null,
          color2: useColors && r.c2 ? r.c2 : null,
          color3: useColors && r.c3 ? r.c3 : null,
        },
      });
    }
  }

  await replaceProductImages(product.id, def.picSeeds);
}

async function main() {
  const passwordHash = await bcrypt.hash("cl@123", 12);

  const adminAccounts = [
    { email: "admin1@cleverlocale.local", name: "CL Admin 1" },
    { email: "admin2@cleverlocale.local", name: "CL Admin 2" },
    { email: "admin3@cleverlocale.local", name: "CL Admin 3" },
  ] as const;

  for (const a of adminAccounts) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { passwordHash, role: "ADMIN", name: a.name },
      create: {
        email: a.email,
        passwordHash,
        name: a.name,
        role: "ADMIN",
      },
    });
  }

  const customerAccounts = [
    { email: "user1@cleverlocale.local", name: "Arjun Mehta" },
    { email: "user2@cleverlocale.local", name: "Sneha Reddy" },
    { email: "user3@cleverlocale.local", name: "Vikram Singh" },
  ] as const;

  for (const c of customerAccounts) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, name: c.name, role: "CUSTOMER" },
      create: {
        email: c.email,
        passwordHash,
        name: c.name,
        role: "CUSTOMER",
      },
    });
    await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@cleverlocale.local" },
    update: { passwordHash, role: "ADMIN", name: "Platform Admin (legacy)" },
    create: {
      email: "admin@cleverlocale.local",
      passwordHash,
      name: "Platform Admin (legacy)",
      role: "ADMIN",
    },
  });

  const legacyVendorUser = await prisma.user.upsert({
    where: { email: "vendor@cleverlocale.local" },
    update: { passwordHash, role: "VENDOR", name: "Rakesh Agarwal" },
    create: {
      email: "vendor@cleverlocale.local",
      passwordHash,
      name: "Rakesh Agarwal",
      role: "VENDOR",
    },
  });

  await prisma.vendor.upsert({
    where: { userId: legacyVendorUser.id },
    update: {
      shopName: "Ahmedabad Farsan & Snacks",
      slug: "ahmedabad-farsan-snacks",
      shopDescription: "Traditional Gujarati farsan — shipped fresh from Law Garden.",
      status: "APPROVED",
      isShopOpen: true,
      isAdminShopClosed: false,
      isFeatured: false,
      mobileNumber: "9879500011",
      shopLocation: {
        upsert: {
          create: {
            city: "Ahmedabad",
            locality: "Law Garden",
            pincode: "380006",
            addressLine1: "Near Law Garden Night Market",
            latitude: 23.0246,
            longitude: 72.5567,
          },
          update: {
            city: "Ahmedabad",
            locality: "Law Garden",
            pincode: "380006",
            addressLine1: "Near Law Garden Night Market",
            latitude: 23.0246,
            longitude: 72.5567,
          },
        },
      },
    },
    create: {
      userId: legacyVendorUser.id,
      shopName: "Ahmedabad Farsan & Snacks",
      slug: "ahmedabad-farsan-snacks",
      shopDescription: "Traditional Gujarati farsan — shipped fresh from Law Garden.",
      status: "APPROVED",
      isShopOpen: true,
      isAdminShopClosed: false,
      isFeatured: false,
      mobileNumber: "9879500011",
      shopLocation: {
        create: {
          city: "Ahmedabad",
          locality: "Law Garden",
          pincode: "380006",
          addressLine1: "Near Law Garden Night Market",
          latitude: 23.0246,
          longitude: 72.5567,
        },
      },
    },
  });

  const legacyCustomer = await prisma.user.upsert({
    where: { email: "customer@cleverlocale.local" },
    update: { passwordHash, name: "Demo Customer (legacy)", role: "CUSTOMER" },
    create: {
      email: "customer@cleverlocale.local",
      passwordHash,
      name: "Demo Customer (legacy)",
      role: "CUSTOMER",
    },
  });

  await prisma.cart.upsert({
    where: { userId: legacyCustomer.id },
    update: {},
    create: { userId: legacyCustomer.id },
  });

  const categoryBySlug: Record<string, { id: string }> = {};

  for (const c of DEFAULT_SEED_ROOT_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, parentId: null },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        parentId: null,
      },
    });
    categoryBySlug[c.slug] = { id: row.id };
  }

  for (const [parentSlug, children] of Object.entries(SUBCATEGORIES)) {
    const parent = categoryBySlug[parentSlug];
    if (!parent) {
      throw new Error(`Seed: missing parent category ${parentSlug}`);
    }
    for (const ch of children) {
      const row = await prisma.category.upsert({
        where: { slug: ch.slug },
        update: {
          name: ch.name,
          description: ch.description,
          parentId: parent.id,
        },
        create: {
          slug: ch.slug,
          name: ch.name,
          description: ch.description,
          parentId: parent.id,
        },
      });
      categoryBySlug[ch.slug] = { id: row.id };
    }
  }

  for (const v of VENDORS) {
    const email = `${v.slug}@cleverlocale.local`;
    const vendorUser = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "VENDOR", name: v.ownerName },
      create: {
        email,
        passwordHash,
        name: v.ownerName,
        role: "VENDOR",
      },
    });

    const vendor = await prisma.vendor.upsert({
      where: { userId: vendorUser.id },
      update: {
        shopName: v.shopName,
        slug: v.slug,
        shopDescription: v.shopDescription,
        status: "APPROVED",
        isShopOpen: true,
        isAdminShopClosed: false,
        isFeatured: v.isFeatured,
        mobileNumber: v.mobileNumber,
        shopLocation: {
          upsert: {
            create: {
              city: v.city,
              locality: v.locality,
              pincode: v.pincode,
              addressLine1: v.addressLine1,
              latitude: v.latitude,
              longitude: v.longitude,
            },
            update: {
              city: v.city,
              locality: v.locality,
              pincode: v.pincode,
              addressLine1: v.addressLine1,
              latitude: v.latitude,
              longitude: v.longitude,
            },
          },
        },
      },
      create: {
        userId: vendorUser.id,
        shopName: v.shopName,
        slug: v.slug,
        shopDescription: v.shopDescription,
        status: "APPROVED",
        isShopOpen: true,
        isAdminShopClosed: false,
        isFeatured: v.isFeatured,
        mobileNumber: v.mobileNumber,
        shopLocation: {
          create: {
            city: v.city,
            locality: v.locality,
            pincode: v.pincode,
            addressLine1: v.addressLine1,
            latitude: v.latitude,
            longitude: v.longitude,
          },
        },
      },
    });

    for (const p of v.products) {
      await upsertProduct(vendor.id, categoryBySlug, p);
    }
  }

  const legacyVendorRow = await prisma.vendor.findUnique({
    where: { userId: legacyVendorUser.id },
  });
  if (legacyVendorRow) {
    for (const p of LEGACY_VENDOR_PRODUCTS) {
      await upsertProduct(legacyVendorRow.id, categoryBySlug, p);
    }
  }

  console.log("Seed complete.");
  console.log(`  Root categories: ${DEFAULT_SEED_ROOT_CATEGORIES.map((c) => c.slug).join(", ")}`);
  console.log("  Password for all seeded accounts: cl@123");
  console.log("  CL Admin: admin1@ … admin3@ @cleverlocale.local");
  console.log("  Customers: user1@ … user3@ @cleverlocale.local");
  console.log("  Legacy: admin@ / vendor@ (Ahmedabad Farsan) / customer@ @cleverlocale.local");
  console.log("  Vendors (email = <shop-slug>@cleverlocale.local):");
  for (const v of VENDORS) {
    console.log(`    • ${v.shopName} — ${v.slug}@cleverlocale.local (${v.city})`);
  }
  console.log("    • Ahmedabad Farsan & Snacks — vendor@cleverlocale.local (legacy login)");
  console.log("  Tip: run `npx prisma migrate deploy` before seed on a fresh DB.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
