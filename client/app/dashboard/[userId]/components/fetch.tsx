"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserStore } from "@/zustand/store";
import { useFetchUser } from "@/hooks/user-api-hook";

export const Fetch = () => {
  const { setUser } = useUserStore();
  const { user, isLoaded } = useUser();
  const { data } = useFetchUser(user?.id, isLoaded);

  useEffect(() => {
    if (!data) return;
    setUser(data);
  }, [data]);

  return null;
};
