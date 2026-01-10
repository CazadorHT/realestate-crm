"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Box,
  LayoutGrid,
  List,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";

import { FeatureSchema, type FeatureFormValues } from "../schema";
import {
  createFeatureAction,
  updateFeatureAction,
  deleteFeatureAction,
  type FeatureRow,
} from "../actions";
import { ICON_MAP, DEFAULT_ICON } from "../icons";

interface FeaturesClientProps {
  features: FeatureRow[];
}

const CATEGORIES = [
  "General",
  "Security",
  "Comfort",
  "Kitchen",
  "Bathroom",
  "Exterior",
  "Tech",
  "Recreation",
  "Nearby",
  "Other",
];

export function FeaturesClient({ features }: FeaturesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRow | null>(null);

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(FeatureSchema),
    defaultValues: {
      name: "",
      category: "",
      icon_key: "box",
    },
  });

  const onSubmit = async (values: FeatureFormValues) => {
    try {
      let result;
      if (editingFeature) {
        result = await updateFeatureAction(editingFeature.id, values);
      } else {
        result = await createFeatureAction(values);
      }

      if (result.success) {
        toast.success(result.message);
        setIsDialogOpen(false);
        setEditingFeature(null);
        form.reset({ name: "", category: "", icon_key: "box" });
        router.refresh();
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to save feature");
    }
  };

  const handleEdit = (feature: FeatureRow) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      category: feature.category || "",
      icon_key: feature.icon_key,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    form.reset({ name: "", category: "", icon_key: "box" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeatureAction(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message || "Failed to delete");
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.category &&
        f.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Features & Amenities
          </h1>
          <p className="text-slate-500">
            Manage property features, icons, and categories.
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search features..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[80px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-slate-500"
                >
                  No features found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFeatures.map((feature) => {
                const Icon = ICON_MAP[feature.icon_key] || DEFAULT_ICON;
                return (
                  <TableRow key={feature.id}>
                    <TableCell>
                      <div className="p-2 bg-slate-100 rounded-md w-fit text-slate-600">
                        <Icon className="w-5 h-5" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {feature.name}
                    </TableCell>
                    <TableCell>
                      {feature.category ? (
                        <Badge variant="secondary" className="font-normal">
                          {feature.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(feature)}
                          className="hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmDialog
                          title="Delete Feature"
                          description={`Are you sure you want to delete "${feature.name}"?`}
                          confirmText="Delete"
                          variant="destructive"
                          onConfirm={() => handleDelete(feature.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? "Edit Feature" : "Add New Feature"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Swimming Pool" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Category"
                            {...field}
                            value={field.value || ""}
                            list="categories"
                          />
                          <datalist id="categories">
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <div className="grid grid-cols-4 gap-2 p-2">
                            {Object.entries(ICON_MAP).map(
                              ([key, IconComponent]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="flex justify-center cursor-pointer rounded-md p-2 hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200 border border-transparent"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <IconComponent className="w-5 h-5 text-slate-600" />
                                    <span className="text-[10px] text-slate-400 truncate w-full text-center">
                                      {key}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFeature ? "Update Feature" : "Create Feature"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
