"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, MapPinned, ShieldCheck, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis.").email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

type LoginValues = z.infer<typeof loginSchema>;

const PILLARS = [
  { icon: Radio, text: "Alertes en temps réel sur les seuils épidémiques" },
  { icon: ShieldCheck, text: "Contrôle qualité systématique des rapports" },
  { icon: MapPinned, text: "Synchronisation directe avec DHIS2" },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const { data } = await api.post("/auth/login/", values);
      setSession({ access: data.access, refresh: data.refresh, user: data.user });
      router.push("/dashboard");
    } catch {
      setServerError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau institutionnel — visible à partir de lg, contenu factuel plutôt que promotionnel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0F172A] p-12 text-[#F3F4F6] lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
          <svg width="100%" height="100%">
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <Logo size={36} />
          <span className="text-lg font-semibold tracking-tight">FlashReport</span>
        </div>

        <div className="relative flex flex-col gap-8">
          <p className="max-w-sm text-2xl font-medium leading-snug text-[#F3F4F6]">
            Surveillance épidémiologique nationale, du terrain jusqu&apos;au tableau de bord.
          </p>
          <ul className="flex flex-col gap-4">
            {PILLARS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-[#94A3B8]">
                <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#00B4D8]" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-[#94A3B8]">
          Ministère de la Santé — République Togolaise
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex flex-col bg-surface px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={32} />
            <span className="text-base font-semibold text-primary">FlashReport</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">Connexion</h1>
            <p className="mt-1.5 text-[15px] text-secondary">
              Accédez à votre espace de surveillance épidémiologique.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
              <Field
                label="Adresse email"
                type="email"
                autoComplete="email"
                icon={<Mail size={18} strokeWidth={1.75} />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Field
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                icon={<Lock size={18} strokeWidth={1.75} />}
                error={errors.password?.message}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-secondary hover:text-primary"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} strokeWidth={1.75} />
                    )}
                  </button>
                }
                {...register("password")}
              />

              {serverError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-3.5 py-2.5 text-sm text-severity-critical"
                >
                  <AlertCircle size={16} strokeWidth={1.75} className="shrink-0" />
                  {serverError}
                </div>
              )}

              <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
                Se connecter
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
