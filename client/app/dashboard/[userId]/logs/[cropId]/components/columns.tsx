"use client";

import { format } from "date-fns";
import { Actions } from "./actions";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export type LogTableType = {
  id: string;
  cropName: string;
  activityType: string;
  summary: string;
  details: string[];
  createdAt: string;
  suggestions?: string[];
};

export const logsColumns: ColumnDef<LogTableType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div>{format(date, "dd MMM, yyyy")}</div>;
    },
  },
  {
    accessorKey: "cropName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Crop
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium capitalize">{row.getValue("cropName")}</div>
    ),
  },
  {
    accessorKey: "activityType",
    header: "Activity Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("activityType")}
      </Badge>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("summary")}>
        {row.getValue("summary")}
      </div>
    ),
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      const details = row.getValue("details") as string[];
      return (
        <div className="max-w-[150px]">
          {details.length > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {details.length} items
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No details</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
