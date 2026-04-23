import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !restApiKey) {
    return NextResponse.json({ error: "OneSignal environment variables are missing" }, { status: 500 });
  }

  const supabase = createServerSupabaseClient();
  const { data: subscribers, error: subscribersError } = await supabase
    .from("push_subscribers")
    .select("player_id")
    .eq("user_id", user.id);

  if (subscribersError) {
    return NextResponse.json({ error: subscribersError.message }, { status: 500 });
  }

  const playerIds = Array.from(
    new Set((subscribers ?? []).map((row) => row.player_id).filter(Boolean))
  );

  if (!playerIds.length) {
    return NextResponse.json({ error: "No push subscription found for this user" }, { status: 400 });
  }

  const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${restApiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_player_ids: playerIds,
      headings: { en: "Test notification" },
      contents: { en: "This test push was sent only to your subscribed device." },
      url: "https://sltrad.vercel.app/settings",
    }),
  });

  const oneSignalPayload = (await oneSignalResponse.json().catch(() => null)) as
    | { errors?: string[]; id?: string }
    | null;

  if (!oneSignalResponse.ok) {
    const errorMessage = oneSignalPayload?.errors?.join(", ") || "Failed to send test push notification";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ success: true, notificationId: oneSignalPayload?.id ?? null });
}