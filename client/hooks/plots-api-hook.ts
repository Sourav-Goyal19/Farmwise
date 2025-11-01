import { axiosIns } from "@/lib/axios";
import { PlotType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CreatePlotData = {
  farmerId: string;
  plotName?: string;
  area: string;
  soilType?: "clay" | "loamy" | "sandy" | "laterite" | "black";
  irrigationType?: "drip" | "canal" | "rain-fed" | "sprinkler";
  waterSource?: string;
  latitude?: string;
  longitude?: string;
  isOwned?: boolean;
  ownershipProofUrl?: string;
};

export type UpdatePlotData = Partial<
  Omit<PlotType, "id" | "farmerId" | "createdAt" | "updatedAt" | "crops">
>;

const getPlotsByFarmer = async (farmerId: string): Promise<PlotType[]> => {
  const res = await axiosIns.get(`/api/farmers/plots/farmer/${farmerId}`);
  return res.data?.plots ?? [];
};

const getPlot = async (plotId: string): Promise<PlotType | null> => {
  const res = await axiosIns.get(`/api/farmers/plots/${plotId}`);
  return res.data?.plot ?? null;
};

const getPlotsWithCrops = async (farmerId: string): Promise<PlotType[]> => {
  const res = await axiosIns.get(
    `/api/farmers/plots/farmer/${farmerId}/with-crops`
  );
  return res.data?.plots ?? [];
};

const createPlot = async (data: CreatePlotData): Promise<PlotType> => {
  const res = await axiosIns.post("/api/farmers/plots", data);
  return res.data.plot;
};

const updatePlot = async (
  plotId: string,
  data: UpdatePlotData
): Promise<PlotType> => {
  const res = await axiosIns.put(`/api/farmers/plots/${plotId}`, data);
  return res.data.plot;
};

const deletePlot = async (plotId: string): Promise<void> => {
  await axiosIns.delete(`/api/farmers/plots/${plotId}`);
};

export const useFetchPlotsByFarmer = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["plots", "farmer", farmerId],
    queryFn: () => getPlotsByFarmer(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useFetchPlot = (plotId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["plots", plotId],
    queryFn: () => getPlot(plotId!),
    enabled: !!plotId && enabled,
    retry: false,
  });
};

export const useFetchPlotsWithCrops = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["plots", "farmer", farmerId, "with-crops"],
    queryFn: () => getPlotsWithCrops(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useCreatePlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", data.farmerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", data.farmerId, "with-crops"],
      });
    },
  });
};

export const useUpdatePlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plotId, data }: { plotId: string; data: UpdatePlotData }) =>
      updatePlot(plotId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(["plots", data.id], data);

      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", data.farmerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", data.farmerId, "with-crops"],
      });
    },
  });
};

export const useDeletePlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlot,
    onSuccess: (_, plotId) => {
      queryClient.removeQueries({ queryKey: ["plots", plotId] });

      queryClient.invalidateQueries({ queryKey: ["plots", "farmer"] });
      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", "with-crops"],
      });
    },
  });
};
