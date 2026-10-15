"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { ManagedUserRole, UserAuthMethod, UserItem } from "@/features/users/types";
import {
  createAdminResourceRequest,
  deleteAdminResourceRequest,
  resetUserPasswordRequest,
  updateAdminResourceRequest,
} from "@/lib/services/admin-resource-api-service";

const useUserManager = (initialUsers: UserItem[], managedRole: ManagedUserRole) => {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const defaultAuthMethod: UserAuthMethod = managedRole === "admin" ? "email" : "phone";
  const [authMethod, setAuthMethod] = useState<UserAuthMethod>(defaultAuthMethod);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPasswordRequest(id, password),
  });

  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    passwordMutation.reset();
  };

  const openCreate = () => {
    setEditing(null);
    setAuthMethod(defaultAuthMethod);
    setSuccessMessage(null);
    resetMutations();
    setIsOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setSuccessMessage(null);
    resetMutations();
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  const openPasswordReset = (user: UserItem) => {
    setPasswordUser(user);
    setSuccessMessage(null);
    resetMutations();
  };

  const closePasswordReset = () => setPasswordUser(null);

  const resetPassword = (data: FormData) => {
    if (!passwordUser) return;

    passwordMutation.mutate(
      {
        id: passwordUser.id,
        password: String(data.get("password") ?? ""),
      },
      {
        onSuccess: () => {
          closePasswordReset();
          setSuccessMessage("Contraseña restablecida correctamente.");
        },
      },
    );
  };

  const saveUser = (data: FormData) => {
    const body = {
      authMethod,
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      password: String(data.get("password") ?? ""),
      fullName: String(data.get("fullName") ?? ""),
      role: managedRole,
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
    closePasswordReset,
    deleteUser,
    editing,
    error: createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? passwordMutation.error,
    isOpen,
    isSaving: createMutation.isPending || updateMutation.isPending || passwordMutation.isPending,
    openCreate,
    openEdit,
    openPasswordReset,
    passwordUser,
    resetPassword,
    saveUser,
    setAuthMethod,
    successMessage,
    toggleActive,
    users,
  };
};

export default useUserManager;
