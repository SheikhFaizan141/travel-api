import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Categories (removed 'as const' to make mutable)
const CATEGORIES = [
  { name: "Hotels", slug: "hotels", description: "Hotels and accommodations" }, // Fixed typo in slug
  { name: "Huts", slug: "huts", description: "Huts and cabins" },
  {
    name: "Houseboats",
    slug: "houseboats",
    description: "Houseboats and floating homes",
  },
  {
    name: "Restaurants",
    slug: "restaurants",
    description: "Dining and eateries",
  },
];

const LOCATIONS = [
  {
    name: "Srinagar",
    slug: "srinagar",
    description:
      "The summer capital of Jammu and Kashmir, famous for Dal Lake and houseboats",
  },
  {
    name: "Pahalgam",
    slug: "pahalgam",
    description: "Hill station known for lush valleys and trekking routes",
  },
  {
    name: "Gulmarg",
    slug: "gulmarg",
    description: "Ski resort destination with the world's highest gondola",
  },
];

const FEATURES = [
  "Free WiFi",
  "Swimming Pool",
  "Spa",
  "Restaurant",
  "Room Service",
  "Mountain View",
  "Lake View",
  "Ski Access",
  "Parking",
  "Family Rooms",
];

const prisma = new PrismaClient();

async function main() {
  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const [admin, user] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        password: adminPassword,
        name: "Admin User",
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: "user@example.com" },
      update: {},
      create: {
        email: "user@example.com",
        password: userPassword,
        name: "Regular User",
        role: Role.USER,
      },
    }),
  ]);

  // Create locations
  await prisma.location.createMany({
    data: LOCATIONS,
    skipDuplicates: true,
  });

  // Create categories
  await prisma.category.createMany({
    data: CATEGORIES,
    skipDuplicates: true,
  });

  // Create features
  await prisma.feature.createMany({
    data: FEATURES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Get all created records with their IDs
  const [locations, categories, features] = await Promise.all([
    prisma.location.findMany(),
    prisma.category.findMany(),
    prisma.feature.findMany(),
  ]);

  // Associate features with categories
  await Promise.all([
    // Hotels features
    prisma.category.update({
      where: { slug: "hotels" },
      data: {
        features: {
          connect: [
            { name: "Free WiFi" },
            { name: "Swimming Pool" },
            { name: "Spa" },
            { name: "Restaurant" },
            { name: "Room Service" },
          ],
        },
      },
    }),

    // Huts features
    prisma.category.update({
      where: { slug: "huts" },
      data: {
        features: {
          connect: [
            { name: "Mountain View" },
            { name: "Parking" },
            { name: "Family Rooms" },
          ],
        },
      },
    }),

    // Houseboats features
    prisma.category.update({
      where: { slug: "houseboats" },
      data: {
        features: {
          connect: [
            { name: "Lake View" },
            { name: "Free WiFi" },
            { name: "Family Rooms" },
          ],
        },
      },
    }),

    // Restaurants features
    prisma.category.update({
      where: { slug: "restaurants" },
      data: {
        features: {
          connect: [
            { name: "Lake View" },
            { name: "Mountain View" },
            { name: "Parking" },
          ],
        },
      },
    }),
  ]);

  // Create listings for each category
  const listings = [
    // Hotels (5 listings)
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Kashmir Luxury Hotel ${i + 1}`,
      slug: `kashmir-hotel-${i + 1}`,
      description: `Premium hotel accommodation in ${
        i % 2 === 0 ? "Srinagar" : "Gulmarg"
      } with excellent amenities`,
      rating: 4.5 + i * 0.1,
      address: `${i + 101} Tourist Road`,
      city: i % 2 === 0 ? "Srinagar" : "Gulmarg",
      zip: `1900${i + 1}`,
      phone: `+91 194 245 ${1000 + i}`,
      email: `hotel${i + 1}@kashmir.com`,
      website: `https://hotel${i + 1}.kashmir.com`,
      priceRange: i < 2 ? "luxury" : i < 4 ? "premium" : "moderate",
      priceFrom: 5000 + i * 1000,
      priceTo: 10000 + i * 2000,
      categorySlug: "hotels",
      locationName: i % 2 === 0 ? "Srinagar" : "Gulmarg",
      features: [
        "Free WiFi",
        "Swimming Pool",
        "Restaurant",
        i % 2 === 0 ? "Lake View" : "Mountain View",
      ],
    })),

    // Huts (5 listings)
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Pahalgam Mountain Hut ${i + 1}`,
      slug: `pahalgam-hut-${i + 1}`,
      description: `Cozy mountain hut in Pahalgam with beautiful views`,
      rating: 4.0 + i * 0.1,
      address: `${i + 1} Valley Road`,
      city: "Pahalgam",
      zip: `1921${i + 1}`,
      phone: `+91 1986 245 ${100 + i}`,
      email: `hut${i + 1}@pahalgam.com`,
      priceRange: i < 3 ? "moderate" : "budget",
      priceFrom: 1500 + i * 500,
      priceTo: 3000 + i * 500,
      categorySlug: "huts",
      locationName: "Pahalgam",
      features: ["Mountain View", "Parking", i % 2 === 0 ? "Family Rooms" : ""],
    })),

    // Houseboats (5 listings)
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Dal Lake Houseboat ${i + 1}`,
      slug: `houseboat-${i + 1}`,
      description: `Traditional Kashmiri houseboat on Dal Lake`,
      rating: 4.7 + i * 0.05,
      address: `${i + 1} Boulevard Road`,
      city: "Srinagar",
      zip: `1900${i + 1}`,
      phone: `+91 194 245 ${2000 + i}`,
      email: `houseboat${i + 1}@dal.com`,
      website: `https://houseboat${i + 1}.dal.com`,
      priceRange: i < 2 ? "luxury" : i < 4 ? "premium" : "moderate",
      priceFrom: 7000 + i * 1000,
      priceTo: 15000 + i * 2000,
      categorySlug: "houseboats",
      locationName: "Srinagar",
      features: ["Lake View", "Free WiFi", i % 2 === 0 ? "Family Rooms" : ""],
    })),

    // Restaurants (5 listings)
    ...Array.from({ length: 5 }, (_, i) => ({
      name:
        i % 2 === 0
          ? `Kashmiri Cuisine ${i + 1}`
          : `Mountain View Cafe ${i + 1}`,
      slug: i % 2 === 0 ? `restaurant-${i + 1}` : `cafe-${i + 1}`,
      description:
        i % 2 === 0
          ? `Authentic Kashmiri Wazwan restaurant`
          : `Cafe with stunning mountain views`,
      rating: 4.2 + i * 0.1,
      address: `${i + 1} ${i % 2 === 0 ? "Residency Road" : "Ski Slope Road"}`,
      city: i % 2 === 0 ? "Srinagar" : "Gulmarg",
      zip: i % 2 === 0 ? `1900${i + 1}` : `1934${i + 1}`,
      phone: `+91 ${i % 2 === 0 ? "194" : "1982"} 245 ${3000 + i}`,
      email:
        i % 2 === 0
          ? `restaurant${i + 1}@kashmir.com`
          : `cafe${i + 1}@gulmarg.com`,
      priceRange: i < 2 ? "premium" : i < 4 ? "moderate" : "budget",
      priceFrom: 300 + i * 200,
      priceTo: 1000 + i * 300,
      categorySlug: "restaurants",
      locationName: i % 2 === 0 ? "Srinagar" : "Gulmarg",
      features: [i % 2 === 0 ? "Lake View" : "Mountain View", "Parking"],
    })),
  ];

  // Create all listings
  for (const listing of listings) {
    const category = categories.find((c) => c.slug === listing.categorySlug);
    const location = locations.find((l) => l.name === listing.locationName);
    const featureRecords = features.filter((f) =>
      listing.features.includes(f.name)
    );

    if (!category || !location) {
      console.warn(
        `Skipping listing ${listing.name} - category or location not found`
      );
      continue;
    }

    await prisma.listing.create({
      data: {
        name: listing.name,
        slug: listing.slug,
        description: listing.description,
        rating: listing.rating,
        address: listing.address,
        city: listing.city,
        zip: listing.zip,
        phone: listing.phone,
        email: listing.email,
        website: "http://localhost:5555/",
        priceRange: listing.priceRange,
        priceFrom: listing.priceFrom,
        priceTo: listing.priceTo,
        category: { connect: { id: category.id } },
        location: { connect: { id: location.id } },
        features: {
          connect: featureRecords.map((f) => ({ id: f.id })),
        },
      },
    });

    console.log(`Created listing: ${listing.name}`);
  }

  console.log("Seeding complete!");
  console.log(
    `Created ${listings.length} listings across ${categories.length} categories`
  );
}

main()
  .then(() => {
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });
