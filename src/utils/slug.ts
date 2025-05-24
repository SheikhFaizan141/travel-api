import { PrismaClient } from "@prisma/client";

interface SlugInput {
  text: string;
  slug?: string;
  excludeId?: number; // for updates, exclude current listing
}

export async function generateSlug(
  prisma: PrismaClient,
  input: SlugInput
): Promise<{ slug: string; error?: string }> {
  
  // If custom slug provided, check if it's taken
  if (input.slug) {
    const exists = await prisma.listing.findFirst({
      where: {
        slug: input.slug,
        ...(input.excludeId && { id: { not: input.excludeId } }),
      },
    });

    if (exists) {
      return {
        slug: input.slug,
        error: "This slug is already taken",
      };
    }

    return { slug: input.slug };
  }

  // Generate slug from text/title
  let slug = input.text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Clean up multiple hyphens

  // Check uniqueness and append number if needed
  let finalSlug = slug;
  let counter = 0;

  while (true) {
    const exists = await prisma.listing.findFirst({
      where: {
        slug: finalSlug,
        ...(input.excludeId && { id: { not: input.excludeId } }),
      },
    });

    if (!exists) break;

    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return { slug: finalSlug };
}
