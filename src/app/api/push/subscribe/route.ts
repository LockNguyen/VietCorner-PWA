import { NextResponse } from "next/server";
import { saveSubscription } from "@/features/push/server/saveSubscription";
import { createClient } from "@/lib/supabase/server";

// POST { subscription } → this device now notifies the signed-in user (and nobody who used it before).
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { subscription } = await request.json();
  // A push endpoint is always an https address at the phone maker's push service.
  if (typeof subscription?.endpoint !== "string" || !subscription.endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "subscription with an https endpoint is required" }, { status: 400 });
  }

  try {
    await saveSubscription(user.id, subscription);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("saving a push subscription failed", error);
    return NextResponse.json({ error: "Could not save the subscription" }, { status: 500 });
  }
}
