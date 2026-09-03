import { NextResponse } from "next/server";
import { platiActive } from "@/lib/netopia";

// TEMPORAR — diagnostic pentru activarea Netopia. Nu expune secrete (doar booleeni).
// De șters după verificare.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    activ: platiActive(),
    hasKey: Boolean(process.env.NETOPIA_API_KEY),
    hasSig: Boolean(process.env.NETOPIA_POS_SIGNATURE),
    sandbox: process.env.NETOPIA_SANDBOX ?? null,
  });
}
