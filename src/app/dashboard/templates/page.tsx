"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  X, 
  Info,
  CheckCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  emoji: string;
  body: string;
  variants: string[];
  usageCount: number;
  lastEdited: string;
}

export default function TemplatesPage() {
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const [body, setBody] = useState("");
  
  // Load templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId("");
    setName("");
    setEmoji("💬");
    setBody("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (tpl: Template) => {
    setIsEditing(true);
    setEditingId(tpl.id);
    setName(tpl.name);
    setEmoji(tpl.emoji);
    setBody(tpl.body);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template? Any referencing rule will clear its template pointer.")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast("Template deleted successfully", "success");
        triggerRefresh();
      }
    } catch (err) {
      console.error("Delete template error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !body) return;

    const payload = {
      name,
      emoji,
      body,
      variants: [body] // scaffold with original as first variant
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(isEditing ? "Template updated" : "Template created", "success");
        setModalOpen(false);
        triggerRefresh();
      } else {
        showToast("Failed to save template", "error");
      }
    } catch (err) {
      console.error("Error saving template:", err);
    }
  };

  // JSON Export
  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href",     dataStr     );
      dlAnchorElem.setAttribute("download", "Quick Reply_templates.json");
      dlAnchorElem.click();
      showToast("Templates exported as JSON", "success");
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  // JSON Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Bulk post them to database
            let importCount = 0;
            for (const tpl of parsed) {
              if (tpl.name && tpl.body) {
                const res = await fetch("/api/templates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: tpl.name,
                    emoji: tpl.emoji || "💬",
                    body: tpl.body,
                    variants: tpl.variants || [tpl.body]
                  })
                });
                if (res.ok) importCount++;
              }
            }
            showToast(`Imported ${importCount} templates successfully`, "success");
            triggerRefresh();
          } else {
            showToast("Invalid JSON schema. Expected array of templates.", "error");
          }
        } catch (err) {
          console.error("Import error:", err);
          showToast("Failed to parse JSON file.", "error");
        }
      };
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl relative">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
            Auto-Reply Template Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compose and rotate message variants. Import or export libraries to reuse workspace layouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Hidden Import file picker */}
          <label className="inline-flex items-center gap-1 border border-[#dadce0] bg-white text-slate-700 px-3.5 py-2 rounded-full text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-sm active:scale-95 transition">
            <Upload className="h-3.5 w-3.5" />
            <span>Import</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              className="hidden" 
            />
          </label>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 border border-[#dadce0] bg-white text-slate-700 px-3.5 py-2 rounded-full text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-sm active:scale-95 transition"
            title="Export templates as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-google-blue hover:bg-google-blue-pressed text-xs font-semibold text-white px-5 py-2.5 shadow-sm transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Templates grid layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full h-40 border rounded-xl bg-white flex items-center justify-center text-xs text-slate-400">
            Fetching templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-[#dadce0] bg-white rounded-xl p-12 text-center">
            <FolderHeart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700">No Templates Available</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">Add templates to link with rules and fire replies.</p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1 rounded-full bg-google-blue text-xs font-semibold text-white px-5 py-2 shadow-sm"
            >
              Configure Template
            </button>
          </div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm hover:shadow-google-card transition flex flex-col justify-between"
            >
              <div className="space-y-3 text-left">
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg shrink-0">{tpl.emoji}</span>
                    <span className="font-display text-sm font-bold text-slate-800 truncate">{tpl.name}</span>
                  </div>
                  
                  <span className="bg-slate-100 border border-slate-150 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Used: {tpl.usageCount} times
                  </span>
                </div>

                {/* Body excerpt */}
                <p className="text-xs text-slate-650 leading-relaxed italic line-clamp-4 pr-1">
                  &ldquo;{tpl.body}&rdquo;
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 font-semibold">
                <span>Edited: {new Date(tpl.lastEdited).toLocaleDateString()}</span>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEditModal(tpl)}
                    className="rounded-full p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-750 transition"
                    title="Edit Template text"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="rounded-full p-1.5 hover:bg-red-50 text-slate-450 hover:text-accent-danger transition"
                    title="Delete Template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Modal Backdrop */}
          <div 
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          />

          {/* Modal Card content */}
          <form 
            onSubmit={handleSubmit}
            className="relative bg-white border border-[#dadce0] shadow-google-modal rounded-xl w-full max-w-lg p-6 space-y-4 text-left animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-slate-800">
                {isEditing ? "Modify Auto-Reply Template" : "Compose Auto-Reply Template"}
              </h3>
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Emoji Icon</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full text-center rounded-lg border border-slate-200 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[10px] font-bold uppercase text-slate-400">Template Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Creator discount"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-slate-400">Message Text Body</label>
                <span className="text-[9px] text-google-blue bg-blue-50 px-1 rounded">
                  {"{{commenter_name}}"} supported
                </span>
              </div>
              <textarea
                required
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose reply body here..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/15 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-google-blue hover:bg-google-blue-pressed px-5 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95"
              >
                {isEditing ? "Update Template" : "Add Template"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
