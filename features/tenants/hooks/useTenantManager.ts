"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createTenantRequest, updateTenantRequest } from "@/features/tenants/services/tenant-api-service";
import type { TenantItem } from "@/features/tenants/types";

const useTenantManager = (initialTenants: TenantItem[]) => {
  const [tenants, setTenants] = useState(initialTenants);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createMutation = useMutation({ mutationFn: createTenantRequest });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateTenantRequest(id, body),
  });

  const createTenant = (data: FormData) => {
    createMutation.mutate(
      {
        name: String(data.get("name") ?? ""),
        slug: String(data.get("slug") ?? ""),
        ownerName: String(data.get("ownerName") ?? ""),
        ownerEmail: String(data.get("ownerEmail") ?? ""),
        password: String(data.get("password") ?? ""),
      },
      {
        onSuccess: (created) => {
          setTenants((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
          setIsOpen(false);
        },
      },
    );
  };

  const toggleTenant = (tenant: TenantItem) => {
    setSuccessMessage(null);
    updateMutation.reset();
    updateMutation.mutate(
      { id: tenant.id, body: { isActive: !tenant.isActive } },
      {
        onSuccess: (updated) => {
          setTenants((current) => current.map((item) => item.id === updated.id ? updated : item));
          setSuccessMessage(`${updated.name} está ${updated.isActive ? "activa" : "inactiva"}.`);
        },
      },
    );
  };

  const updateTenantDetails = (data: FormData) => {
    if (!editingTenant) return;

    setSuccessMessage(null);
    updateMutation.reset();
    updateMutation.mutate(
      {
        id: editingTenant.id,
        body: {
          name: String(data.get("name") ?? ""),
        },
      },
      {
        onSuccess: (updated) => {
          setTenants((current) => current.map((item) => item.id === updated.id ? updated : item));
          setEditingTenant(null);
          setSuccessMessage(`${updated.name} se actualizó correctamente.`);
        },
      },
    );
  };

  return {
    close: () => setIsOpen(false),
    closeEdit: () => setEditingTenant(null),
    createTenant,
    editingTenant,
    error: createMutation.error ?? updateMutation.error,
    isOpen,
    isSaving: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    successMessage,
    open: () => {
      createMutation.reset();
      setSuccessMessage(null);
      setEditingTenant(null);
      setIsOpen(true);
    },
    openEdit: (tenant: TenantItem) => {
      updateMutation.reset();
      setSuccessMessage(null);
      setEditingTenant(tenant);
    },
    tenants,
    toggleTenant,
    updateTenantDetails,
    updatingTenantId: updateMutation.isPending ? updateMutation.variables?.id : undefined,
  };
};

export default useTenantManager;
