"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth-store";

type WsPayload =
  | { type: "alert"; alert_id: string; notification_id: string; alert_type: string; severity: string; message: string }
  | { type: "alert_summary"; alert_id: string }
  | { type: "ocr_scan_ready"; scan_id: string; report_id: string | null; status: string }
  | { type: "ai_analysis_ready"; report_id: string; result: unknown }
  | { type: "export_ready"; export_id: string; status: string; file_url: string | null };

const SEVERITY_TOAST: Record<string, (msg: string) => void> = {
  critique: (msg) => toast.error(msg),
  moyenne: (msg) => toast.warning(msg),
  faible: (msg) => toast.info(msg),
};

// Le résultat d'une analyse IA n'est plus transmis QUE par WebSocket (il est persisté
// en base côté backend, cf. AIRequestLog.result) : si le socket coupe avant réception,
// invalider l'historique suffit à le récupérer au prochain fetch — rien n'est perdu.

export function useRealtimeNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByEffect = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    closedByEffect.current = false;

    const connect = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
      const socket = new WebSocket(`${wsUrl}/notifications/?token=${accessToken}`);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempt.current = 0;
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as WsPayload;

        switch (payload.type) {
          case "alert": {
            const notify = SEVERITY_TOAST[payload.severity] ?? toast.info;
            notify(payload.message);
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            break;
          }
          case "alert_summary":
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            break;
          case "ocr_scan_ready":
            toast.success("Scan OCR traité — rapport brouillon prêt pour relecture.");
            queryClient.invalidateQueries({ queryKey: ["ocr-scans"] });
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            break;
          case "ai_analysis_ready":
            toast.success("Analyse IA terminée.");
            queryClient.invalidateQueries({ queryKey: ["ai-analysis-history", payload.report_id] });
            queryClient.invalidateQueries({ queryKey: ["reports", payload.report_id] });
            break;
          case "export_ready":
            if (payload.status === "prêt") {
              toast.success("Export prêt au téléchargement.", {
                action: payload.file_url
                  ? { label: "Ouvrir", onClick: () => window.open(payload.file_url!, "_blank") }
                  : undefined,
              });
            } else {
              toast.error("Échec de la génération de l'export.");
            }
            queryClient.invalidateQueries({ queryKey: ["exports"] });
            break;
        }
      };

      // Reconnexion automatique (backoff jusqu'à 30s) : une coupure réseau/Redis ne
      // doit pas faire perdre les notifications temps réel pour le reste de la session.
      socket.onclose = () => {
        if (closedByEffect.current) return;
        const delay = Math.min(30000, 1000 * 2 ** reconnectAttempt.current);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closedByEffect.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
  }, [accessToken, queryClient]);
}
