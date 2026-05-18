"use client";

import { useState } from "react";
import { useTracker } from "./tracker/useTracker";
import type { CustomItem, Instance } from "./tracker/types";
import { fmt, remaining } from "./tracker/utils";
import { AuthNav } from "./auth-nav";

type InstanceActionModalState =
  | { kind: "add"; item: Instance }
  | { kind: "remove"; itemId: string; itemName: string }
  | null;

type EditCustomModalState = {
  itemId: string;
  name: string;
  cdDays: string;
  cdHours: string;
  note: string;
} | null;

type CustomActionModalState =
  | { kind: "add"; name: string; cdHours: number; note: string }
  | { kind: "edit"; itemId: string; name: string; cdHours: number; note: string }
  | { kind: "remove"; itemId: string; itemName: string }
  | null;

function toCustomCdLabel(hours: number): string {
  if (Number.isInteger(hours) && hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 día" : `${days} días`;
  }
  return `${hours}h`;
}

export default function HomePage() {
  const {
    state,
    setState,
    activeChar,
    categories,
    totalMain,
    doneCustom,
    total,
    done,
    percent,
    nextResetLabel,
    filteredSearch,
    showSearchModal,
    setShowSearchModal,
    search,
    setSearch,
    showAddForm,
    setShowAddForm,
    formName,
    setFormName,
    formDays,
    setFormDays,
    formHours,
    setFormHours,
    formNote,
    setFormNote,
    addChar,
    updateActiveChar,
    toggleInstance,
    addNewGlobalInstance,
    toggleCustom,
    removeGlobal,
    resetCharacter,
  } = useTracker();
  const [instanceActionModal, setInstanceActionModal] = useState<InstanceActionModalState>(null);
  const [editCustomModal, setEditCustomModal] = useState<EditCustomModalState>(null);
  const [customActionModal, setCustomActionModal] = useState<CustomActionModalState>(null);

  function openEditCustomModal(item: CustomItem) {
    const totalHours = Math.max(1, Math.round(item.cd / 3600));
    const cdDays = Math.floor(totalHours / 24);
    const cdHours = totalHours % 24;
    setEditCustomModal({
      itemId: item.id,
      name: item.name,
      cdDays: String(cdDays),
      cdHours: String(cdHours),
      note: item.note ?? "",
    });
  }

  function applyCustomAction(scope: "active" | "all") {
    if (!customActionModal) return;

    if (customActionModal.kind === "add") {
      const customId = `ci${Date.now()}`;
      const newItem = {
        id: customId,
        name: customActionModal.name,
        cd: Math.round(customActionModal.cdHours * 3600),
        cdLabel: toCustomCdLabel(customActionModal.cdHours),
        note: customActionModal.note,
        doneAt: null,
      };

      if (scope === "all") {
        setState((prev) => ({
          ...prev,
          chars: prev.chars.map((char) => ({ ...char, custom: [...char.custom, newItem] })),
        }));
      } else {
        updateActiveChar((char) => ({ ...char, custom: [...char.custom, newItem] }));
      }

      setFormName("");
      setFormDays("1");
      setFormHours("0");
      setFormNote("");
      setShowAddForm(false);
      setCustomActionModal(null);
      return;
    }

    if (customActionModal.kind === "edit") {
      const editMapper = (item: CustomItem) =>
        item.id === customActionModal.itemId
          ? {
              ...item,
              name: customActionModal.name,
              cd: Math.round(customActionModal.cdHours * 3600),
              cdLabel: toCustomCdLabel(customActionModal.cdHours),
              note: customActionModal.note,
            }
          : item;

      if (scope === "all") {
        setState((prev) => ({
          ...prev,
          chars: prev.chars.map((char) => ({ ...char, custom: char.custom.map(editMapper) })),
        }));
      } else {
        updateActiveChar((char) => ({ ...char, custom: char.custom.map(editMapper) }));
      }

      setCustomActionModal(null);
      return;
    }

    if (scope === "all") {
      setState((prev) => ({
        ...prev,
        chars: prev.chars.map((char) => ({
          ...char,
          custom: char.custom.filter((item) => item.id !== customActionModal.itemId),
        })),
      }));
    } else {
      updateActiveChar((char) => ({
        ...char,
        custom: char.custom.filter((item) => item.id !== customActionModal.itemId),
      }));
    }

    setCustomActionModal(null);
  }

  function requestAddCustom() {
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    const days = Math.max(0, Math.floor(parseInt(formDays, 10) || 0));
    const hours = Math.max(0, Math.floor(parseInt(formHours, 10) || 0));
    const cdHours = days * 24 + hours;
    if (cdHours <= 0) return;
    const payload = {
      kind: "add" as const,
      name: trimmedName.slice(0, 40),
      cdHours,
      note: formNote.trim().slice(0, 60),
    };

    if (state.chars.length <= 1) {
      const newItem = {
        id: `ci${Date.now()}`,
        name: payload.name,
        cd: Math.round(payload.cdHours * 3600),
        cdLabel: toCustomCdLabel(payload.cdHours),
        note: payload.note,
        doneAt: null,
      };
      updateActiveChar((char) => ({ ...char, custom: [...char.custom, newItem] }));
      setFormName("");
      setFormDays("1");
      setFormHours("0");
      setFormNote("");
      setShowAddForm(false);
      return;
    }

    setCustomActionModal(payload);
  }

  function requestRemoveCustom(itemId: string, itemName: string) {
    if (state.chars.length <= 1) {
      updateActiveChar((char) => ({
        ...char,
        custom: char.custom.filter((item) => item.id !== itemId),
      }));
      return;
    }

    setCustomActionModal({ kind: "remove", itemId, itemName });
  }

  function requestEditCustom() {
    if (!editCustomModal) return;

    const trimmedName = editCustomModal.name.trim();
    if (!trimmedName) return;

    const days = Math.max(0, Math.floor(parseInt(editCustomModal.cdDays, 10) || 0));
    const hours = Math.max(0, Math.floor(parseInt(editCustomModal.cdHours, 10) || 0));
    const cdHours = days * 24 + hours;
    if (cdHours <= 0) return;

    const payload = {
      kind: "edit",
      itemId: editCustomModal.itemId,
      name: trimmedName.slice(0, 40),
      cdHours,
      note: editCustomModal.note.trim().slice(0, 60),
    } as const;

    if (state.chars.length <= 1) {
      updateActiveChar((char) => ({
        ...char,
        custom: char.custom.map((item) =>
          item.id === payload.itemId
            ? {
                ...item,
                name: payload.name,
                cd: Math.round(payload.cdHours * 3600),
                cdLabel: toCustomCdLabel(payload.cdHours),
                note: payload.note,
              }
            : item,
        ),
      }));
      setEditCustomModal(null);
      return;
    }

    setCustomActionModal(payload);
    setEditCustomModal(null);
  }

  function applyInstanceAction(scope: "active" | "all") {
    if (!instanceActionModal) return;
    if (instanceActionModal.kind === "add") {
      addNewGlobalInstance(instanceActionModal.item, scope);
    } else {
      removeGlobal(instanceActionModal.itemId, scope);
    }
    setInstanceActionModal(null);
  }

  function requestAddInstance(item: Instance) {
    if (state.chars.length <= 1) {
      addNewGlobalInstance(item, "active");
      return;
    }
    setInstanceActionModal({ kind: "add", item });
  }

  function requestRemoveInstance(itemId: string, itemName: string) {
    if (state.chars.length <= 1) {
      removeGlobal(itemId, "active");
      return;
    }
    setInstanceActionModal({ kind: "remove", itemId, itemName });
  }

  return (
    <>
      <header className="site-header">
        <AuthNav />
        <div className="logo">Checklist de Instancias</div>
        <p className="quick-help">Marca una instancia para iniciar su cooldown. Puedes agregar notas rápidas y personalizar tu rutina por personaje.</p>
      </header>

      <div className="char-section">
        <div className="char-bar">
          <span className="char-bar-label">Personaje:</span>
          <div id="char-tabs">
            {state.chars.map((ch) => {
              const chDoneMain = categories.reduce(
                (sum, c) => sum + c.items.filter((i) => remaining(ch.instances[i.id], i.cd) > 0).length,
                0,
              );
              const chDoneCustom = ch.custom.filter((i) => remaining(i.doneAt, i.cd) > 0).length;
              const chTotal = totalMain + ch.custom.length;

              return (
                <div
                  key={ch.id}
                  className={`char-tab ${ch.id === state.activeChar ? "active" : ""}`}
                  onClick={() => setState((prev) => ({ ...prev, activeChar: ch.id }))}
                >
                  <span className="tab-name">{ch.name}</span>
                  <button
                    className="edit-char-btn"
                    aria-label={`Editar nombre de ${ch.name}`}
                    title="Renombrar personaje"
                    onClick={(e) => {
                      e.stopPropagation();
                      const n = prompt("Nuevo nombre del personaje:", ch.name);
                      if (!n?.trim()) return;
                      setState((prev) => ({
                        ...prev,
                        chars: prev.chars.map((x) =>
                          x.id === ch.id ? { ...x, name: n.trim().slice(0, 20) } : x,
                        ),
                      }));
                    }}
                  >
                    ✎
                  </button>
                  <span className="tab-prog">{chDoneMain + chDoneCustom}/{chTotal}</span>
                  <button
                    className="del-char"
                    aria-label={`Eliminar ${ch.name}`}
                    title="Eliminar personaje"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (state.chars.length === 1) {
                        alert("No puedes eliminar el último personaje.");
                        return;
                      }
                      if (!confirm("¿Eliminar este personaje y todos sus datos?")) return;
                      setState((prev) => {
                        const chars = prev.chars.filter((x) => x.id !== ch.id);
                        return {
                          ...prev,
                          chars,
                          activeChar: prev.activeChar === ch.id ? chars[0].id : prev.activeChar,
                        };
                      });
                    }}
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
          <button className="btn-add-char" onClick={addChar}>Nuevo personaje</button>
        </div>

        <div className="prog-bar-row">
          <span className="prog-lbl">Progreso</span>
          <div className="prog-track"><div className="prog-fill" style={{ width: `${percent}%` }} /></div>
          <span className="prog-count">{done} / {total}</span>
          <div className="global-reset-timer">Reset servidor: {nextResetLabel}</div>
          <button className="btn-reset btn-reset-inline" onClick={resetCharacter}>
            Resetear progreso
          </button>
        </div>
      </div>

      <div className="main-grid">
        <div className="left-col">
          <button className="btn-add-instance-main" onClick={() => setShowSearchModal(true)}>AGREGAR NUEVA INSTANCIA</button>

          <div className="panel" id="instances-panel">
            {categories.map((cat) => {
              const catDone = cat.items.filter((i) => remaining(activeChar.instances[i.id], i.cd) > 0).length;
              const collapsedMap = activeChar.collapsed ?? {};
              const collapsed = Boolean(collapsedMap[cat.id]);

              return (
                <div key={cat.id}>
                  <div
                    className={`cat-head ${collapsed ? "collapsed" : ""}`}
                    style={{ color: cat.color }}
                    onClick={() =>
                      updateActiveChar((char) => ({
                        ...char,
                        collapsed: {
                          ...(char.collapsed ?? {}),
                          [cat.id]: !Boolean((char.collapsed ?? {})[cat.id]),
                        },
                      }))
                    }
                  >
                    <span className="group-arrow" aria-hidden="true">
                      {collapsed ? "▸" : "▾"}
                    </span>
                    {cat.title}
                    <span className="cat-count">{catDone}/{cat.items.length}</span>
                  </div>

                  {!collapsed && cat.items.map((item) => {
                    const r = remaining(activeChar.instances[item.id], item.cd);
                    const doneItem = r > 0;
                    const note = activeChar.notes[item.id] ?? "";

                    return (
                      <div key={item.id} className={`row ${doneItem ? "done" : ""}`} onClick={() => toggleInstance(item)}>
                        <div className="chk">{doneItem ? "✓" : ""}</div>
                        <div className="row-info">
                          <div className="row-name">
                            <a href={item.wiki} target="_blank" rel="noreferrer" className="wiki-link" onClick={(e) => e.stopPropagation()}>{item.name}</a>
                            {item.coins ? <span className="coin-badge">Coins {item.coins}</span> : null}
                          </div>
                          <div className="row-meta">{doneItem ? "En cooldown" : "Disponible"}</div>
                          <input
                            className="note-input-react"
                            placeholder="Nota opcional..."
                            value={note}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateActiveChar((char) => ({
                                ...char,
                                notes: { ...char.notes, [item.id]: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="row-actions">
                          <span className={`pill ${doneItem ? "active" : "idle"}`}>{doneItem ? fmt(r) : `CD: ${item.cdLabel}`}</span>
                          <button
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestRemoveInstance(item.id, item.name);
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="right-col">
          <div className="right-panel">
            <div className="panel-head">
              <span>Mis Dailies Personalizadas</span>
              <span className="ph-count">{doneCustom}/{activeChar.custom.length}</span>
              <button className="ph-btn" onClick={() => setShowAddForm((v) => !v)}>Agregar</button>
            </div>

            <div id="custom-list">
              {activeChar.custom.length === 0 ? (
                <div className="custom-empty">No tienes dailies personalizadas todavía.</div>
              ) : activeChar.custom.map((item) => {
                const r = remaining(item.doneAt, item.cd);
                const isDone = r > 0;

                return (
                  <div
                    key={item.id}
                    className={`custom-row ${isDone ? "done" : ""}`}
                    onClick={() => toggleCustom(item.id)}
                  >
                    <button
                      className="edit-char-btn custom-edit-icon"
                      aria-label={`Editar ${item.name}`}
                      title="Editar daily personalizada"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCustomModal(item);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn chk-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCustom(item.id);
                      }}
                    >
                      {isDone ? "✓" : ""}
                    </button>
                    <div className="custom-body">
                      <div className="custom-top">
                        <span className="custom-name-text">{item.name}</span>
                        {item.note ? <span className="note-badge">{item.note}</span> : null}
                      </div>
                    </div>
                    <div className="custom-cd-col">
                      <span className={`pill ${isDone ? "active" : "idle"}`}>{isDone ? fmt(r) : `CD: ${item.cdLabel}`}</span>
                    </div>
                    <div className="custom-right">
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestRemoveCustom(item.id, item.name);
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showAddForm ? (
              <div className="add-form open add-form-desktop">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Nombre de la Daily</label>
                    <input className="form-input" placeholder="Ej: Boost XP, Evento..." value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Días</label>
                    <input className="form-input" type="number" min={0} step={1} value={formDays} onChange={(e) => setFormDays(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Horas</label>
                    <input className="form-input" type="number" min={0} step={1} value={formHours} onChange={(e) => setFormHours(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Observación (opcional)</label>
                    <input className="form-input" value={formNote} onChange={(e) => setFormNote(e.target.value)} maxLength={60} />
                  </div>
                </div>
                <div className="form-btns">
                  <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancelar</button>
                  <button className="btn-confirm" onClick={requestAddCustom}>Guardar</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showSearchModal ? (
        <div className="modal-overlay open" onClick={() => setShowSearchModal(false)}>
          <div className="modal modal-search" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              <span className="modal-title">Agregar Nueva Instancia</span>
              <button className="modal-x" aria-label="Cerrar modal" onClick={() => setShowSearchModal(false)}>×</button>
            </h3>
            <div className="search-modal-body">
              <div className="search-input-wrap">
                <input
                  className="search-input"
                  placeholder="Escribe el nombre de la instancia..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search ? (
                  <button
                    className="search-clear-btn"
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    onClick={() => setSearch("")}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M16.5 3.5 20.5 7.5M14 6 4.9 15.1a2 2 0 0 0 0 2.8l1.2 1.2a2 2 0 0 0 2.8 0L18 10M8.2 18.8h10.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
              <div className="search-results">
                {filteredSearch.length === 0 ? (
                  <div className="search-empty">No se encontraron instancias con ese nombre.</div>
                ) : (
                  filteredSearch.map((item) => {
                    const already = categories.some((cat) => cat.items.some((i) => i.id === item.id || i.wiki === item.wiki));

                    return (
                      <div key={item.id} className="search-result-item">
                        <div className="search-result-info">
                          <span className="search-result-name">{item.name}</span>
                          <span className="search-result-meta">Lvl {item.minLevel}</span>
                        </div>
                        {already ? (
                          <span className="search-added-text">Ya agregada</span>
                        ) : (
                          <button
                            className="btn-add-search"
                            onClick={() => requestAddInstance(item)}
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showAddForm ? (
        <div className="modal-overlay open add-custom-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal add-custom-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              <span className="modal-title">Agregar Daily Personalizada</span>
              <button className="modal-x" aria-label="Cerrar modal" onClick={() => setShowAddForm(false)}>×</button>
            </h3>
            <div className="add-form open add-form-mobile">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Nombre de la Daily</label>
                  <input className="form-input" placeholder="Ej: Boost XP, Evento..." value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={40} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Días</label>
                  <input className="form-input" type="number" min={0} step={1} value={formDays} onChange={(e) => setFormDays(e.target.value)} />
                </div>
                <div className="form-field">
                  <label className="form-label">Horas</label>
                  <input className="form-input" type="number" min={0} step={1} value={formHours} onChange={(e) => setFormHours(e.target.value)} />
                </div>
                <div className="form-field">
                  <label className="form-label">Observación (opcional)</label>
                  <input className="form-input" value={formNote} onChange={(e) => setFormNote(e.target.value)} maxLength={60} />
                </div>
              </div>
              <div className="form-btns">
                <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancelar</button>
                <button className="btn-confirm" onClick={requestAddCustom}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editCustomModal ? (
        <div className="modal-overlay open" onClick={() => setEditCustomModal(null)}>
          <div className="modal modal-edit-custom" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              <span className="modal-title">Editar Daily Personalizada</span>
              <button
                className="modal-x"
                aria-label="Cerrar modal"
                onClick={() => setEditCustomModal(null)}
              >
                ×
              </button>
            </h3>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Nombre de la Daily</label>
                <input
                  className="form-input"
                  placeholder="Ej: Boost XP, Evento..."
                  value={editCustomModal.name}
                  onChange={(e) =>
                    setEditCustomModal((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  maxLength={40}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Días</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step={1}
                  value={editCustomModal.cdDays}
                  onChange={(e) =>
                    setEditCustomModal((prev) => (prev ? { ...prev, cdDays: e.target.value } : prev))
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Horas</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step={1}
                  value={editCustomModal.cdHours}
                  onChange={(e) =>
                    setEditCustomModal((prev) => (prev ? { ...prev, cdHours: e.target.value } : prev))
                  }
                />
              </div>
              <div className="form-field">
                <label className="form-label">Observación (opcional)</label>
                <input
                  className="form-input"
                  value={editCustomModal.note}
                  onChange={(e) =>
                    setEditCustomModal((prev) => (prev ? { ...prev, note: e.target.value } : prev))
                  }
                  maxLength={60}
                />
              </div>
            </div>

            <div className="form-btns">
              <button className="btn-cancel" onClick={() => setEditCustomModal(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={requestEditCustom}>Guardar</button>
            </div>
          </div>
        </div>
      ) : null}

      {customActionModal ? (
        <div className="modal-overlay open" onClick={() => setCustomActionModal(null)}>
          <div className="modal modal-scope" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              <span className="modal-title">
                {customActionModal.kind === "add"
                  ? "Agregar daily personalizada"
                  : customActionModal.kind === "edit"
                    ? "Editar daily personalizada"
                    : "Eliminar daily personalizada"}
              </span>
              <button
                className="modal-x"
                aria-label="Cerrar modal"
                onClick={() => setCustomActionModal(null)}
              >
                ×
              </button>
            </h3>
            <div className="scope-modal-body">
              <p className="scope-modal-text">
                {customActionModal.kind === "add"
                  ? `¿Cómo quieres agregar "${customActionModal.name}"?`
                  : customActionModal.kind === "edit"
                    ? `¿Cómo quieres editar "${customActionModal.name}"?`
                    : `¿Cómo quieres eliminar "${customActionModal.itemName}"?`}
              </p>
              <div className="scope-modal-actions">
                <button className="btn-scope-all" onClick={() => applyCustomAction("all")}>
                  Aplicar para todos los personajes
                </button>
                <button className="btn-confirm" onClick={() => applyCustomAction("active")}>
                  Aplicar para el personaje actual
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {instanceActionModal ? (
        <div className="modal-overlay open" onClick={() => setInstanceActionModal(null)}>
          <div className="modal modal-scope" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              <span className="modal-title">
                {instanceActionModal.kind === "add" ? "Agregar instancia" : "Eliminar instancia"}
              </span>
              <button
                className="modal-x"
                aria-label="Cerrar modal"
                onClick={() => setInstanceActionModal(null)}
              >
                ×
              </button>
            </h3>
            <div className="scope-modal-body">
              <p className="scope-modal-text">
                {instanceActionModal.kind === "add"
                  ? `¿Cómo quieres agregar "${instanceActionModal.item.name}"?`
                  : `¿Cómo quieres eliminar "${instanceActionModal.itemName}"?`}
              </p>
              <div className="scope-modal-actions">
                <button className="btn-scope-all" onClick={() => applyInstanceAction("all")}>
                  Aplicar para todos los personajes
                </button>
                <button className="btn-confirm" onClick={() => applyInstanceAction("active")}>
                  Aplicar para el personaje actual
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
