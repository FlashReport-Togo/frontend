export type UserRole = "district_agent" | "regional_focal_point" | "national_agent" | "admin";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Region {
  id: string;
  name: string;
  code: string | null;
  dhis2_org_unit_uid: string | null;
}

export interface District {
  id: string;
  region: string;
  region_name: string;
  name: string;
  code: string | null;
  dhis2_org_unit_uid: string | null;
  is_active: boolean;
  dhis2_mapping_complete: boolean;
}

export type DiseaseCategory = "contagieuse" | "non_contagieuse";
export type ThresholdPeriod = "jour" | "semaine" | "mois";

export interface Disease {
  id: string;
  name: string;
  category: DiseaseCategory;
  epidemic_threshold: number | null;
  threshold_period: ThresholdPeriod;
  is_active: boolean;
  dhis2_data_element_uid: string | null;
  dhis2_category_option_combo_uid: string | null;
  dhis2_mapping_complete: boolean;
}

export type ReportStatus = "brouillon" | "soumis" | "validé" | "rejeté";
export type PeriodType = "journalier" | "hebdomadaire";
export type SourceChannel = "manuel" | "import_excel" | "import_pdf" | "ocr";

export interface ReportDataValue {
  id: string;
  report: string;
  disease: string;
  disease_name: string;
  cases: number;
  deaths: number;
  notes: string | null;
  confidence_score: number | null;
  confidence_note: string | null;
  requires_manual_review: boolean;
}

export type QualitySeverity = "info" | "avertissement" | "bloquant";

export interface QualityCheckResult {
  id: string;
  report: string;
  report_data_value: string | null;
  disease_name: string | null;
  rule_code: string;
  severity: QualitySeverity;
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface ReportListItem {
  id: string;
  district: string;
  district_name: string;
  region_name: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  status: ReportStatus;
  source_channel: SourceChannel;
  quality_score: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface ReportDetail extends ReportListItem {
  submitted_by: string | null;
  validated_by: string | null;
  rejection_reason: string | null;
  ocr_scan: string | null;
  data_values: ReportDataValue[];
  quality_checks: QualityCheckResult[];
  updated_at: string;
}

export interface ReportHistoryEntry {
  id: string;
  report: string;
  user: string;
  user_name: string;
  action: string;
  diff: Record<string, unknown> | null;
  created_at: string;
}

export type AlertType = "rapport_manquant" | "seuil_epidemique" | "anomalie_donnees";
export type AlertSeverity = "faible" | "moyenne" | "critique";
export type AlertStatus = "ouverte" | "acquittée" | "résolue";

export interface AlertItem {
  id: string;
  type: AlertType;
  district: string | null;
  district_name: string | null;
  disease: string | null;
  disease_name: string | null;
  report: string | null;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  triggered_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_comment: string | null;
}

export interface NotificationItem {
  id: string;
  user: string;
  alert: string | null;
  channel: "in_app" | "email" | "fcm";
  message: string;
  is_read: boolean;
  created_at: string;
}

export type OCRScanStatus = "en_attente" | "traité" | "échec";

export interface OCRScan {
  id: string;
  uploaded_by: string;
  district: string;
  image_url: string;
  cloudinary_public_id: string;
  model_used: string;
  status: OCRScanStatus;
  processing_time_ms: number | null;
  error_message: string | null;
  raw_ai_response: unknown;
  created_at: string;
}

export type DHIS2PushStatus = "succès" | "échec_partiel" | "échec";

export interface DHIS2PushLog {
  id: string;
  report: string;
  triggered_by: string;
  triggered_via: "manuel" | "tâche_planifiée";
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown> | null;
  status: DHIS2PushStatus;
  created_at: string;
}

export interface DHIS2MetadataCacheItem {
  id: string;
  entity_type: "org_unit" | "data_element" | "category_option_combo";
  dhis2_uid: string;
  display_name: string;
  parent_uid: string | null;
  synced_at: string;
}

export type ExportType = "reports_pdf" | "reports_excel" | "analytics_pdf";
export type ExportStatus = "en_cours" | "prêt" | "échec";

export interface ReportExportItem {
  id: string;
  requested_by: string;
  export_type: ExportType;
  filters: Record<string, unknown>;
  status: ExportStatus;
  file_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  district: string | null;
  district_name: string | null;
  region: string | null;
  region_name: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}
