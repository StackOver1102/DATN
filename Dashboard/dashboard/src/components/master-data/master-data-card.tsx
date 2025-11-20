"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiMutation } from "@/lib/hooks/useApi";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

interface MasterDataCardProps {
  item: MasterDataItem;
  onUpdate: () => void;
}

export function MasterDataCard({ item, onUpdate }: MasterDataCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedItem, setEditedItem] = useState({ ...item });

  const { mutate: updateMasterData, isPending: isUpdating } = useApiMutation(
    [`master-data-${item.type}`],
    `/master-data/${item._id}`,
    "patch"
  );

  const { mutate: deleteMasterData, isPending: isDeleting } = useApiMutation(
    [`master-data-${item.type}`],
    `/master-data/${item._id}`,
    "delete"
  );

  const handleUpdate = () => {
    updateMasterData(editedItem, {
      onSuccess: () => {
        toast.success("Master data item updated successfully");
        setIsEditDialogOpen(false);
        onUpdate();
      },
      onError: () => {
        toast.error("Failed to update master data item");
      },
    });
  };

  const handleDelete = () => {
    deleteMasterData(null, {
      onSuccess: () => {
        toast.success("Master data item deleted successfully");
        setIsDeleteDialogOpen(false);
        onUpdate();
      },
      onError: () => {
        toast.error("Failed to delete master data item");
      },
    });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{item.name}</CardTitle>
        <p className="text-xs text-muted-foreground">Code: {item.code}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {item.description || "No description"}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Order: {item.order}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Master Data Item</DialogTitle>
              <DialogDescription>
                Make changes to the master data item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Code
                </Label>
                <Input
                  id="edit-code"
                  value={editedItem.code}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, code: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editedItem.name}
                  onChange={(e) =>
                    setEditedItem({ ...editedItem, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editedItem.description || ""}
                  onChange={(e) =>
                    setEditedItem({
                      ...editedItem,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-order" className="text-right">
                  Order
                </Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editedItem.order}
                  onChange={(e) =>
                    setEditedItem({
                      ...editedItem,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Master Data Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this master data item? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
