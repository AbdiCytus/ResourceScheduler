import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useProfile(user?: any) {
  const [realUsername, setRealUsername] = useState("");
  const [realNim, setRealNim] = useState("");
  const [realProdi, setRealProdi] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, nim, prodi")
        .eq("id", user.id)
        .single();

      if (data) {
        setRealUsername(data.username || user.email?.split("@")[0] || "");
        if (data.nim) setRealNim(data.nim);
        if (data.prodi) setRealProdi(data.prodi);
      } else {
        setRealUsername(user.email?.split("@")[0] || "");
      }
    };

    fetchProfile();
  }, [user, supabase]);

  return { realUsername, realNim, realProdi };
}
