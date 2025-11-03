import { axiosIns } from "@/lib/axios";
import { PlotCropType, PlotType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
const handleAxiosError = (error: any, fallback = "Something went wrong") => {
    const message =
        error?.response?.data?.message || error?.message || fallback;
    toast.error(message);
};

const getCropsByPlot = async (plotId: string): Promise<PlotCropType[]> => {
    try {
        const res = await axiosIns.get(`/api/farmers/crops/plot/${plotId}`);
        return res.data?.crops ?? [];
    } catch (error) {
        handleAxiosError(error, "Failed to fetch crops for this plot");
        return [];
    }
};

const getCrop = async (cropId: string): Promise<PlotCropType | null> => {
    try {
        const res = await axiosIns.get(`/api/farmers/crops/${cropId}`);
        return res.data?.crop ?? null;
    } catch (error) {
        handleAxiosError(error, "Failed to fetch crop details");
        return null;
    }
};

const getCropsByFarmer = async (
    farmerId: string,
): Promise<
    Array<{
        crop: PlotCropType;
        plot: PlotType;
    }>
> => {
    try {
        const res = await axiosIns.get(`/api/farmers/crops/farmer/${farmerId}`);
        return res.data?.crops ?? [];
    } catch (error) {
        handleAxiosError(error, "Failed to fetch crops for farmer");
        return [];
    }
};

const createCrop = async (data: CreatePlotCropData): Promise<PlotCropType> => {
    const res = await axiosIns.post("/api/farmers/crops", data);
    return res.data?.crop ?? res.data;
};

const updateCrop = async (
    cropId: string,
    data: UpdatePlotCropData,
): Promise<PlotCropType> => {
    const res = await axiosIns.put(`/api/farmers/crops/${cropId}`, data);
    return res.data?.crop ?? res.data;
};

const deleteCrop = async (cropId: string): Promise<{ message: string }> => {
    const res = await axiosIns.delete(`/api/farmers/crops/${cropId}`);
    return res.data;
};

export const useFetchCropsByPlot = (plotId?: string, enabled = true) => {
    return useQuery({
        queryKey: ["crops", "plot", plotId],
        queryFn: () => getCropsByPlot(plotId!),
        enabled: !!plotId && enabled,
        retry: false,
    });
};

export const useFetchCrop = (cropId?: string, enabled = true) => {
    return useQuery({
        queryKey: ["crops", cropId],
        queryFn: () => getCrop(cropId!),
        enabled: !!cropId && enabled,
        retry: false,
    });
};

export const useFetchCropsByFarmer = (farmerId?: string, enabled = true) => {
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
            toast.success("Crop created successfully!");

            queryClient.invalidateQueries({
                queryKey: ["crops", "plot", data.plotId],
            });
            queryClient.invalidateQueries({ queryKey: ["crops", "farmer"] });
            queryClient.invalidateQueries({ queryKey: ["plots", data.plotId] });
            queryClient.invalidateQueries({
                queryKey: ["plots", "farmer", "with-crops"],
            });
        },
        onError: (error) => {
            handleAxiosError(error, "Failed to create crop");
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
            toast.success("Crop updated successfully!");

            queryClient.setQueryData(["crops", data.id], data);
            queryClient.invalidateQueries({
                queryKey: ["crops", "plot", data.plotId],
            });
            queryClient.invalidateQueries({ queryKey: ["crops", "farmer"] });
            queryClient.invalidateQueries({ queryKey: ["plots", data.plotId] });
        },
        onError: (error) => {
            handleAxiosError(error, "Failed to update crop");
        },
    });
};

export const useDeleteCrop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCrop,
        onSuccess: (data, cropId) => {
            toast.success(data?.message || "Crop deleted successfully!");

            queryClient.removeQueries({ queryKey: ["crops", cropId] });
            queryClient.invalidateQueries({ queryKey: ["crops", "plot"] });
            queryClient.invalidateQueries({ queryKey: ["crops", "farmer"] });
            queryClient.invalidateQueries({
                queryKey: ["plots", "farmer", "with-crops"],
            });
        },
        onError: (error) => {
            handleAxiosError(error, "Failed to delete crop");
        },
    });
};
