import { prisma } from "@/lib/prisma";
import type { NotificationTip } from "@/generated/prisma/client";
import { trimitePush } from "@/lib/push";

export async function createNotification(params: {
  userId: string;
  tip: NotificationTip;
  titlu: string;
  continut?: string | null;
  link: string;
  entityId?: string | null;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        tip: params.tip,
        titlu: params.titlu,
        continut: params.continut ?? null,
        link: params.link,
        entityId: params.entityId ?? null,
      },
    });
  } catch (error) {
    // notificarea in-site nu trebuie să blocheze acțiunea care a generat-o
    console.error("[notificare] Crearea notificării a eșuat:", error);
  }

  // notificare push pe telefon (dacă utilizatorul are aplicația + push activ)
  await trimitePush(params.userId, params.titlu, params.continut ?? "", {
    link: params.link,
    entityId: params.entityId ?? null,
    tip: params.tip,
  });
}
