"use client";

import { useState } from "react";
import { useTracker } from "./tracker/useTracker";
import type { Instance } from "./tracker/types";
import { fmt, remaining } from "./tracker/utils";
import { AuthNav } from "./auth-nav";

type InstanceActionModalState =
  | { kind: "add"; item: Instance }
  | { kind: "remove"; itemId: string; itemName: string }
  | null;

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
    formCd,
    setFormCd,
    formNote,
    setFormNote,
    addChar,
    updateActiveChar,
    toggleInstance,
    addNewGlobalInstance,
    addCustom,
    toggleCustom,
    removeGlobal,
    resetCharacter,
  } = useTracker();
  const [instanceActionModal, setInstanceActionModal] = useState<InstanceActionModalState>(null);

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
                  <div key={item.id} className={`custom-row ${isDone ? "done" : ""}`}>
                    <button className="icon-btn chk-btn" onClick={() => toggleCustom(item.id)}>{isDone ? "✓" : ""}</button>
                    <div className="custom-body">
                      <input
                        className="custom-name-input-react"
                        value={item.name}
                        onChange={(e) =>
                          updateActiveChar((char) => ({
                            ...char,
                            custom: char.custom.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)),
                          }))
                        }
                      />
                      {item.note ? <span className="note-badge">{item.note}</span> : null}
                    </div>
                    <div className="custom-right">
                      <span className={`pill ${isDone ? "active" : "idle"}`}>{isDone ? fmt(r) : `CD: ${item.cdLabel}`}</span>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          updateActiveChar((char) => ({
                            ...char,
                            custom: char.custom.filter((x) => x.id !== item.id),
                          }))
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showAddForm ? (
              <div className="add-form open">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Nombre de la Daily</label>
                    <input className="form-input" placeholder="Ej: Boost XP, Evento..." value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Cooldown (horas)</label>
                    <input className="form-input" type="number" min={0.1} step={0.5} value={formCd} onChange={(e) => setFormCd(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Observación (opcional)</label>
                    <input className="form-input" value={formNote} onChange={(e) => setFormNote(e.target.value)} maxLength={60} />
                  </div>
                </div>
                <div className="form-btns">
                  <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancelar</button>
                  <button className="btn-confirm" onClick={addCustom}>Guardar</button>
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
              <input className="search-input" placeholder="Escribe el nombre de la instancia..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
