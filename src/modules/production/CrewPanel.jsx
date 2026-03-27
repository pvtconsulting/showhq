/**
 * CrewPanel — Side panel for managing crew assignments on a schedule item.
 *
 * Opened from the Day Sheet or Timeline when clicking a task's crew icon.
 * Shows assigned crew, allows adding/removing, and tracks confirmation status.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, X, Check, Loader2, Trash2, Phone, Mail,
  UserCheck, UserX, ChevronDown,
} from "lucide-react";
import {
  getCrewForItem, createCrewAssignment, updateCrewAssignment,
  deleteCrewAssignment, DEPARTMENTS, CREW_ROLES,
} from "./production-queries.js";

// ── Helpers ──────────────────────────────────────────

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function findByValue(list, value) {
  return list.find((item) => item.value === value);
}

// ── Add Crew Form ────────────────────────────────────

function AddCrewForm({ item, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    external_name: "",
    external_email: "",
    external_phone: "",
    role: "crew",
    department: item.department || "production",
    call_time: item.start_time?.slice(0, 5) || "08:00",
    notes: "",
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    if (!form.external_name.trim()) return;
    onSave({
      schedule_item_id: item.id,
      external_name: form.external_name.trim(),
      external_email: form.external_email.trim() || null,
      external_phone: form.external_phone.trim() || null,
      role: form.role,
      department: form.department,
      call_date: item.date,
      call_time: form.call_time || null,
      estimated_wrap: item.end_time || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Name *</label>
          <input value={form.external_name} onChange={set("external_name")} placeholder="John Smith"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Role</label>
          <select value={form.role} onChange={set("role")}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500">
            {CREW_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Email</label>
          <input value={form.external_email} onChange={set("external_email")} placeholder="john@crew.com" type="email"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Phone</label>
          <input value={form.external_phone} onChange={set("external_phone")} placeholder="(702) 555-1234"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Call Time</label>
          <input type="time" value={form.call_time} onChange={set("call_time")}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Department</label>
        <select value={form.department} onChange={set("department")}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500">
          {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-0.5">Notes</label>
        <input value={form.notes} onChange={set("notes")} placeholder="Optional notes..."
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !form.external_name.trim()}
          className="px-3 py-1 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded disabled:opacity-50 flex items-center gap-1">
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Crew Row ─────────────────────────────────────────

function CrewRow({ crew, onToggleConfirm, onToggleCheckIn, onDelete, deleting }) {
  const name = crew.profiles?.full_name || crew.external_name || "Unknown";
  const dept = findByValue(DEPARTMENTS, crew.department);
  const role = CREW_ROLES.find((r) => r.value === crew.role);

  return (
    <div className="flex items-center gap-2 py-2 px-3 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50 transition-colors">
      {/* Confirmation indicator */}
      <button
        onClick={() => onToggleConfirm(crew)}
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
          crew.confirmed
            ? "bg-green-100 border-green-300 text-green-600"
            : "bg-gray-100 border-gray-200 text-gray-400 hover:border-gray-300"
        }`}
        title={crew.confirmed ? "Confirmed — click to unconfirm" : "Click to confirm"}
      >
        {crew.confirmed ? <UserCheck size={12} /> : <UserX size={12} />}
      </button>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-900 truncate">{name}</span>
          {role && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
              {role.label}
            </span>
          )}
          {dept && (
            <span className="text-[10px] font-medium" style={{ color: dept.color }}>
              {dept.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
          {crew.call_time && <span>Call: {formatTime(crew.call_time)}</span>}
          {crew.external_email && (
            <span className="flex items-center gap-0.5"><Mail size={8} />{crew.external_email}</span>
          )}
          {crew.external_phone && (
            <span className="flex items-center gap-0.5"><Phone size={8} />{crew.external_phone}</span>
          )}
          {crew.notes && <span className="truncate max-w-[120px]">{crew.notes}</span>}
        </div>
      </div>

      {/* Check-in */}
      <button
        onClick={() => onToggleCheckIn(crew)}
        className={`shrink-0 text-[10px] px-2 py-1 rounded font-medium transition-colors ${
          crew.checked_in
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
        }`}
        title={crew.checked_in ? "Checked in — click to undo" : "Click to check in"}
      >
        {crew.checked_in ? "Checked In" : "Check In"}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(crew.id)}
        disabled={deleting}
        className="shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function CrewPanel({ item, onClose }) {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const dept = findByValue(DEPARTMENTS, item.department);

  // Load crew
  const loadCrew = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await getCrewForItem(item.id);
    if (err) setError(err.message);
    setCrew(data || []);
    setLoading(false);
  }, [item.id]);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  // Add crew
  const handleAdd = async (assignment) => {
    setSaving(true);
    const { error: err } = await createCrewAssignment(assignment);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowAddForm(false);
    loadCrew();
  };

  // Toggle confirmed
  const handleToggleConfirm = async (member) => {
    await updateCrewAssignment(member.id, { confirmed: !member.confirmed });
    loadCrew();
  };

  // Toggle check-in
  const handleToggleCheckIn = async (member) => {
    const checked_in = !member.checked_in;
    await updateCrewAssignment(member.id, {
      checked_in,
      checked_in_at: checked_in ? new Date().toISOString() : null,
    });
    loadCrew();
  };

  // Delete crew
  const handleDelete = async (id) => {
    setDeleting(true);
    const { error: err } = await deleteCrewAssignment(id);
    setDeleting(false);
    if (err) { setError(err.message); return; }
    loadCrew();
  };

  // Stats
  const confirmed = crew.filter((c) => c.confirmed).length;
  const checkedIn = crew.filter((c) => c.checked_in).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-full max-w-md">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-gray-900">Crew Assignments</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{item.title}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
            <span>{formatTime(item.start_time)} – {formatTime(item.end_time)}</span>
            {dept && <span style={{ color: dept.color }}>{dept.label}</span>}
            {item.location && <span>{item.location}</span>}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X size={14} />
        </button>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-4 text-[10px] text-gray-500">
        <span><strong className="text-gray-900">{crew.length}</strong> assigned</span>
        <span><strong className="text-green-600">{confirmed}</strong> confirmed</span>
        <span><strong className="text-blue-600">{checkedIn}</strong> checked in</span>
        {item.crew_count && (
          <span>
            Need: <strong className={crew.length >= item.crew_count ? "text-green-600" : "text-amber-600"}>
              {item.crew_count}
            </strong>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded px-2 py-1 flex items-center gap-1">
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={8} /></button>
        </div>
      )}

      {/* Crew list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        ) : crew.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">
            No crew assigned yet
          </div>
        ) : (
          crew.map((member) => (
            <CrewRow
              key={member.id}
              crew={member}
              onToggleConfirm={handleToggleConfirm}
              onToggleCheckIn={handleToggleCheckIn}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))
        )}
      </div>

      {/* Add form or button */}
      <div className="px-4 py-3 border-t border-gray-100">
        {showAddForm ? (
          <AddCrewForm
            item={item}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg border border-dashed border-brand-200 transition-colors"
          >
            <Plus size={12} /> Add Crew Member
          </button>
        )}
      </div>
    </div>
  );
}
