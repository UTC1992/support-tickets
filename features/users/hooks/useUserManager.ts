"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { UserAuthMethod, UserItem } from "@/features/users/types";
import { createAdminResourceRequest, deleteAdminResourceRequest, updateAdminResourceRequest } from "@/lib/services/admin-resource-api-service";

const useUserManager = (initialUsers: UserItem[]) => {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<UserAuthMethod>("email");

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => createAdminResourceRequest<UserItem>("profiles", body),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateAdminResourceRequest<UserItem>("profiles", id, body),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminResourceRequest("profiles", id),
  });

  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  };

  const openCreate = () => {
    setEditing(null);
    setAuthMethod("email");
    resetMutations();
    setIsOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditing(user);
    resetMutations();
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  const saveUser = (data: FormData) => {
    const body = {
      authMethod,
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
      fullName: String(data.get("fullName") ?? ""),
      role: authMethod === "phone" ? "technician" : String(data.get("role") ?? "office"),
    };

    resetMutations();
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          body: {
            fullName: body.fullName,
            role: body.role,
            ...(editing.phone ? { phone: body.phone } : {}),
          },
        },
        {
          onSuccess: (updated) => {
            setUsers((current) => current.map((user) => user.id === editing.id
              ? { ...user, ...updated, createdAt: user.createdAt }
              : user));
            closeForm();
          },
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: (created) => {
        setUsers((current) => [
          ...current,
          { ...created, createdAt: String(created.createdAt) },
        ].sort((first, second) => first.fullName.localeCompare(second.fullName)));
        closeForm();
      },
    });
  };

  const toggleActive = (user: UserItem) => {
    resetMutations();
    updateMutation.mutate(
      { id: user.id, body: { isActive: !user.isActive } },
      {
        onSuccess: (updated) => {
          setUsers((current) => current.map((item) => item.id === user.id
            ? { ...item, isActive: updated.isActive }
            : item));
        },
      },
    );
  };

  const deleteUser = (user: UserItem) => {
    resetMutations();
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        setUsers((current) => current.filter((item) => item.id !== user.id));
      },
    });
  };

  return {
    authMethod,
    closeForm,
    deleteUser,
    editing,
    error: createMutation.error ?? updateMutation.error ?? deleteMutation.error,
    isOpen,
    isSaving: createMutation.isPending || updateMutation.isPending,
    openCreate,
    openEdit,
    saveUser,
    setAuthMethod,
    toggleActive,
    users,
  };
};

export default useUserManager;
