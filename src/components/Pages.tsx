import { type CSSProperties, useCallback, useState } from "react";

import {
  ApiError,
  type PilotageMoi,
  type Tag,
  demanderTag,
  exportMembresCsv,
  getAssiduite,
  getPerimetres,
  getTags,
} from "../api.js";
import { useResource } from "../useResource.js";

const input: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--adsum-border, #d0d0d8)",
  background: "var(--adsum-surface, #fff)",
  minWidth: 160,
};
const btn: CSSProperties = { ...input, cursor: "pointer", minWidth: 0, fontWeight: 600 };

const FAMILLE_LABELS: Record<string, string> = {
  diffusion: "Diffusion",
  territoire: "Territoire",
  organisation: "Organisation",
  type_activite: "Type d'activité",
  transverse: "Transverse",
};

export function AssiduitePage({ token }: { token: string }): JSX.Element {
  const a = useResource(() => getAssiduite(token), [token]);
  const d = a.data;
  return (
    <section className="card">
      <h2 className="card-title">Assiduité, {d?.fenetre_jours ?? 90} derniers jours</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {d?.evenements ?? 0} activités sur la période. {d?.a_relancer ?? 0} membre(s) sans aucune présence.
      </p>
      {a.loading ? (
        <p className="muted">Chargement...</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {(d?.membres ?? []).map((m) => (
            <li key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", borderBottom: "1px solid var(--adsum-border,#f0f0f4)" }}>
              <span style={{ color: m.presences === 0 ? "var(--adsum-danger, #c0392b)" : "inherit" }}>{m.nom_affichage ?? "-"}</span>
              <span className="muted" style={{ fontSize: 12 }}>{m.matricule} · {m.presences} présence(s)</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TagsPage({ token }: { token: string }): JSX.Element {
  const tags = useResource(() => getTags(token), [token]);
  const [famille, setFamille] = useState("type_activite");
  const [libelle, setLibelle] = useState("");
  const [justif, setJustif] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = useCallback(() => {
    setMsg(null);
    if (!libelle.trim()) {
      setMsg("Libellé requis.");
      return;
    }
    demanderTag(token, { famille, libelle: libelle.trim(), justification: justif.trim() || undefined })
      .then(() => {
        setLibelle("");
        setJustif("");
        setMsg("Demande envoyée, en attente de validation centrale.");
      })
      .catch((e: unknown) => setMsg(e instanceof ApiError ? e.message : "Demande impossible"));
  }, [token, famille, libelle, justif]);

  const byFamille = (fam: string) => (tags.data ?? []).filter((t: Tag) => t.famille === fam);

  return (
    <>
      <section className="card">
        <h2 className="card-title">Demander un tag</h2>
        <p className="muted" style={{ marginTop: 0 }}>Les tags sont gouvernés : votre demande est soumise à la validation centrale.</p>
        {msg && <p className="banner" style={{ background: "#eef6ee", border: "1px solid #a9d3a9", padding: 10, borderRadius: 8, fontSize: 13 }}>{msg}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <select style={input} value={famille} onChange={(e) => setFamille(e.target.value)}>
            {Object.entries(FAMILLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input style={{ ...input, flex: 1 }} placeholder="Libellé du tag" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          <input style={{ ...input, flex: 1 }} placeholder="Justification (facultatif)" value={justif} onChange={(e) => setJustif(e.target.value)} />
          <button type="button" style={{ ...btn, background: "var(--adsum-accent, #4f46e5)", color: "#fff", border: "none" }} onClick={submit}>Envoyer</button>
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">Catalogue des tags</h2>
        {tags.loading ? (
          <p className="muted">Chargement...</p>
        ) : (tags.data ?? []).length === 0 ? (
          <p className="muted">Aucun tag dans le catalogue pour le moment.</p>
        ) : (
          Object.keys(FAMILLE_LABELS).map((fam) =>
            byFamille(fam).length === 0 ? null : (
              <div key={fam} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--adsum-muted, #888)", textTransform: "uppercase", letterSpacing: 0.4 }}>{FAMILLE_LABELS[fam]}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {byFamille(fam).map((t) => (
                    <span key={t.id} title={t.description ?? ""} style={{ padding: "4px 10px", borderRadius: 20, background: "#eef2fb", color: "var(--adsum-accent, #4f46e5)", fontSize: 12, fontWeight: 600 }}>{t.libelle}</span>
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </section>
    </>
  );
}

export function RapportsPage({ token }: { token: string }): JSX.Element {
  const [err, setErr] = useState<string | null>(null);
  const onExport = useCallback(() => {
    setErr(null);
    exportMembresCsv(token).catch((e: unknown) => setErr(e instanceof ApiError ? e.message : "Export impossible"));
  }, [token]);
  return (
    <section className="card">
      <h2 className="card-title">Rapports et exports</h2>
      <p className="muted" style={{ marginTop: 0 }}>Exports bornés à votre périmètre et journalisés.</p>
      {err && <p className="banner banner-error">{err}</p>}
      <button type="button" style={{ ...btn, background: "var(--adsum-accent, #4f46e5)", color: "#fff", border: "none" }} onClick={onExport}>
        Exporter les membres (CSV)
      </button>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Le CSV contient le matricule, le nom d'affichage, le statut et l'état de vérification, uniquement pour les membres de votre périmètre.
      </p>
    </section>
  );
}

export function CollaborationPage(): JSX.Element {
  return (
    <section className="card">
      <h2 className="card-title">Outil de collaboration</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Préparez vos activités (congrès, campagnes, réunions) dans des tableaux Kanban : colonnes, cartes, checklists,
        commentaires et historique. Quand une carte est prête, publiez-la : elle devient une activité ciblée sur votre
        périmètre et alimente automatiquement l'agenda des membres concernés.
      </p>
      <a
        href="https://adsum-collaboration.pages.dev/"
        target="_blank"
        rel="noreferrer"
        style={{ ...btn, display: "inline-block", textDecoration: "none", background: "var(--adsum-accent, #4f46e5)", color: "#fff", border: "none" }}
      >
        Ouvrir la collaboration
      </a>
    </section>
  );
}

export function PerimetrePage({ token, moi }: { token: string; moi: PilotageMoi }): JSX.Element {
  const unites = useResource(() => getPerimetres(token), [token]);
  return (
    <>
      <section className="card">
        <h2 className="card-title">Mon périmètre</h2>
        <div className="kpi-grid">
          <div className="kpi kpi-accent"><span className="kpi-label">Portée</span><span className="kpi-value" style={{ fontSize: 20 }}>{moi.global ? "Globale" : "Périmètre"}</span><span className="kpi-hint">{moi.role}</span></div>
          <div className="kpi"><span className="kpi-label">Coordinations</span><span className="kpi-value">{moi.coordinations}</span><span className="kpi-hint">gouvernées</span></div>
          <div className="kpi"><span className="kpi-label">Intendances</span><span className="kpi-value">{moi.intendances}</span><span className="kpi-hint">gouvernées</span></div>
          <div className="kpi"><span className="kpi-label">Membres</span><span className="kpi-value">{moi.membres_perimetre}</span><span className="kpi-hint">dans le périmètre</span></div>
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">Unités gouvernées</h2>
        {unites.loading ? (
          <p className="muted">Chargement...</p>
        ) : (unites.data ?? []).length === 0 ? (
          <p className="muted">Aucune unité.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {(unites.data ?? []).map((u) => (
              <li key={`${u.dimension}:${u.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{u.nom}</span>
                <span className="muted" style={{ fontSize: 12 }}>{u.dimension}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
