import { useEffect, useMemo, useState } from "react";
import { BASE_CATEGORIES, DB_INSTANCES, getDefaultState, STORAGE_KEY } from "./constants";
import type { AppState, CharState, Instance, TrackerItem } from "./types";
import { getNextResetLabel, mapCooldown, remaining } from "./utils";

type ApplyScope = "active" | "all";

export function useTracker() {
  const [state, setState] = useState<AppState>(getDefaultState());
  const [mounted, setMounted] = useState(false);
  const [storageMode, setStorageMode] = useState<"local" | "db" | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDays, setFormDays] = useState("1");
  const [formHours, setFormHours] = useState("0");
  const [formNote, setFormNote] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const meRes = await fetch("/api/me", { cache: "no-store" });
        const meData = (await meRes.json()) as { user?: { id: string } | null };

        if (meData.user?.id) {
          if (cancelled) return;
          setStorageMode("db");

          const remoteRes = await fetch("/api/tracker-state", { cache: "no-store" });
          if (!remoteRes.ok) throw new Error("Failed to load remote tracker state");
          const remoteData = (await remoteRes.json()) as { state?: AppState };

          if (cancelled) return;
          const loaded = remoteData.state
            ? { ...getDefaultState(), ...remoteData.state }
            : getDefaultState();
          setState(normalizeState(syncGlobalInstanceNames(loaded)));
          setMounted(true);
          return;
        }
      } catch {
        // Fall back to local mode.
      }

      if (cancelled) return;
      setStorageMode("local");
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const loaded = { ...getDefaultState(), ...(JSON.parse(raw) as AppState) };
          setState(normalizeState(syncGlobalInstanceNames(loaded)));
        }
      } catch {
        // ignore local parse errors
      }
      setMounted(true);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted || !storageMode) return;

    if (storageMode === "local") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetch("/api/tracker-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).catch(() => {
        // Silent fail: keep UI responsive; next write can retry.
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mounted, storageMode, state]);

  const activeChar = useMemo(
    () => state.chars.find((c) => c.id === state.activeChar) ?? state.chars[0],
    [state],
  );

  const categories = useMemo(() => {
    const result = structuredClone(BASE_CATEGORIES);
    const byId = new Map(DB_INSTANCES.map((instance) => [instance.id, instance]));
    const addedInstances = activeChar.addedInstances ?? [];
    const removedInstanceIds = activeChar.removedInstanceIds ?? [];

    addedInstances.forEach((item) => {
      if (removedInstanceIds.includes(item.id)) return;
      const canonical = byId.get(item.id);
      const mergedItem: TrackerItem = canonical
        ? {
            ...item,
            name: canonical.name,
            wiki: canonical.wiki,
            coins: canonical.coins ?? item.coins,
          }
        : item;

      const target =
        mergedItem.cdLabel.includes("3 días") || mergedItem.cdLabel.includes("7 días")
          ? result[0]
          : mergedItem.cdLabel.includes("horas")
            ? result[2]
            : result[1];

      if (!target.items.some((i) => i.id === mergedItem.id || i.wiki === mergedItem.wiki)) {
        target.items.push(mergedItem);
      }
    });

    result.forEach((cat) => {
      cat.items = cat.items.filter((i) => !removedInstanceIds.includes(i.id));
    });

    return result;
  }, [activeChar.addedInstances, activeChar.removedInstanceIds, activeChar.id]);

  const totalMain = categories.reduce((sum, c) => sum + c.items.length, 0);
  const doneMain = categories.reduce(
    (sum, c) => sum + c.items.filter((i) => remaining(activeChar.instances[i.id], i.cd) > 0).length,
    0,
  );
  const doneCustom = activeChar.custom.filter((i) => remaining(i.doneAt, i.cd) > 0).length;
  const total = totalMain + activeChar.custom.length;
  const done = doneMain + doneCustom;
  const percent = total ? (done / total) * 100 : 0;

  const nextResetLabel = useMemo(() => getNextResetLabel(now), [now]);

  const hasSecondPrecisionTimer = useMemo(() => {
    const mainHas = categories.some((category) =>
      category.items.some((item) => {
        const r = remaining(activeChar.instances[item.id], item.cd);
        return r > 0 && r < 3600;
      }),
    );
    if (mainHas) return true;

    return activeChar.custom.some((item) => {
      const r = remaining(item.doneAt, item.cd);
      return r > 0 && r < 3600;
    });
  }, [activeChar, categories, now]);

  useEffect(() => {
    const tickMs = hasSecondPrecisionTimer && !showSearchModal ? 1000 : 30000;
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [hasSecondPrecisionTimer, showSearchModal]);

  const filteredSearch = useMemo(() => {
    const q = search.toLowerCase();
    return DB_INSTANCES.filter((i) => i.name.toLowerCase().includes(q));
  }, [search]);

  function updateActiveChar(updater: (char: CharState) => CharState) {
    setState((prev) => ({
      ...prev,
      chars: prev.chars.map((c) => (c.id === prev.activeChar ? updater(c) : c)),
    }));
  }

  function addChar() {
    const id = `c${Date.now()}`;
    setState((prev) => ({
      ...prev,
      activeChar: id,
      chars: [
        ...prev.chars,
        {
          id,
          name: `Personaje ${prev.chars.length + 1}`,
          instances: {},
          notes: {},
          custom: [],
          addedInstances: [],
          removedInstanceIds: [],
          collapsed: {},
          order: {},
        },
      ],
    }));
  }

  function toggleInstance(item: TrackerItem) {
    updateActiveChar((ch) => {
      const r = remaining(ch.instances[item.id], item.cd);
      const instances = { ...ch.instances };
      if (r > 0) {
        // Allow manual reset by clicking a checked instance.
        delete instances[item.id];
      } else {
        instances[item.id] = Date.now();
      }

      return { ...ch, instances };
    });
  }

  function addNewGlobalInstance(item: Instance, scope: ApplyScope = "active") {
    const already = categories.some((cat) =>
      cat.items.some((i) => i.id === item.id || i.wiki === item.wiki),
    );
    if (scope === "active" && already) return;

    const newItem: TrackerItem = {
      id: item.id,
      name: item.name,
      ...mapCooldown(item.cooldownCategory),
      wiki: item.wiki,
      coins: item.coins,
    };

    if (scope === "all") {
      setState((prev) => ({
        ...prev,
        chars: prev.chars.map((ch) => ({
          ...ch,
          removedInstanceIds: (ch.removedInstanceIds ?? []).filter((x) => x !== newItem.id),
          addedInstances: (ch.addedInstances ?? []).some((x) => x.id === newItem.id)
            ? (ch.addedInstances ?? [])
            : [...(ch.addedInstances ?? []), newItem],
        })),
      }));
      return;
    }

    updateActiveChar((ch) => ({
      ...ch,
      removedInstanceIds: (ch.removedInstanceIds ?? []).filter((x) => x !== newItem.id),
      addedInstances: (ch.addedInstances ?? []).some((x) => x.id === newItem.id)
        ? (ch.addedInstances ?? [])
        : [...(ch.addedInstances ?? []), newItem],
    }));
  }

  function addCustom() {
    const days = Math.max(0, Math.floor(parseInt(formDays, 10) || 0));
    const hours = Math.max(0, Math.floor(parseInt(formHours, 10) || 0));
    const cdHours = days * 24 + hours;
    if (!formName.trim()) return;
    if (cdHours <= 0) return;
    const cdLabel =
      Number.isInteger(cdHours) && cdHours % 24 === 0
        ? cdHours / 24 === 1
          ? "1 día"
          : `${cdHours / 24} días`
        : `${cdHours}h`;

    updateActiveChar((ch) => ({
      ...ch,
      custom: [
        ...ch.custom,
        {
          id: `ci${Date.now()}`,
          name: formName.trim(),
          cd: Math.round(cdHours * 3600),
          cdLabel,
          note: formNote.trim(),
          doneAt: null,
        },
      ],
    }));

    setFormName("");
    setFormDays("1");
    setFormHours("0");
    setFormNote("");
    setShowAddForm(false);
  }

  function toggleCustom(itemId: string) {
    updateActiveChar((ch) => ({
      ...ch,
      custom: ch.custom.map((i) => {
        if (i.id !== itemId) return i;
        const r = remaining(i.doneAt, i.cd);
        // Allow manual reset by clicking a checked custom daily.
        return { ...i, doneAt: r > 0 ? null : Date.now() };
      }),
    }));
  }

  function setInstanceDoneAt(itemId: string, doneAt: number | null) {
    updateActiveChar((ch) => {
      const instances = { ...ch.instances };
      if (doneAt === null) {
        delete instances[itemId];
      } else {
        instances[itemId] = doneAt;
      }
      return { ...ch, instances };
    });
  }

  function setCustomDoneAt(itemId: string, doneAt: number | null) {
    updateActiveChar((ch) => ({
      ...ch,
      custom: ch.custom.map((i) => (i.id === itemId ? { ...i, doneAt } : i)),
    }));
  }

  function removeGlobal(id: string, scope: ApplyScope = "active") {
    if (scope === "all") {
      setState((prev) => ({
        ...prev,
        chars: prev.chars.map((ch) => ({
          ...ch,
          removedInstanceIds: (ch.removedInstanceIds ?? []).includes(id)
            ? (ch.removedInstanceIds ?? [])
            : [...(ch.removedInstanceIds ?? []), id],
        })),
      }));
      return;
    }

    updateActiveChar((ch) => ({
      ...ch,
      removedInstanceIds: (ch.removedInstanceIds ?? []).includes(id)
        ? (ch.removedInstanceIds ?? [])
        : [...(ch.removedInstanceIds ?? []), id],
    }));
  }

  function resetCharacter() {
    if (!confirm(`¿Resetear todo el progreso de ${activeChar.name}?`)) return;
    updateActiveChar((ch) => ({
      ...ch,
      instances: {},
      custom: ch.custom.map((i) => ({ ...i, doneAt: null })),
    }));
  }

  return {
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
    addCustom,
    toggleCustom,
    setInstanceDoneAt,
    setCustomDoneAt,
    removeGlobal,
    resetCharacter,
  };
}

function syncGlobalInstanceNames(state: AppState): AppState {
  const byId = new Map(DB_INSTANCES.map((instance) => [instance.id, instance]));
  let changed = false;

  const chars = state.chars.map((char) => {
    const sourceAdded = getLegacyGlobalAdded(state, char);
    const sourceRemoved = getLegacyGlobalRemoved(state, char);
    let charChanged =
      sourceAdded !== char.addedInstances || sourceRemoved !== char.removedInstanceIds;

    const addedInstances = sourceAdded.map((item) => {
      const canonical = byId.get(item.id);
      if (!canonical) return item;

      const next: TrackerItem = {
        ...item,
        name: canonical.name,
        wiki: canonical.wiki,
        coins: canonical.coins ?? item.coins,
      };

      if (
        next.name !== item.name ||
        next.wiki !== item.wiki ||
        next.coins !== item.coins
      ) {
        charChanged = true;
      }

      return next;
    });

    if (!charChanged) return char;
    changed = true;

    return {
      ...char,
      addedInstances,
      removedInstanceIds: sourceRemoved,
    };
  });

  if (!changed) return state;
  return { ...state, chars };
}

function normalizeState(state: AppState): AppState {
  let changed = false;
  const chars = state.chars.map((char) => {
    const addedInstances = char.addedInstances ?? [];
    const removedInstanceIds = char.removedInstanceIds ?? [];
    if (char.addedInstances || char.removedInstanceIds) return char;
    changed = true;
    return { ...char, addedInstances, removedInstanceIds };
  });

  if (!changed) return state;
  return { ...state, chars };
}

function getLegacyGlobalAdded(state: AppState, char: CharState): TrackerItem[] {
  if (char.addedInstances) return char.addedInstances;
  const legacy = (state as AppState & { globalAdded?: TrackerItem[] }).globalAdded;
  return legacy ?? [];
}

function getLegacyGlobalRemoved(state: AppState, char: CharState): string[] {
  if (char.removedInstanceIds) return char.removedInstanceIds;
  const legacy = (state as AppState & { globalRemoved?: string[] }).globalRemoved;
  return legacy ?? [];
}
