import axiosIns from "@/lib/axios";
import { PlotCropType, PlotType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CreatePlotCropData = {
  plotId: string;
  cropName: string;
  variety?: string;
  season?: string;
  sowingDate?: string;
  expectedHarvestDate?: string;
  currentStage?: string;
  estimatedYieldKg?: string;
};

export type UpdatePlotCropData = Partial<
  Omit<PlotCropType, "id" | "plotId" | "createdAt" | "updatedAt">
>;

const getCropsByPlot = async (plotId: string): Promise<PlotCropType[]> => {
  const res = await axiosIns.get(`/api/crops/plot/${plotId}`);
  return res.data?.crops ?? [];
};

const getCrop = async (cropId: string): Promise<PlotCropType | null> => {
  const res = await axiosIns.get(`/api/crops/${cropId}`);
  return res.data?.crop ?? null;
};

const getCropsByFarmer = async (
  farmerId: string
): Promise<
  Array<{
    crop: PlotCropType;
    plot: PlotType;
  }>
> => {
  const res = await axiosIns.get(`/api/crops/farmer/${farmerId}`);
  return res.data?.crops ?? [];
};

const createCrop = async (data: CreatePlotCropData): Promise<PlotCropType> => {
  const res = await axiosIns.post("/api/crops", data);
  return res.data.crop;
};

const updateCrop = async (
  cropId: string,
  data: UpdatePlotCropData
): Promise<PlotCropType> => {
  const res = await axiosIns.put(`/api/crops/${cropId}`, data);
  return res.data.crop;
};

const deleteCrop = async (cropId: string): Promise<void> => {
  await axiosIns.delete(`/api/crops/${cropId}`);
};

export const useFetchCropsByPlot = (
  plotId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["crops", "plot", plotId],
    queryFn: () => getCropsByPlot(plotId!),
    enabled: !!plotId && enabled,
    retry: false,
  });
};

export const useFetchCrop = (cropId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["crops", cropId],
    queryFn: () => getCrop(cropId!),
    enabled: !!cropId && enabled,
    retry: false,
  });
};

export const useFetchCropsByFarmer = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["crops", "farmer", farmerId],
    queryFn: () => getCropsByFarmer(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useCreateCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCrop,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["crops", "plot", data.plotId],
      });

      queryClient.invalidateQueries({
        queryKey: ["crops", "farmer"],
      });

      queryClient.invalidateQueries({
        queryKey: ["plots", data.plotId],
      });

      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", "with-crops"],
      });
    },
  });
};

export const useUpdateCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cropId,
      data,
    }: {
      cropId: string;
      data: UpdatePlotCropData;
    }) => updateCrop(cropId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(["crops", data.id], data);

      queryClient.invalidateQueries({
        queryKey: ["crops", "plot", data.plotId],
      });

      queryClient.invalidateQueries({
        queryKey: ["crops", "farmer"],
      });

      queryClient.invalidateQueries({
        queryKey: ["plots", data.plotId],
      });
    },
  });
};

export const useDeleteCrop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCrop,
    onSuccess: (_, cropId) => {
      queryClient.removeQueries({ queryKey: ["crops", cropId] });

      queryClient.invalidateQueries({ queryKey: ["crops", "plot"] });

      queryClient.invalidateQueries({ queryKey: ["crops", "farmer"] });

      queryClient.invalidateQueries({
        queryKey: ["plots", "farmer", "with-crops"],
      });
    },
  });
};
