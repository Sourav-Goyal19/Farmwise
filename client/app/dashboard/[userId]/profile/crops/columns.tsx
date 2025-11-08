"use client";

import Actions from "./actions";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

export type CropTableType = {
    id: string;
    cropName: string;
    variety?: string;
    season?: string;
    sowingDate?: string;
    expectedHarvestDate?: string;
    currentStage?: string;
    estimatedYieldKg?: string;
    plotId: string;
    createdAt: Date;
    updatedAt: Date;
};

export const columns: ColumnDef<CropTableType>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
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
        accessorKey: "cropName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Crop Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <div className="font-medium capitalize">
                {row.getValue("cropName")}
            </div>
        ),
    },
    {
        accessorKey: "variety",
        header: "Variety",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("variety") || "-"}</div>
        ),
    },
    {
        accessorKey: "season",
        header: "Season",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.getValue("season") || "-"}
            </Badge>
        ),
    },
    {
        accessorKey: "sowingDate",
        header: "Sowing Date",
        cell: ({ row }) => {
            const date = row.getValue("sowingDate") as string;
            return (
                <div>{date ? new Date(date).toLocaleDateString() : "-"}</div>
            );
        },
    },
    {
        accessorKey: "expectedHarvestDate",
        header: "Expected Harvest",
        cell: ({ row }) => {
            const date = row.getValue("expectedHarvestDate") as string;
            return (
                <div>{date ? new Date(date).toLocaleDateString() : "-"}</div>
            );
        },
    },
    {
        accessorKey: "currentStage",
        header: "Current Stage",
        cell: ({ row }) => (
            <Badge variant="secondary" className="capitalize">
                {row.getValue("currentStage") || "-"}
            </Badge>
        ),
    },
    {
        accessorKey: "estimatedYieldKg",
        header: "Estimated Yield (kg)",
        cell: ({ row }) => <div>{row.getValue("estimatedYieldKg") || "-"}</div>,
    },
    {
        id: "actions",
        cell: ({ row }) => <Actions id={row.original.id} />,
    },
];
