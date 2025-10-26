"use client";

import Actions from "./actions";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

export type PlotTableType = {
  id: string;
  plotName: string;
  area: string;
  soilType: string;
  irrigationType: string;
  waterSource: string;
  isOwned: boolean;
  createdAt: string;
};

export const columns: ColumnDef<PlotTableType>[] = [
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
    accessorKey: "plotName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plot Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium capitalize">{row.getValue("plotName")}</div>
    ),
  },
  {
    accessorKey: "area",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Area (acres)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("area")}</div>,
  },
  {
    accessorKey: "soilType",
    header: "Soil Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("soilType")}
      </Badge>
    ),
  },
  {
    accessorKey: "irrigationType",
    header: "Irrigation",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("irrigationType")}</div>
    ),
  },
  {
    accessorKey: "waterSource",
    header: "Water Source",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("waterSource")}</div>
    ),
  },
  {
    accessorKey: "isOwned",
    header: "Ownership",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isOwned") ? "default" : "secondary"}>
        {row.getValue("isOwned") ? "Owned" : "Rented"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
