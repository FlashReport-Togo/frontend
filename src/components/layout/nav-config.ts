import {
  AlertTriangle,
  BarChart3,
  Download,
  FilePlus,
  FileText,
  LayoutDashboard,
  MapPin,
  ScanLine,
  Settings,
  Share2,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    roles: ["district_agent", "regional_focal_point", "national_agent", "admin"],
  },
  {
    href: "/reports",
    label: "Rapports",
    icon: FileText,
    roles: ["district_agent", "regional_focal_point", "national_agent", "admin"],
  },
  { href: "/reports/new", label: "Nouveau rapport", icon: FilePlus, roles: ["district_agent"] },
  { href: "/reports/import", label: "Importer un rapport", icon: Upload, roles: ["district_agent"] },
  { href: "/ocr", label: "Scan OCR", icon: ScanLine, roles: ["district_agent"] },
  {
    href: "/alerts",
    label: "Alertes",
    icon: AlertTriangle,
    roles: ["district_agent", "regional_focal_point", "national_agent", "admin"],
  },
  {
    href: "/analytics",
    label: "Analytique",
    icon: BarChart3,
    roles: ["regional_focal_point", "national_agent", "admin"],
  },
  { href: "/dhis2", label: "DHIS2", icon: Share2, roles: ["national_agent", "admin"] },
  {
    href: "/exports",
    label: "Exports",
    icon: Download,
    roles: ["regional_focal_point", "national_agent", "admin"],
  },
  { href: "/users", label: "Utilisateurs", icon: Users, roles: ["admin"] },
  { href: "/geography", label: "Référentiel géographique", icon: MapPin, roles: ["admin"] },
  {
    href: "/settings",
    label: "Paramètres",
    icon: Settings,
    roles: ["district_agent", "regional_focal_point", "national_agent", "admin"],
  },
];
