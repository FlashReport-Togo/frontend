"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserX } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { accountsApi } from "@/lib/endpoints/accounts";
import { geographyApi } from "@/lib/endpoints/geography";
import { ROLE_LABELS } from "@/store/auth-store";
import type { UserRole } from "@/types";

const schema = z
  .object({
    email: z.string().email("Email invalide."),
    first_name: z.string().min(1, "Requis."),
    last_name: z.string().min(1, "Requis."),
    role: z.enum(["district_agent", "regional_focal_point", "national_agent", "admin"]),
    district: z.string().optional(),
    region: z.string().optional(),
    password: z.string().min(10, "10 caractères minimum."),
  })
  .refine((v) => v.role !== "district_agent" || !!v.district, {
    message: "District requis pour ce rôle.",
    path: ["district"],
  })
  .refine((v) => v.role !== "regional_focal_point" || !!v.region, {
    message: "Région requise pour ce rôle.",
    path: ["region"],
  });

type FormValues = z.infer<typeof schema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => accountsApi.listUsers() });
  const { data: districts } = useQuery({ queryKey: ["districts"], queryFn: () => geographyApi.listDistricts() });
  const { data: regions } = useQuery({ queryKey: ["regions"], queryFn: () => geographyApi.listRegions() });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "district_agent" } });

  const role = watch("role");

  const onSubmit = async (values: FormValues) => {
    try {
      await accountsApi.createUser({
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        district: values.role === "district_agent" ? values.district : null,
        region: values.role === "regional_focal_point" ? values.region : null,
        password: values.password,
      });
      toast.success("Utilisateur créé.");
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      toast.error(
        axiosErr.response?.data
          ? Object.values(axiosErr.response.data).flat().join(" ")
          : "Échec de la création."
      );
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Désactiver cet utilisateur ?")) return;
    try {
      await accountsApi.deactivateUser(id);
      toast.success("Utilisateur désactivé.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch {
      toast.error("Échec de la désactivation.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Utilisateurs</h1>
          <p className="mt-1 text-sm text-secondary">Comptes et périmètres d&apos;accès.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Nouvel utilisateur
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Rôle</Th>
                <Th>Périmètre</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {users?.results.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">
                    {u.first_name} {u.last_name}
                  </Td>
                  <Td className="text-secondary">{u.email}</Td>
                  <Td>
                    <Badge>{ROLE_LABELS[u.role]}</Badge>
                  </Td>
                  <Td className="text-secondary">{u.district_name ?? u.region_name ?? "National"}</Td>
                  <Td>
                    <span className={u.is_active ? "text-severity-low" : "text-secondary"}>
                      {u.is_active ? "Actif" : "Inactif"}
                    </span>
                  </Td>
                  <Td>
                    {u.is_active && (
                      <button
                        type="button"
                        onClick={() => deactivate(u.id)}
                        className="text-secondary hover:text-severity-critical"
                        aria-label="Désactiver"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Nouvel utilisateur">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" error={errors.first_name?.message} {...register("first_name")} />
            <Field label="Nom" error={errors.last_name?.message} {...register("last_name")} />
          </div>
          <Field label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Select label="Rôle" {...register("role")}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          {role === "district_agent" && (
            <Select label="District" error={errors.district?.message} {...register("district")}>
              <option value="">Sélectionner…</option>
              {districts?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          {role === "regional_focal_point" && (
            <Select label="Région" error={errors.region?.message} {...register("region")}>
              <option value="">Sélectionner…</option>
              {regions?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
          <Field
            label="Mot de passe temporaire"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Créer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
