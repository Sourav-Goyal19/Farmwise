import axiosIns from "@/lib/axios";
import { UserType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getUser = async (userId: string): Promise<UserType | null> => {
  const res = await axiosIns.get(`/api/user/${userId}`);
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

type UpdateUserData = Partial<
  Omit<UserType, "id" | "createdAt" | "updatedAt" | "completed">
>;

const updateUser = async (
  userId: string,
  data: UpdateUserData
): Promise<UserType> => {
  const res = await axiosIns.put(`/api/user/${userId}`, data);
  return res.data.user;
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["user", variables.userId], data);
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
};
