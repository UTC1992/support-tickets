"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { CatalogItem, CatalogResource, CatalogSecondaryField } from "@/features/catalogs/types";
import { createAdminResourceRequest, deleteAdminResourceRequest, updateAdminResourceRequest } from "@/lib/services/admin-resource-api-service";

type UseCatalogManagerOptions = {
  initialItems: CatalogItem[];
  resource: CatalogResource;
  secondaryField?: CatalogSecondaryField;
};

type CatalogResponse = Omit<CatalogItem, "ticketCount"> & {
  _count?: { tickets: number };
};

const useCatalogManager = ({ initialItems, resource, secondaryField }: UseCatalogManagerOptions) => {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => createAdminResourceRequest<CatalogResponse>(resource, body),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateAdminResourceRequest<CatalogResponse>(resource, id, body),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminResourceRequest(resource, id),
  });

  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  };

  const openCreate = () => {
    setEditing(null);
    resetMutations();
    setIsOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    resetMutations();
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  const saveItem = (formData: FormData) => {
    const body: Record<string, unknown> = {
      name: String(formData.get("name") ?? ""),
    };
    if (secondaryField) {
      body[secondaryField] = String(formData.get(secondaryField) ?? "");
    }

    resetMutations();
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, body },
        {
          onSuccess: (updated) => {
            setItems((current) => current.map((item) => item.id === editing.id
              ? { ...item, ...updated, ticketCount: updated._count?.tickets ?? item.ticketCount }
              : item));
            closeForm();
          },
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: (created) => {
        setItems((current) => [
          ...current,
          { ...created, ticketCount: created._count?.tickets ?? 0 },
        ].sort((first, second) => first.name.localeCompare(second.name)));
        closeForm();
      },
    });
  };

  const toggleActive = (item: CatalogItem) => {
    resetMutations();
    updateMutation.mutate(
      { id: item.id, body: { isActive: !item.isActive } },
      {
        onSuccess: (updated) => {
          setItems((current) => current.map((currentItem) => currentItem.id === item.id
            ? { ...currentItem, isActive: updated.isActive }
            : currentItem));
        },
      },
    );
  };

  const deleteItem = (item: CatalogItem) => {
    resetMutations();
    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      },
    });
  };

  return {
    closeForm,
    deleteItem,
    editing,
    error: createMutation.error ?? updateMutation.error ?? deleteMutation.error,
    isOpen,
    isSaving: createMutation.isPending || updateMutation.isPending,
    items,
    openCreate,
    openEdit,
    saveItem,
    toggleActive,
  };
};

export default useCatalogManager;
