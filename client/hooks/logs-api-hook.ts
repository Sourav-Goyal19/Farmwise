import { axiosIns } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserType,
  PlotCropType,
  ConnectionDetails,
  SelectActivityLogType,
  InsertActivityLogType,
} from "@/types";

export type CreateActivityLogData = Omit<
  InsertActivityLogType,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateActivityLogData = Partial<
  Omit<
    SelectActivityLogType,
    "id" | "cropId" | "farmerId" | "createdAt" | "updatedAt"
  >
>;

export type ActivityLogWithCrop = {
  activeLog: SelectActivityLogType;
  crop: PlotCropType;
};

export type ActivityLogWithCropAndFarmer = ActivityLogWithCrop & {
  farmer: UserType;
};

export type CreateTokenData = {
  userId: string;
  cropId: string;
  roomName: string;
};

export type CreateTokenResponse = {
  data: ConnectionDetails;
  msg: string;
};

const createToken = async (
  data: CreateTokenData
): Promise<CreateTokenResponse> => {
  const res = await axiosIns.post("/api/logs/create/token", data);
  return res.data;
};

const getAllActivityLogs = async (): Promise<ActivityLogWithCrop[]> => {
  const res = await axiosIns.get("/api/logs");
  return res.data?.logs ?? [];
};

const getActivityLogsByCrop = async (
  cropId: string
): Promise<ActivityLogWithCrop[]> => {
  const res = await axiosIns.get(`/api/logs/crop/${cropId}`);
  return res.data?.logs ?? [];
};

const getActivityLogsByFarmer = async (
  farmerId: string
): Promise<ActivityLogWithCrop[]> => {
  const res = await axiosIns.get(`/api/logs/farmer/${farmerId}`);
  return res.data?.logs ?? [];
};

const getActivityLog = async (
  logId: string
): Promise<ActivityLogWithCrop | null> => {
  const res = await axiosIns.get(`/api/logs/${logId}`);
  return res.data?.log ?? null;
};

const createActivityLog = async (
  data: CreateActivityLogData
): Promise<SelectActivityLogType> => {
  const res = await axiosIns.post("/api/logs", data);
  return res.data.log;
};

const updateActivityLog = async (
  logId: string,
  data: UpdateActivityLogData
): Promise<SelectActivityLogType> => {
  const res = await axiosIns.put(`/api/logs/${logId}`, data);
  return res.data.log;
};

const deleteActivityLog = async (logId: string): Promise<void> => {
  await axiosIns.delete(`/api/logs/${logId}`);
};

export const useCreateToken = () => {
  return useMutation({
    mutationFn: createToken,
  });
};

export const useFetchAllActivityLogs = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["activityLogs"],
    queryFn: getAllActivityLogs,
    enabled,
    retry: false,
  });
};

export const useFetchActivityLogsByCrop = (
  cropId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["activityLogs", "crop", cropId],
    queryFn: () => getActivityLogsByCrop(cropId!),
    enabled: !!cropId && enabled,
    retry: false,
  });
};

export const useFetchActivityLogsByFarmer = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["activityLogs", "farmer", farmerId],
    queryFn: () => getActivityLogsByFarmer(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useFetchActivityLog = (
  logId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["activityLogs", logId],
    queryFn: () => getActivityLog(logId!),
    enabled: !!logId && enabled,
    retry: false,
  });
};

export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivityLog,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["activityLogs"],
      });

      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "crop", data.cropId],
      });

      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "farmer", data.farmerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["crops", data.cropId],
      });

      queryClient.invalidateQueries({
        queryKey: ["crops", "plot"],
      });
    },
  });
};

export const useUpdateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      logId,
      data,
    }: {
      logId: string;
      data: UpdateActivityLogData;
    }) => updateActivityLog(logId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(["activityLogs", data.id], data);

      queryClient.invalidateQueries({
        queryKey: ["activityLogs"],
      });

      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "crop", data.cropId],
      });

      queryClient.invalidateQueries({
        queryKey: ["activityLogs", "farmer", data.farmerId],
      });
    },
  });
};

export const useDeleteActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivityLog,
    onSuccess: (_, logId) => {
      queryClient.removeQueries({ queryKey: ["activityLogs", logId] });

      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
      queryClient.invalidateQueries({ queryKey: ["activityLogs", "crop"] });
      queryClient.invalidateQueries({ queryKey: ["activityLogs", "farmer"] });

      queryClient.invalidateQueries({ queryKey: ["crops"] });
    },
  });
};
