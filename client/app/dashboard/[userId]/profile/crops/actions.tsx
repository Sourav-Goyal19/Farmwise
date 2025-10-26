"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenCrop } from "@/hooks/use-crop-store";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useDeleteCrop } from "@/hooks/plot-crops-api-hook";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ActionsProps {
  id: string;
}

const Actions: React.FC<ActionsProps> = ({ id }) => {
  const { onOpen } = useOpenCrop();
  const deleteMutation = useDeleteCrop();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this crop record"
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DropdownMenu>
      <ConfirmDialog />
      <DropdownMenuTrigger asChild>
        <Button className="size-8 p-0" variant={"ghost"}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            onOpen(id);
          }}
        >
          <Edit className="mr-2 size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
