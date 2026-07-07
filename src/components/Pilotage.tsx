import { type CSSProperties, useCallback, useState } from "react";

import {
  type ActiviteCreate,
  ApiError,
  type ConsultationCreate,
  type PerimetreUnite,
  type PilotageMoi,
  createActivite,
  createConsultation,
  exportMembresCsv,
  getAssiduite,
  getConsultationResultats,
  getPerimetres,
  getPilotageAgenda,
  getPilotageMembres,
  getTableauDeBord,
  listConsultations,
  setConsultationStatut,
} from "../api.js";
import { useResource } from "../useResource.js";

type Onglet = "bord" | "activites" | "consultations" | "membres";

const tabStyle = (actif: boolean): CSSProperties => ({
  padding: "8px 16px",
  border: "none",
  borderBottom: actif ? "2px solid var(--adsum-accent, #4f46e5)" : "2px solid transparent",
  background: "transparent",
  color: actif ? "var(--adsum-accent, #4f46e5)" : "inherit",
  fontWeight: actif ? 700 : 500,
  cursor: "pointer",
});

const input: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--adsum-border, #d0d0d8)",
  background: "var(--adsum-surface, #fff)",
  minWidth: 180,
};

const btn: CSSProperties = { ...input, cursor: "pointer", minWidth: 0, fontWeight: 600 };

export function Pilotage({ token, moi }: { token: string; moi: PilotageMoi }): JSX.Element {
  const [onglet, setOnglet] = useState<Onglet>("bord");
  const perimetre = moi.global
    ? "Supervision globale"
    : `Périmètre : ${moi.coordinations} coordination(s), ${moi.intendances} intendance(s), ${moi.membres_perimetre} membre(s)`;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Pilotage</h1>
          <p className="muted">{perimetre}</p>
        </div>
      </header>
      <nav style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--adsum-border, #e5e5ec)", marginBottom: 16 }}>
        <button type="button" style={tabStyle(onglet === "bord")} onClick={() => setOnglet("bord")}>Tableau de bord</button>
        <button type="button" style={tabStyle(onglet === "activites")} onClick={() => setOnglet("activites")}>Activités</button>
        <button type="button" style={tabStyle(onglet === "consultations")} onClick={() => setOnglet("consultations")}>Consultations</button>
        <button type="button" style={tabStyle(onglet === "membres")} onClick={() => setOnglet("membres")}>Membres</button>
      </nav>
      {onglet === "bord" && <TableauBord token={token} />}
      {onglet === "activites" && <Activites token={token} moi={moi} />}
      {onglet === "consultations" && <Consultations token={token} moi={moi} />}
      {onglet === "membres" && <Membres token={token} />}
    </div>
  );
}

export function TableauBord({ token }: { token: string }): JSX.Element {
  const kpi = useResource(() => getTableauDeBord(token), [token]);
  const agenda = useResource(() => getPilotageAgenda(token), [token]);
  const assiduite = useResource(() => getAssiduite(token), [token]);
  const d = kpi.data;
  const a = assiduite.data;
  const aRelancer = (a?.membres ?? []).filter((m) => m.presences === 0);
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi kpi-accent"><span className="kpi-label">Membres</span><span className="kpi-value">{d ? d.membres_total : "..."}</span><span className="kpi-hint">{d?.membres_actifs ?? 0} actifs</span></div>
        <div className="kpi"><span className="kpi-label">Vérifiés</span><span className="kpi-value">{d ? d.membres_verifies : "..."}</span><span className="kpi-hint">identité</span></div>
        <div className="kpi"><span className="kpi-label">Activités à venir</span><span className="kpi-value">{d ? d.activites_a_venir : "..."}</span><span className="kpi-hint">dans votre périmètre</span></div>
        <div className="kpi"><span className="kpi-label">À relancer</span><span className="kpi-value">{a ? a.a_relancer : "..."}</span><span className="kpi-hint">0 présence sur {a?.fenetre_jours ?? 90} j</span></div>
      </div>
      <section className="card">
        <h2 className="card-title">Membres à relancer</h2>
        <p className="muted" style={{ marginTop: 0 }}>Aucune présence enregistrée sur les {a?.fenetre_jours ?? 90} derniers jours ({a?.evenements ?? 0} activités).</p>
        {assiduite.loading ? (
          <p className="muted">Chargement...</p>
        ) : aRelancer.length === 0 ? (
          <p className="muted">Personne à relancer, bonne assiduité.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {aRelancer.slice(0, 30).map((m) => (
              <li key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{m.nom_affichage ?? "-"}</span>
                <span className="muted" style={{ fontSize: 12 }}>{m.matricule}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2 className="card-title">Agenda du périmètre</h2>
        {agenda.loading ? (
          <p className="muted">Chargement...</p>
        ) : (agenda.data ?? []).length === 0 ? (
          <p className="muted">Aucune activité pour le moment.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {(agenda.data ?? []).slice(0, 20).map((a) => (
              <li key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{a.titre}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {a.debut ? new Date(a.debut).toLocaleString("fr-FR") : ""}{a.lieu ? ` · ${a.lieu}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function Activites({ token, moi }: { token: string; moi: PilotageMoi }): JSX.Element {
  const agenda = useResource(() => getPilotageAgenda(token), [token]);
  const perimetres = useResource(() => getPerimetres(token), [token]);
  const [titre, setTitre] = useState("");
  const [debut, setDebut] = useState("");
  const [lieu, setLieu] = useState("");
  const [cible, setCible] = useState("");
  const [mode, setMode] = useState("presentiel");
  const [err, setErr] = useState<string | null>(null);

  const submit = useCallback(() => {
    setErr(null);
    if (!titre.trim() || !debut || !cible) {
      setErr("Titre, date et cible requis.");
      return;
    }
    let cible_type = "general";
    let cible_id: string | undefined;
    if (cible !== "general") {
      const [dim, id] = cible.split(":");
      cible_type = dim || "general";
      cible_id = id || undefined;
    }
    const body: ActiviteCreate = {
      titre: titre.trim(),
      debut: new Date(debut).toISOString(),
      lieu: lieu.trim() || undefined,
      mode,
      cible_type,
      cible_id,
      visibilite: "membres",
    };
    createActivite(token, body)
      .then(() => {
        setTitre("");
        setDebut("");
        setLieu("");
        agenda.reload();
      })
      .catch((e: unknown) => setErr(e instanceof ApiError ? e.message : "Création impossible"));
  }, [token, titre, debut, lieu, cible, mode, agenda]);

  return (
    <>
      <section className="card">
        <h2 className="card-title">Nouvelle activité</h2>
        {err && <p className="banner banner-error">{err}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input style={{ ...input, flex: 1 }} placeholder="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          <input style={input} type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} />
          <input style={input} placeholder="Lieu ou lien" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          <select style={input} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="presentiel">Présentiel</option>
            <option value="en_ligne">En ligne</option>
            <option value="hybride">Hybride</option>
          </select>
          <select style={input} value={cible} onChange={(e) => setCible(e.target.value)}>
            <option value="">Cible...</option>
            {moi.global && <option value="general">Général (tous)</option>}
            {(perimetres.data ?? []).map((p: PerimetreUnite) => (
              <option key={`${p.dimension}:${p.id}`} value={`${p.dimension}:${p.id}`}>
                {p.dimension === "coordination" ? "Coordination" : p.dimension === "intendance" ? "Intendance" : "Tribu"} {p.nom}
              </option>
            ))}
          </select>
          <button type="button" style={{ ...btn, background: "var(--adsum-accent, #4f46e5)", color: "#fff", border: "none" }} onClick={submit}>Publier</button>
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">Agenda du périmètre</h2>
        {agenda.loading ? (
          <p className="muted">Chargement...</p>
        ) : (agenda.data ?? []).length === 0 ? (
          <p className="muted">Aucune activité.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {(agenda.data ?? []).map((a) => (
              <li key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{a.titre}</span>
                <span className="muted" style={{ fontSize: 12 }}>{a.debut ? new Date(a.debut).toLocaleString("fr-FR") : ""}{a.lieu ? ` · ${a.lieu}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function Membres({ token }: { token: string }): JSX.Element {
  const membres = useResource(() => getPilotageMembres(token), [token]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const onExport = useCallback(() => {
    setErr(null);
    exportMembresCsv(token).catch((e: unknown) => setErr(e instanceof ApiError ? e.message : "Export impossible"));
  }, [token]);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const visibles = (membres.data ?? []).filter((m) => !q.trim() || norm(m.nom_affichage ?? "").includes(norm(q)) || norm(m.matricule ?? "").includes(norm(q)));
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 className="card-title" style={{ margin: 0 }}>Membres du périmètre ({visibles.length})</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={input} placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" style={btn} onClick={onExport}>Exporter CSV</button>
        </div>
      </div>
      {err && <p className="banner banner-error">{err}</p>}
      {membres.loading ? (
        <p className="muted">Chargement...</p>
      ) : (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {visibles.map((m) => (
            <li key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{m.nom_affichage ?? "-"}</span>
              <span className="muted" style={{ fontSize: 12 }}>{m.matricule} · {m.statut}{m.verifie ? " · vérifié" : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface QDraft {
  libelle: string;
  type: string;
}

export function Consultations({ token, moi }: { token: string; moi: PilotageMoi }): JSX.Element {
  const liste = useResource(() => listConsultations(token), [token]);
  const perimetres = useResource(() => getPerimetres(token), [token]);
  const [titre, setTitre] = useState("");
  const [cible, setCible] = useState(""); // "general" or "dimension:id"
  const [questions, setQuestions] = useState<QDraft[]>([{ libelle: "", type: "oui_non" }]);
  const [err, setErr] = useState<string | null>(null);
  const [resultatsId, setResultatsId] = useState<string | null>(null);

  const submit = useCallback(() => {
    setErr(null);
    if (!titre.trim() || !cible) {
      setErr("Titre et cible requis.");
      return;
    }
    let dimension = "general";
    let scope_id: string | undefined;
    if (cible !== "general") {
      const [dim, id] = cible.split(":");
      dimension = dim || "general";
      scope_id = id || undefined;
    }
    const body: ConsultationCreate = {
      titre: titre.trim(),
      dimension,
      scope_id,
      questions: questions.filter((q) => q.libelle.trim()).map((q) => ({ libelle: q.libelle.trim(), type: q.type })),
    };
    createConsultation(token, body)
      .then(() => {
        setTitre("");
        setQuestions([{ libelle: "", type: "oui_non" }]);
        liste.reload();
      })
      .catch((e: unknown) => setErr(e instanceof ApiError ? e.message : "Création impossible"));
  }, [token, titre, cible, questions, liste]);

  const changeStatut = useCallback(
    (id: string, statut: string) => {
      setConsultationStatut(token, id, statut).then(() => liste.reload()).catch(() => undefined);
    },
    [token, liste],
  );

  return (
    <>
      <section className="card">
        <h2 className="card-title">Nouvelle consultation</h2>
        {err && <p className="banner banner-error">{err}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input style={{ ...input, flex: 1 }} placeholder="Titre (ex. Présence au congrès)" value={titre} onChange={(e) => setTitre(e.target.value)} />
          <select style={input} value={cible} onChange={(e) => setCible(e.target.value)}>
            <option value="">Cible...</option>
            {moi.global && <option value="general">Général (tous)</option>}
            {(perimetres.data ?? []).map((p: PerimetreUnite) => (
              <option key={`${p.dimension}:${p.id}`} value={`${p.dimension}:${p.id}`}>
                {p.dimension === "coordination" ? "Coordination" : p.dimension === "intendance" ? "Intendance" : "Tribu"} {p.nom}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input style={{ ...input, flex: 1 }} placeholder={`Question ${i + 1}`} value={q.libelle} onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, libelle: e.target.value } : x)))} />
              <select style={input} value={q.type} onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                <option value="oui_non">Oui / Non</option>
                <option value="choix">Choix</option>
                <option value="note">Note</option>
                <option value="texte">Texte</option>
              </select>
            </div>
          ))}
          <button type="button" style={{ ...btn, alignSelf: "flex-start" }} onClick={() => setQuestions((qs) => [...qs, { libelle: "", type: "oui_non" }])}>+ Question</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" style={{ ...btn, background: "var(--adsum-accent, #4f46e5)", color: "#fff", border: "none" }} onClick={submit}>Créer</button>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Consultations</h2>
        {liste.loading ? (
          <p className="muted">Chargement...</p>
        ) : (liste.data ?? []).length === 0 ? (
          <p className="muted">Aucune consultation.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {(liste.data ?? []).map((c) => (
              <li key={c.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{c.titre} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>({c.statut})</span></span>
                <span style={{ display: "flex", gap: 6 }}>
                  {c.statut === "brouillon" && <button type="button" style={btn} onClick={() => changeStatut(c.id, "ouverte")}>Ouvrir</button>}
                  {c.statut === "ouverte" && <button type="button" style={btn} onClick={() => changeStatut(c.id, "close")}>Clore</button>}
                  <button type="button" style={btn} onClick={() => setResultatsId(resultatsId === c.id ? null : c.id)}>Résultats</button>
                </span>
                {resultatsId === c.id && <Resultats token={token} id={c.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Resultats({ token, id }: { token: string; id: string }): JSX.Element {
  const res = useResource(() => getConsultationResultats(token, id), [token, id]);
  if (res.loading) return <p className="muted" style={{ width: "100%" }}>Chargement des résultats...</p>;
  const d = res.data;
  if (!d) return <p className="muted" style={{ width: "100%" }}>Résultats indisponibles.</p>;
  return (
    <div style={{ width: "100%", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--adsum-border, #eee)" }}>
      <p className="muted" style={{ margin: "0 0 6px" }}>{d.repondants} répondant(s)</p>
      {d.questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 6 }}>
          <strong style={{ fontSize: 13 }}>{q.libelle}</strong>
          <ul style={{ margin: "2px 0 0", paddingLeft: 18 }}>
            {q.reponses.length === 0 ? <li className="muted" style={{ fontSize: 12 }}>Aucune réponse</li> : q.reponses.map((r, i) => (
              <li key={i} style={{ fontSize: 12 }}>{r.valeur ?? "(vide)"} : {r.n}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
