"use client";

import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

export default function CategoriesPage() {
  const { data, isLoading, error } = useApiQuery<Category[]>(
    "categories",
    "/categories"
  );
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createMutation = useApiMutation<Category, typeof newCategory>(
    "categories",
    "/categories",
    "post"
  );

  const mockData = [
    {
      id: "1",
      name: "Vehicles",
      description: "3D models of vehicles",
      productCount: 15,
    },
    {
      id: "2",
      name: "Architecture",
      description: "3D models of buildings and structures",
      productCount: 25,
    },
    {
      id: "3",
      name: "Characters",
      description: "3D character models",
      productCount: 30,
    },
    {
      id: "4",
      name: "Furniture",
      description: "3D models of furniture",
      productCount: 20,
    },
    {
      id: "5",
      name: "Nature",
      description: "3D models of natural elements",
      productCount: 18,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(newCategory);
      setNewCategory({ name: "", description: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending
                      ? "Creating..."
                      : "Create Category"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                Loading categories...
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading categories</div>
            ) : (
              <DataTable data={data || mockData} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
