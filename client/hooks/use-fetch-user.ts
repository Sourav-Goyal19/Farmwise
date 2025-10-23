import axiosIns from "@/lib/axios";
import { UserType } from "@/types";
import { useQuery } from "@tanstack/react-query";

const getUser = async (userId: string): Promise<UserType | null> => {
  const res = await axiosIns.get(`/api/user?userId=${userId}`);
  return res.data?.user ?? null;
};

export const useFetchUser = (userId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId && enabled,
    retry: false,
  });
};
