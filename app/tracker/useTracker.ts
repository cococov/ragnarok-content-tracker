import { useEffect, useMemo, useState } from "react";
import { BASE_CATEGORIES, DB_INSTANCES, getDefaultState, STORAGE_KEY } from "./constants";
import type { AppState, CharState, Instance, TrackerItem } from "./types";
import { getNextResetLabel, mapCooldown, remaining } from "./utils";

export function useTracker() {
  const [state, setState] = useState<AppState>(getDefaultState());
  const [mounted, setMounted] = useState(false);
  const [storageMode, setStorageMode] = useState<"local" | "db" | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCd, setFormCd] = useState("24");
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
          setState(syncGlobalInstanceNames(loaded));
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
          setState(syncGlobalInstanceNames(loaded));
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

    state.globalAdded.forEach((item) => {
      if (state.globalRemoved.includes(item.id)) return;
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
      cat.items = cat.items.filter((i) => !state.globalRemoved.includes(i.id));
    });

    return result;
  }, [state.globalAdded, state.globalRemoved]);

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
      if (instances[item.id]) {
        // Allow manual reset by clicking a checked instance.
        delete instances[item.id];
      } else if (r <= 0) {
        instances[item.id] = Date.now();
      }

      return { ...ch, instances };
    });
  }

  function addNewGlobalInstance(item: Instance) {
    const already = categories.some((cat) =>
      cat.items.some((i) => i.id === item.id || i.wiki === item.wiki),
    );
    if (already) return;

    const newItem: TrackerItem = {
      id: item.id,
      name: item.name,
      ...mapCooldown(item.cooldownCategory),
      wiki: item.wiki,
      coins: item.coins,
    };

    setState((prev) => ({
      ...prev,
      globalRemoved: prev.globalRemoved.filter((x) => x !== newItem.id),
      globalAdded: prev.globalAdded.some((x) => x.id === newItem.id)
        ? prev.globalAdded
        : [...prev.globalAdded, newItem],
    }));
  }

  function addCustom() {
    const cdHours = parseFloat(formCd) || 24;
    if (!formName.trim()) return;

    updateActiveChar((ch) => ({
      ...ch,
      custom: [
        ...ch.custom,
        {
          id: `ci${Date.now()}`,
          name: formName.trim(),
          cd: Math.round(cdHours * 3600),
          cdLabel: cdHours === 24 ? "1 día" : cdHours === 168 ? "7 días" : `${cdHours}h`,
          note: formNote.trim(),
          doneAt: null,
        },
      ],
    }));

    setFormName("");
    setFormCd("24");
    setFormNote("");
    setShowAddForm(false);
  }

  function toggleCustom(itemId: string) {
    updateActiveChar((ch) => ({
      ...ch,
      custom: ch.custom.map((i) => {
        if (i.id !== itemId) return i;
        // Allow manual reset by clicking a checked custom daily.
        return { ...i, doneAt: i.doneAt ? null : Date.now() };
      }),
    }));
  }

  function removeGlobal(id: string) {
    if (!confirm("¿Seguro que quieres remover esta instancia de tu lista?")) return;
    setState((prev) => ({
      ...prev,
      globalRemoved: prev.globalRemoved.includes(id)
        ? prev.globalRemoved
        : [...prev.globalRemoved, id],
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
  };
}

function syncGlobalInstanceNames(state: AppState): AppState {
  const byId = new Map(DB_INSTANCES.map((instance) => [instance.id, instance]));
  let changed = false;

  const globalAdded = state.globalAdded.map((item) => {
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
      changed = true;
    }

    return next;
  });

  if (!changed) return state;
  return { ...state, globalAdded };
}
