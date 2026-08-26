import { prisma } from "@/lib/prisma";

// Există un blocaj între cei doi utilizatori (în oricare direcție)?
export async function existaBlocaj(userA: string, userB: string): Promise<boolean> {
  const b = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(b);
}

// Utilizatorul curent l-a blocat pe target?
export async function amBlocat(blockerId: string, blockedId: string): Promise<boolean> {
  const b = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { id: true },
  });
  return Boolean(b);
}
