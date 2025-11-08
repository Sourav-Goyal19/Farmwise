import { axiosIns } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateMatchedSchemesData,
  MatchingSchemeWithFarmerAndScheme,
  MatchingSchemeWithScheme,
} from "@/types";

const getMatchingSchemeById = async (
  id: string
): Promise<MatchingSchemeWithScheme> => {
  const res = await axiosIns.get(`/api/schemes/${id}`);
  return res.data.matchingScheme;
};

const getMatchingSchemesByFarmer = async (
  farmerId: string
): Promise<MatchingSchemeWithScheme[]> => {
  const res = await axiosIns.get(`/api/schemes/farmer/${farmerId}`);
  return res.data.matchingSchemes;
};

const getMatchingSchemesByScheme = async (
  schemeId: string
): Promise<MatchingSchemeWithFarmerAndScheme[]> => {
  const res = await axiosIns.get(`/api/schemes/scheme/${schemeId}`);
  return res.data.matchingSchemes;
};

const createMatchedSchemes = async (
  data: CreateMatchedSchemesData
): Promise<{ message: string; success: boolean }> => {
  const res = await axiosIns.post("/api/schemes/matched-schemes", data);
  return res.data;
};

export const useFetchMatchingSchemeById = (
  id?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["matchingSchemes", id],
    queryFn: () => getMatchingSchemeById(id!),
    enabled: !!id && enabled,
    retry: false,
  });
};

export const useFetchMatchingSchemesByFarmer = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["matchingSchemes", "farmer", farmerId],
    queryFn: () => getMatchingSchemesByFarmer(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useFetchMatchingSchemesByScheme = (
  schemeId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["matchingSchemes", "scheme", schemeId],
    queryFn: () => getMatchingSchemesByScheme(schemeId!),
    enabled: !!schemeId && enabled,
    retry: false,
  });
};

export const useCreateMatchedSchemes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMatchedSchemes,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["matchingSchemes", "farmer", variables.farmerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["matchingSchemes"],
      });
    },
  });
};
