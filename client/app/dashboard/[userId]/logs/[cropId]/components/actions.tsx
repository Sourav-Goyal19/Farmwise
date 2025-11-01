"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenLog } from "@/hooks/use-log-store";
import { useDeleteActivityLog } from "@/hooks/logs-api-hook";
import { Edit, MoreHorizontal, Trash, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ActionsProps {
  id: string;
}

export const Actions: React.FC<ActionsProps> = ({ id }) => {
  const { onOpen } = useOpenLog();
  const deleteMutation = useDeleteActivityLog();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this activity log"
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
          <Eye className="mr-2 size-4" />
          View Details
        </DropdownMenuItem>
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
