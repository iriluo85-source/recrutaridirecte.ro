import { prisma } from "@/lib/prisma";

// Trimite o notificare push prin Expo Push API către telefonul utilizatorului.
// Funcționează doar când utilizatorul are un token Expo salvat și notificariPush activ.
// (Tokenul se obține din aplicația nativă — vezi apiPush.inregistreaza.)

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function trimitePush(
  userId: string,
  titlu: string,
  corp: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, notificariPush: true },
    });
    if (!user?.pushToken || !user.notificariPush) return;
    if (!/^Expo(nent)?PushToken\[/.test(user.pushToken)) return; // token invalid

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: user.pushToken,
        title: titlu,
        body: corp,
        data: data ?? {},
        sound: "default",
        priority: "high",
      }),
    });
  } catch (error) {
    // push-ul nu trebuie să blocheze acțiunea care l-a generat
    console.error("[push] Trimiterea notificării push a eșuat:", error);
  }
}
