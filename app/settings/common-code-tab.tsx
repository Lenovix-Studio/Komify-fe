"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Layers, Edit, Trash2 } from "lucide-react";
import { SimpleDataTable } from "@/components/data-table-simple";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL } from "@/lib/constant";
import { CommonCodeDetail, CommonCodeType } from "@/types/settingPage";

export function CommonCodeTab() {
  const [types, setTypes] = useState<CommonCodeType[]>([]);
  const [details, setDetails] = useState<CommonCodeDetail[]>([]);
  const [selectedType, setSelectedType] = useState<CommonCodeType | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CommonCodeType | null>(null);
  const [editingDetail, setEditingDetail] = useState<CommonCodeDetail | null>(
    null,
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    id: string;
    type: "TYPE" | "DETAIL";
  }>({ isOpen: false, id: "", type: "TYPE" });

  // Fetch Types on mount
  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/common-code/types`);
      if (res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } catch (error) {
      console.error("Error fetching types:", error);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const fetchDetails = useCallback(async (typeId: string) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/common-code/details?typeId=${typeId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((d: any) => d.type_id === typeId)
          : [];
        setDetails(filtered);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchDetails(selectedType.id);
    } else {
      setDetails([]);
    }
  }, [selectedType, fetchDetails]);

  // Handlers for Type Modal
  const openTypeModal = (type?: CommonCodeType) => {
    setEditingType(type || null);
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      code: (formData.get("code") as string).toUpperCase(),
      name: (formData.get("name") as string).toLowerCase(),
      description: (formData.get("description") as string)?.toLowerCase() || "",
    };

    try {
      if (editingType) {
        const res = await fetch(
          `${BACKEND_URL}/common-code/types/${editingType.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (res.ok) fetchTypes();
      } else {
        const res = await fetch(`${BACKEND_URL}/common-code/types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchTypes();
      }
    } catch (error) {
      console.error("Error saving type:", error);
    }

    setIsTypeModalOpen(false);
  };

  // Handlers for Detail Modal
  const openDetailModal = (detail?: CommonCodeDetail) => {
    setEditingDetail(detail || null);
    setIsDetailModalOpen(true);
  };

  const handleSaveDetail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedType) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      type_id: selectedType.id,
      code: (formData.get("code") as string).toUpperCase(),
      name: (formData.get("name") as string).toLowerCase(),
      sort_order: parseInt(formData.get("sortOrder") as string) || 1,
      is_active: formData.get("isActive") === "on",
    };

    try {
      if (editingDetail) {
        const res = await fetch(
          `${BACKEND_URL}/common-code/details/${editingDetail.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (res.ok) fetchDetails(selectedType.id);
      } else {
        const res = await fetch(`${BACKEND_URL}/common-code/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchDetails(selectedType.id);
      }
    } catch (error) {
      console.error("Error saving detail:", error);
    }

    setIsDetailModalOpen(false);
  };

  // Delete Handler
  const confirmDelete = async () => {
    try {
      if (deleteDialog.type === "TYPE") {
        const res = await fetch(
          `${BACKEND_URL}/common-code/types/${deleteDialog.id}`,
          {
            method: "DELETE",
          },
        );
        if (res.ok) {
          fetchTypes();
          if (selectedType?.id === deleteDialog.id) setSelectedType(null);
        }
      } else {
        const res = await fetch(
          `${BACKEND_URL}/common-code/details/${deleteDialog.id}`,
          {
            method: "DELETE",
          },
        );
        if (res.ok && selectedType) {
          fetchDetails(selectedType.id);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
    setDeleteDialog({ isOpen: false, id: "", type: "TYPE" });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. TYPE SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Common Code Types
              </h2>
              <p className="text-xs text-muted-foreground">
                Pilih salah satu tipe di bawah untuk melihat detail kodenya.
              </p>
            </div>
          </div>
          <Button
            onClick={() => openTypeModal()}
            className="inline-flex items-center gap-2 rounded-xl h-9 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Type</span>
          </Button>
        </div>

        <SimpleDataTable
          data={types}
          selectedId={selectedType?.id}
          onRowClick={(type) => setSelectedType(type)}
          columns={[
            { header: "Code", accessorKey: "code" },
            { header: "Name", accessorKey: "name" },
            { header: "Description", accessorKey: "description" },
            {
              header: "Created At",
              accessorKey: "created_at",
              cell: (item) =>
                new Date(item.created_at).toLocaleDateString("en-GB"),
            },
            {
              header: "Actions",
              accessorKey: "id",
              cell: (item) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTypeModal(item);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialog({
                        isOpen: true,
                        id: item.id,
                        type: "TYPE",
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 2. DETAIL SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Detail Codes{" "}
                {selectedType && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({selectedType.name})
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Daftar nilai/opsi terikat untuk tipe yang sedang dipilih.
              </p>
            </div>
          </div>
          <Button
            disabled={!selectedType}
            onClick={() => openDetailModal()}
            className="inline-flex items-center gap-2 rounded-xl h-9 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Detail Code</span>
          </Button>
        </div>

        <SimpleDataTable
          data={details}
          emptyText={
            selectedType
              ? "Belum ada detail code untuk type ini."
              : "Silakan pilih Common Code Type terlebih dahulu."
          }
          columns={[
            { header: "Detail Code", accessorKey: "code" },
            { header: "Label / Name", accessorKey: "name" },
            { header: "Sort Order", accessorKey: "sort_order" },
            {
              header: "Status",
              accessorKey: "is_active",
              cell: (item) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              header: "Actions",
              accessorKey: "id",
              cell: (item) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetailModal(item);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialog({
                        isOpen: true,
                        id: item.id,
                        type: "DETAIL",
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Type Form Modal */}
      <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Common Code Type" : "Add New Type"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                defaultValue={editingType?.code}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingType?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingType?.description || ""}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTypeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Form Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDetail ? "Edit Detail Code" : "Add Detail Code"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDetail} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="detail-code">Detail Code</Label>
              <Input
                id="detail-code"
                name="code"
                defaultValue={editingDetail?.code}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detail-name">Name / Label</Label>
              <Input
                id="detail-name"
                name="name"
                defaultValue={editingDetail?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={
                  editingDetail
                    ? editingDetail.sort_order
                    : details.length > 0
                      ? Math.max(...details.map((d) => d.sort_order)) + 1
                      : 1
                }
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={editingDetail ? editingDetail.is_active : true}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ ...deleteDialog, isOpen: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this{" "}
              {deleteDialog.type === "TYPE" ? "type" : "detail"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ ...deleteDialog, isOpen: false })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
