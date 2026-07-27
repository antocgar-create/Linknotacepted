import { useState, useEffect, useMemo } from "react";
import { Search, Upload, Plus, Trash2, X, Check, AlertCircle } from "lucide-react";

const STORAGE_KEY = "contacts:list";

export default function LinkedInCheck() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [importText, setImportText] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) setContacts(JSON.parse(res.value));
      } catch (e) {
        // no data yet
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setContacts(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      showToast("No se pudo guardar. Intenta de nuevo.");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const normalized = (s) => s.trim().toLowerCase();

  const addContact = (name, note) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const exists = contacts.some((c) => normalized(c.name) === normalized(trimmed));
    if (exists) return "dup";
    const entry = {
      id: Date.now() + Math.random().toString(36).slice(2, 7),
      name: trimmed,
      note: (note || "").trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    persist([entry, ...contacts]);
    return "ok";
  };

  const handleAddManual = () => {
    const result = addContact(newName, newNote);
    if (result === "dup") {
      showToast("Ya estaba en la lista");
    } else if (result === "ok") {
      showToast("Añadido");
      setNewName("");
      setNewNote("");
      setShowAdd(false);
    }
  };

  const handleImport = () => {
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    let added = 0;
    let dupes = 0;
    let working = [...contacts];
    for (const line of lines) {
      const parts = line.split(/\t|,/);
      const name = parts[0]?.trim();
      const note = parts.slice(1).join(", ").trim();
      if (!name) continue;
      const exists = working.some((c) => normalized(c.name) === normalized(name));
      if (exists) {
        dupes++;
        continue;
      }
      working = [
        {
          id: Date.now() + Math.random().toString(36).slice(2, 7),
          name,
          note,
          date: new Date().toISOString().slice(0, 10),
        },
        ...working,
      ];
      added++;
    }
    persist(working);
    showToast(`${added} añadidos${dupes ? `, ${dupes} ya existían` : ""}`);
    setImportText("");
    setShowImport(false);
  };

  const removeContact = (id) => {
    persist(contacts.filter((c) => c.id !== id));
    showToast("Eliminado");
  };

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalized(query);
    return contacts.filter((c) => normalized(c.name).includes(q));
  }, [query, contacts]);

  const queryIsClear = query.trim().length > 0 && matches.length === 0;

  return (
    <div className="min-h-screen bg-[#0A1A33] text-[#E8F0FE] flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-[#1E3A5F]">
        <h1 className="text-lg font-semibold tracking-tight">Antes de invitar</h1>
        <p className="text-xs text-[#8FAAD1] mt-1">
          {contacts.length} {contacts.length === 1 ? "contacto guardado" : "contactos guardados"}
        </p>
      </header>

      {/* Search */}
      <div className="px-5 pt-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E88B5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un nombre antes de invitar..."
            className="w-full bg-[#12274A] border border-[#1E3A5F] rounded-xl pl-10 pr-9 py-3 text-sm placeholder-[#6E88B5] focus:outline-none focus:ring-2 focus:ring-[#2E7DF6] focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E88B5]"
              aria-label="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {query.trim() && (
          <div
            className={`mt-3 rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
              queryIsClear
                ? "bg-[#0F2A1C] text-[#5FD98A] border border-[#1E4A32]"
                : "bg-[#2A140F] text-[#F5A28A] border border-[#4A241E]"
            }`}
          >
            {queryIsClear ? (
              <>
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Vía libre — no está en tu lista, puedes invitarlo.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Cuidado — {matches.length} coincidencia{matches.length > 1 ? "s" : ""} encontrada{matches.length > 1 ? "s" : ""}, ya lo intentaste antes.</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pt-4 flex gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#12274A] border border-[#1E3A5F] rounded-lg py-2.5 text-sm font-medium hover:bg-[#16305A] transition-colors"
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#12274A] border border-[#1E3A5F] rounded-lg py-2.5 text-sm font-medium hover:bg-[#16305A] transition-colors"
        >
          <Upload className="w-4 h-4" /> Importar Excel
        </button>
      </div>

      {/* List */}
      <div className="px-5 pt-5 pb-8 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-[#6E88B5] text-center pt-10">Cargando...</p>
        ) : contacts.length === 0 ? (
          <div className="text-center pt-14 px-4">
            <p className="text-sm text-[#8FAAD1]">
              Aún no tienes contactos guardados. Importa tu Excel o añade uno a mano.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(query.trim() ? matches : contacts).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between bg-[#12274A] border border-[#1E3A5F] rounded-lg px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-[#6E88B5] truncate">
                    {c.note ? `${c.note} · ` : "Sin empresa · "}{c.date}
                  </p>
                </div>
                <button
                  onClick={() => removeContact(c.id)}
                  className="text-[#6E88B5] hover:text-[#F5A28A] shrink-0 ml-3"
                  aria-label={`Eliminar ${c.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-20">
          <div className="bg-[#0F2245] w-full max-w-md rounded-t-2xl p-5 border-t border-[#1E3A5F]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Añadir contacto</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Cerrar">
                <X className="w-4 h-4 text-[#6E88B5]" />
              </button>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre"
              className="w-full bg-[#12274A] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#2E7DF6]"
              autoFocus
            />
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Empresa (opcional)"
              className="w-full bg-[#12274A] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2E7DF6]"
            />
            <button
              onClick={handleAddManual}
              className="w-full bg-[#2E7DF6] rounded-lg py-2.5 text-sm font-medium"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-20">
          <div className="bg-[#0F2245] w-full max-w-md rounded-t-2xl p-5 border-t border-[#1E3A5F]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Importar desde Excel</h2>
              <button onClick={() => setShowImport(false)} aria-label="Cerrar">
                <X className="w-4 h-4 text-[#6E88B5]" />
              </button>
            </div>
            <p className="text-xs text-[#6E88B5] mb-3">
              Selecciona en tu Excel las columnas de Nombre y Empresa juntas y pégalas aquí (una persona por línea). Se detectan duplicados automáticamente.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"Juan Pérez García\tAcme Corp\nMaría López Ruiz\tBanco Santander\n..."}
              rows={6}
              className="w-full bg-[#12274A] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2E7DF6] resize-none"
              autoFocus
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full bg-[#2E7DF6] disabled:opacity-40 rounded-lg py-2.5 text-sm font-medium"
            >
              Importar
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-[#E8F0FE] text-xs px-4 py-2 rounded-full border border-[#234270] z-30">
          {toast}
        </div>
      )}
    </div>
  );
}
