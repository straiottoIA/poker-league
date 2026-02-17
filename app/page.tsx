import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/queries/seasons";

export default async function Home() {
  const supabase = await createClient();
  const activeSeason = await getActiveSeason(supabase);

  if (activeSeason) {
    redirect(`/seasons/${activeSeason.id}`);
  } else {
    redirect("/seasons");
  }
}
