"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    onClick: () => void;
  }[];
  rowSelection?: Record<string, boolean>;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  bulkActions,
  rowSelection,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Bulk action buttons */}
        {rowSelection && Object.keys(rowSelection).length > 0 && bulkActions && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-muted-foreground">
              {Object.keys(rowSelection).length} đã chọn
            </span>
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className="h-8"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      
        {searchKey && (
          <div className="flex items-center border rounded-md px-3 w-72">
            <IconSearch className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
            />
          </div>
        )}

        {filters?.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Xóa bộ lọc
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
