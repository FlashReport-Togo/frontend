"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { formTemplatesApi, geographyApi } from "@/lib/endpoints/geography";
import { reportsApi } from "@/lib/endpoints/reports";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  disease: z.string().min(1, "Choisissez une maladie."),
  period_type: z.enum(["journalier", "hebdomadaire"]),
  period_start: z.string().min(1, "Date de début requise."),
  period_end: z.string().min(1, "Date de fin requise."),
});

type FormValues = z.infer<typeof schema>;

export default function NewReportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().slice(0, 10);

  const { data: diseases, isLoading: loadingDiseases } = useQuery({
    queryKey: ["diseases", "active"],
    queryFn: () => geographyApi.listDiseases({ is_active: true }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { period_type: "journalier", period_start: today, period_end: today },
  });

  const diseaseId = watch("disease");
  const periodType = watch("period_type");
  const periodStart = watch("period_start");

  useEffect(() => {
    if (periodType === "journalier") setValue("period_end", periodStart);
  }, [periodType, periodStart, setValue]);

  const { data: template } = useQuery({
    queryKey: ["form-templates", diseaseId],
    queryFn: () => formTemplatesApi.getByDisease(diseaseId),
    enabled: !!diseaseId,
  });

  const onSubmit = async (values: FormValues) => {
    if (!user?.district) {
      toast.error("Aucun district associé à votre compte.");
      return;
    }
    try {
      const report = await reportsApi.create({
        district: user.district,
        disease: values.disease,
        period_type: values.period_type,
        period_start: values.period_start,
        period_end: values.period_end,
      });
      toast.success("Rapport créé en brouillon.");
      router.push(`/reports/${report.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail ?? "Impossible de créer le rapport.");
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Nouveau rapport</h1>
        <p className="mt-1 text-sm text-secondary">Choisissez la maladie et la période — la grille de saisie s&apos;ouvrira ensuite.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Rapport</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select label="Maladie / type de rapport" error={errors.disease?.message} disabled={loadingDiseases} {...register("disease")}>
              <option value="">Sélectionner…</option>
              {diseases?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            {diseaseId && !template && (
              <div className="flex items-center gap-2 rounded-lg border border-severity-medium/30 bg-severity-medium/10 px-3.5 py-2.5 text-sm text-severity-medium">
                <AlertCircle size={16} className="shrink-0" />
                Aucun formulaire configuré pour cette maladie. Contactez un administrateur.
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Select label="Périodicité" {...register("period_type")}>
                <option value="journalier">Journalier</option>
                <option value="hebdomadaire">Hebdomadaire</option>
              </Select>
              <Field label="Début" type="date" error={errors.period_start?.message} {...register("period_start")} />
              <Field
                label="Fin"
                type="date"
                disabled={periodType === "journalier"}
                error={errors.period_end?.message}
                {...register("period_end")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!!diseaseId && !template}>
            Créer le rapport
          </Button>
        </div>
      </form>
    </div>
  );
}
