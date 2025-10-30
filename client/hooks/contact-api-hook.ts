import { axiosIns } from "@/lib/axios";
import { ContactType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CreateContactData = {
  farmerId: string;
  phoneNumber: string;
  aadhaarNumber?: string;
  email?: string;
  verified?: boolean;
};

export type UpdateContactData = Partial<
  Omit<ContactType, "id" | "farmerId" | "createdAt" | "updatedAt">
>;

const getContactsByFarmer = async (
  farmerId: string
): Promise<ContactType[]> => {
  const res = await axiosIns.get(`/api/farmers/contacts/farmer/${farmerId}`);
  return res.data?.contacts ?? [];
};

const getContact = async (contactId: string): Promise<ContactType | null> => {
  const res = await axiosIns.get(`/api/farmers/contacts/${contactId}`);
  return res.data?.contact ?? null;
};

const createContact = async (data: CreateContactData): Promise<ContactType> => {
  const res = await axiosIns.post("/api/farmers/contacts", data);
  return res.data.contact;
};

const updateContact = async (
  contactId: string,
  data: UpdateContactData
): Promise<ContactType> => {
  const res = await axiosIns.put(`/api/farmers/contacts/${contactId}`, data);
  return res.data.contact;
};

const deleteContact = async (contactId: string): Promise<void> => {
  await axiosIns.delete(`/api/farmers/contacts/${contactId}`);
};

const verifyContact = async (contactId: string): Promise<ContactType> => {
  const res = await axiosIns.patch(`/api/farmers/contacts/${contactId}/verify`);
  return res.data.contact;
};

export const useFetchContactsByFarmer = (
  farmerId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["contacts", "farmer", farmerId],
    queryFn: () => getContactsByFarmer(farmerId!),
    enabled: !!farmerId && enabled,
    retry: false,
  });
};

export const useFetchContact = (
  contactId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["contacts", contactId],
    queryFn: () => getContact(contactId!),
    enabled: !!contactId && enabled,
    retry: false,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["contacts", "farmer", data.farmerId],
      });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: UpdateContactData;
    }) => updateContact(contactId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(["contacts", data.id], data);

      queryClient.invalidateQueries({
        queryKey: ["contacts", "farmer", data.farmerId],
      });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: (_, contactId) => {
      queryClient.removeQueries({ queryKey: ["contacts", contactId] });

      queryClient.invalidateQueries({ queryKey: ["contacts", "farmer"] });
    },
  });
};

export const useVerifyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyContact,
    onSuccess: (data) => {
      queryClient.setQueryData(["contacts", data.id], data);

      queryClient.invalidateQueries({
        queryKey: ["contacts", "farmer", data.farmerId],
      });
    },
  });
};
