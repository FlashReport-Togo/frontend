"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { geographyApi } from "@/lib/endpoints/geography";
import { reportsApi } from "@/lib/endpoints/reports";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  period_type: z.enum(["journalier", "hebdomadaire"]),
  period_start: z.string().min(1, "Date de début requise."),
  period_end: z.string().min(1, "Date de fin requise."),
  data_values: z.array(
    z.object({
      disease: z.string(),
      disease_name: z.string(),
      cases: z.number().min(0),
      deaths: z.number().min(0),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

export default function NewReportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: diseases, isLoading: loadingDiseases } = useQuery({
    queryKey: ["diseases", "active"],
    queryFn: () => geographyApi.listDiseases({ is_active: true }),
  });

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { period_type: "journalier", period_start: today, period_end: today, data_values: [] },
  });

  const { fields, replace } = useFieldArray({ control, name: "data_values" });
  const periodType = watch("period_type");
  const periodStart = watch("period_start");

  useEffect(() => {
    if (diseases && fields.length === 0) {
      replace(diseases.map((d) => ({ disease: d.id, disease_name: d.name, cases: 0, deaths: 0 })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseases]);

  useEffect(() => {
    if (periodType === "journalier") setValue("period_end", periodStart);
  }, [periodType, periodStart, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!user?.district) {
      toast.error("Aucun district associé à votre compte.");
      return;
    }
    try {
      const report = await reportsApi.create({
        district: user.district,
        period_type: values.period_type,
        period_start: values.period_start,
        period_end: values.period_end,
        data_values: values.data_values.map((dv) => ({
          disease: dv.disease,
          cases: dv.cases,
          deaths: dv.deaths,
        })),
      });
      toast.success("Rapport créé en brouillon.");
      router.push(`/reports/${report.id}`);
    } catch {
      toast.error("Impossible de créer le rapport (un rapport existe peut-être déjà pour cette période).");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Nouveau rapport</h1>
        <p className="mt-1 text-sm text-secondary">Saisie manuelle des cas et décès par maladie.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Période</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Select label="Type de période" {...register("period_type")}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cas et décès par maladie</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDiseases ? (
              <p className="p-5 text-sm text-secondary">Chargement du référentiel des maladies…</p>
            ) : (
              <div className="divide-y divide-border-subtle">
                <div className="grid grid-cols-[1fr_100px_100px] gap-3 px-5 py-3 text-xs font-medium uppercase tracking-wide text-secondary">
                  <span>Maladie</span>
                  <span>Cas</span>
                  <span>Décès</span>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_100px_100px] items-center gap-3 px-5 py-2.5">
                    <span className="text-sm text-primary">{field.disease_name}</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-sm font-mono text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                      {...register(`data_values.${index}.cases`, { valueAsNumber: true })}
                    />
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-sm font-mono text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                      {...register(`data_values.${index}.deaths`, { valueAsNumber: true })}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 rounded-lg border border-accent-blue/25 bg-accent-blue/5 px-4 py-3 text-sm text-secondary">
          <AlertCircle size={16} className="shrink-0 text-accent-blue" />
          Le rapport sera créé en brouillon. Vous pourrez le corriger et le soumettre depuis sa fiche détaillée.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Créer le rapport
          </Button>
        </div>
      </form>
    </div>
  );
}
