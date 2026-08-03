"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileSpreadsheet, Pencil, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { geographyApi } from "@/lib/endpoints/geography";
import type { Disease, DiseaseCategory, District } from "@/types";

export default function GeographyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Référentiel géographique</h1>
        <p className="mt-1 text-sm text-secondary">Districts, maladies et correspondances DHIS2.</p>
      </div>

      <Tabs defaultValue="districts">
        <TabsList>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="diseases">Maladies</TabsTrigger>
        </TabsList>
        <TabsContent value="districts">
          <DistrictsTable />
        </TabsContent>
        <TabsContent value="diseases">
          <DiseasesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DistrictsTable() {
  const queryClient = useQueryClient();
  const { data: districts, isLoading } = useQuery({ queryKey: ["districts"], queryFn: () => geographyApi.listDistricts() });
  const { data: regions } = useQuery({ queryKey: ["regions"], queryFn: () => geographyApi.listRegions() });
  const [editing, setEditing] = useState<District | null>(null);
  const [uid, setUid] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [creating, setCreating] = useState(false);

  const save = async () => {
    if (!editing) return;
    try {
      await geographyApi.updateDistrict(editing.id, { dhis2_org_unit_uid: uid || null });
      toast.success("Mapping DHIS2 mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      setEditing(null);
    } catch {
      toast.error("Échec de la mise à jour.");
    }
  };

  const createDistrict = async () => {
    if (!newName.trim() || !newRegion) {
      toast.error("Nom et région requis.");
      return;
    }
    setCreating(true);
    try {
      await geographyApi.createDistrict({ name: newName.trim(), code: newCode.trim() || null, region: newRegion, is_active: true });
      toast.success("District créé.");
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      setCreateOpen(false);
      setNewName(""); setNewCode(""); setNewRegion("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      toast.error(axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : "Échec de la création.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Nouveau district
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>District</Th>
                <Th>Région</Th>
                <Th>orgUnit DHIS2</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {districts?.map((d) => (
                <Tr key={d.id}>
                  <Td className="font-medium">{d.name}</Td>
                  <Td className="text-secondary">{d.region_name}</Td>
                  <Td>
                    {editing?.id === d.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={uid}
                          onChange={(e) => setUid(e.target.value)}
                          className="w-32 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-xs text-primary focus:border-accent-blue focus:outline-none"
                        />
                        <button onClick={save} className="text-severity-low"><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} className="text-secondary"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-secondary">{d.dhis2_org_unit_uid ?? "—"}</span>
                    )}
                  </Td>
                  <Td>
                    <Badge className={d.dhis2_mapping_complete ? "bg-severity-low/12 text-severity-low" : ""}>
                      {d.dhis2_mapping_complete ? "Mappé" : "Non mappé"}
                    </Badge>
                  </Td>
                  <Td>
                    <button
                      onClick={() => { setEditing(d); setUid(d.dhis2_org_unit_uid ?? ""); }}
                      className="text-secondary hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Nouveau district">
        <div className="flex flex-col gap-4">
          <Field label="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Golfe" />
          <Field label="Code (optionnel)" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="GOLFE" />
          <Select label="Région" value={newRegion} onChange={(e) => setNewRegion(e.target.value)}>
            <option value="">Sélectionner…</option>
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button loading={creating} onClick={createDistrict}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const CATEGORY_OPTIONS: { value: DiseaseCategory; label: string }[] = [
  { value: "contagieuse", label: "Contagieuse" },
  { value: "non_contagieuse", label: "Non contagieuse" },
];

function DiseasesTable() {
  const queryClient = useQueryClient();
  const { data: diseases, isLoading } = useQuery({ queryKey: ["diseases"], queryFn: () => geographyApi.listDiseases() });
  const [editing, setEditing] = useState<Disease | null>(null);
  const [threshold, setThreshold] = useState("");
  const [period, setPeriod] = useState("semaine");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<DiseaseCategory>("contagieuse");
  const [creating, setCreating] = useState(false);

  const save = async () => {
    if (!editing) return;
    try {
      await geographyApi.setThreshold(editing.id, {
        epidemic_threshold: Number(threshold),
        threshold_period: period,
      });
      toast.success("Seuil épidémique mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["diseases"] });
      setEditing(null);
    } catch {
      toast.error("Échec de la mise à jour.");
    }
  };

  const createDisease = async () => {
    if (!newName.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    setCreating(true);
    try {
      await geographyApi.createDisease({ name: newName.trim(), category: newCategory, is_active: true, threshold_period: "semaine" });
      toast.success("Maladie créée. Configurez maintenant son formulaire.");
      queryClient.invalidateQueries({ queryKey: ["diseases"] });
      setCreateOpen(false);
      setNewName("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      toast.error(axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : "Échec de la création.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Nouvelle maladie
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Maladie</Th>
                <Th>Catégorie</Th>
                <Th>Seuil épidémique</Th>
                <Th>Mapping DHIS2</Th>
                <Th>Formulaire</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {diseases?.map((d) => (
                <Tr key={d.id}>
                  <Td className="font-medium">{d.name}</Td>
                  <Td className="text-secondary capitalize">{d.category.replace("_", " ")}</Td>
                  <Td>
                    {editing?.id === d.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="number"
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                          className="w-16 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-xs text-primary focus:border-accent-blue focus:outline-none"
                        />
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="rounded-lg border border-border-subtle bg-surface px-2 py-1 text-xs text-primary"
                        >
                          <option value="jour">/jour</option>
                          <option value="semaine">/semaine</option>
                          <option value="mois">/mois</option>
                        </select>
                        <button onClick={save} className="text-severity-low"><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} className="text-secondary"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-secondary">
                        {d.epidemic_threshold ? `${d.epidemic_threshold} / ${d.threshold_period}` : "—"}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Badge className={d.dhis2_mapping_complete ? "bg-severity-low/12 text-severity-low" : ""}>
                      {d.dhis2_mapping_complete ? "Mappé" : "Non mappé"}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/geography/templates/${d.id}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
                    >
                      <FileSpreadsheet size={14} /> Configurer
                    </Link>
                  </Td>
                  <Td>
                    <button
                      onClick={() => {
                        setEditing(d);
                        setThreshold(String(d.epidemic_threshold ?? ""));
                        setPeriod(d.threshold_period);
                      }}
                      className="text-secondary hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Nouvelle maladie" description="Le formulaire RMA se configure juste après.">
        <div className="flex flex-col gap-4">
          <Field label="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Rougeole" />
          <Select label="Catégorie" value={newCategory} onChange={(e) => setNewCategory(e.target.value as DiseaseCategory)}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button loading={creating} onClick={createDisease}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
