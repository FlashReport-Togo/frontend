"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { accountsApi } from "@/lib/endpoints/accounts";
import { ROLE_LABELS, useAuthStore } from "@/store/auth-store";
import { getFcmToken } from "@/lib/firebase";


const schema = z
  .object({
    old_password: z.string().min(1, "Requis."),
    new_password: z.string().min(10, "10 caractères minimum."),
    confirm_password: z.string().min(1, "Requis."),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [pushStatus, setPushStatus] = useState<"idle" | "granted" | "denied">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await accountsApi.changePassword({ old_password: values.old_password, new_password: values.new_password });
      toast.success("Mot de passe modifié.");
      reset();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail ?? "Échec du changement de mot de passe.");
    }
  };

  /*const enablePush = async () => {
    if (!("Notification" in window)) {
      toast.error("Ce navigateur ne supporte pas les notifications push.");
      return;
    }
    const permission = await Notification.requestPermission();
    setPushStatus(permission === "granted" ? "granted" : "denied");
    if (permission === "granted") {
      // NOTE : la récupération du token FCM nécessite le SDK Firebase Web (config du
      // projet + clé VAPID côté client, non fournis à ce stade). Une fois ces éléments
      // disponibles, appeler accountsApi.setFcmToken(token) ici.
      toast.info("Autorisation accordée. Intégration du SDK Firebase Web à finaliser côté client.");
    }
  };*/

  const enablePush = async () => {
    if (!("Notification" in window)) {
      toast.error("Ce navigateur ne supporte pas les notifications push.");
      return;
    }

    const permission = await Notification.requestPermission();
    setPushStatus(permission === "granted" ? "granted" : "denied");

    if (permission === "granted") {
      try {
        const token = await getFcmToken();
        
        if (token) {
          await accountsApi.setFcmToken(token);
          toast.success("Notifications push activées avec succès !");
        } else {
          toast.error("Impossible de récupérer le token de notification.");
        }
      } catch (error){
        toast.error("Erreur lors de la configuration des notifications.");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Paramètres</h1>
        <p className="mt-1 text-sm text-secondary">Profil, sécurité et notifications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Nom</p>
            <p className="mt-1 text-sm text-primary">
              {user.first_name} {user.last_name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Email</p>
            <p className="mt-1 text-sm text-primary">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Rôle</p>
            <p className="mt-1 text-sm text-primary">{ROLE_LABELS[user.role]}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">Périmètre</p>
            <p className="mt-1 text-sm text-primary">{user.district_name ?? user.region_name ?? "National"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field
              label="Mot de passe actuel"
              type="password"
              error={errors.old_password?.message}
              {...register("old_password")}
            />
            <Field
              label="Nouveau mot de passe"
              type="password"
              error={errors.new_password?.message}
              {...register("new_password")}
            />
            <Field
              label="Confirmer le nouveau mot de passe"
              type="password"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={isSubmitting}>
                <Save size={16} /> Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications push</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-secondary">Recevez les alertes critiques même hors de l&apos;application.</p>
          <Button variant="secondary" onClick={enablePush} disabled={pushStatus === "granted"}>
            <Bell size={16} /> {pushStatus === "granted" ? "Activées" : "Activer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
