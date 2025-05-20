import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const SlugInputSchema = z.object({
  text: z.string().min(1),
  excludeId: z.number().optional(),
});

export async function generateSlug(
  prisma: PrismaClient,
  input: z.infer<typeof SlugInputSchema>
) {
  const { text, excludeId } = SlugInputSchema.parse(input);

  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let finalSlug = slug;
  let counter = 0;

  while (true) {
    const exists = await prisma.listing.findFirst({
      where: {
        slug: finalSlug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!exists) break;

    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return finalSlug;
}
