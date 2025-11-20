"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApiQuery } from "@/lib/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { MasterDataCard } from "./master-data-card";
import { MasterDataForm } from "./master-data-form";

interface MasterDataItem {
  _id: string;
  type: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  metadata?: Record<string, unknown>;
}

interface MasterDataListProps {
  type: string;
  title: string;
  description?: string;
}

export function MasterDataList({
  type,
  title,
  description,
}: MasterDataListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: masterData, isLoading } = useApiQuery<MasterDataItem[]>(
    `master-data-${type}`,
    `/master-data?type=${type}`
  );

  const queryClient = useQueryClient();

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: [`master-data-${type}`] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {title}</DialogTitle>
              <DialogDescription>
                Create a new {title.toLowerCase()} item.
              </DialogDescription>
            </DialogHeader>
            <MasterDataForm
              type={type}
              onSuccess={handleSuccess}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masterData && masterData.length > 0 ? (
              masterData.map((item) => (
                <MasterDataCard
                  key={item._id}
                  item={item}
                  onUpdate={() =>
                    queryClient.invalidateQueries({
                      queryKey: [`master-data-${type}`],
                    })
                  }
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No {title.toLowerCase()} found. Add some items to get started.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
