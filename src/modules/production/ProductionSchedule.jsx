/**
 * ProductionSchedule — Day Sheet view for the production schedule.
 *
 * Shows schedule items as a filterable table grouped by time.
 * Columns: Time, Activity, Title, Owner, Location, Department, Status.
 * Supports add/edit/delete and filtering by date, department, phase.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardList, Plus, Filter, ChevronLeft, ChevronRight, Loader2,
  Trash2, Edit3, Check, X, Diamond, AlertTriangle, Calendar,
  LayoutList, LayoutGrid,
} from "lucide-react";
import { useOrg } from "../../shell/OrgProvider.jsx";
import {
  getOrCreateSchedule, getScheduleItems, createScheduleItem,
  updateScheduleItem, deleteScheduleItem, getMilestones,
  createMilestone, deleteMilestone, getEventRooms, getRehearsalSlots,
  PHASES, DEPARTMENTS, STATUSES,
} from "./production-queries.js";
import TimelineView from "./TimelineView.jsx";

// ── Helpers ──────────────────────────────────────────

/** Format time string "HH:MM:SS" or "HH:MM" to "H:MM AM/PM" */
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/** Format date to readable string */
function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

/** Get all dates between two dates (inclusive) */
function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Today as YYYY-MM-DD */
function today() {
  return new Date().toISOString().split("T")[0];
}

/** Lookup helper */
function findByValue(list, value) {
  return list.find((item) => item.value === value);
}

// ── Badge Component ──────────────────────────────────

function Badge({ label, color }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + "18", color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

// ── Add/Edit Form ────────────────────────────────────

const EMPTY_ITEM = {
  title: "", activity: "", description: "", phase: "setup",
  department: "production", date: today(), start_time: "08:00",
  end_time: "09:00", location: "", owner_name: "", status: "planned",
  priority: 2, crew_count: null, notes: "",
};

function ItemForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_ITEM);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
          <input value={form.title} onChange={set("title")} placeholder="Hang main truss"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Activity</label>
          <input value={form.activity || ""} onChange={set("activity")} placeholder="Rigging, Setup, Meeting..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Owner</label>
          <input value={form.owner_name || ""} onChange={set("owner_name")} placeholder="John Smith"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
          <input value={form.location || ""} onChange={set("location")} placeholder="Grand Ballroom, Loading Dock B"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Date *</label>
          <input type="date" value={form.date} onChange={set("date")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Start *</label>
          <input type="time" value={form.start_time} onChange={set("start_time")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">End *</label>
          <input type="time" value={form.end_time} onChange={set("end_time")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Phase</label>
          <select value={form.phase} onChange={set("phase")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Department</label>
          <select value={form.department} onChange={set("department")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Crew #</label>
          <input type="number" min={0} value={form.crew_count || ""} placeholder="—"
            onChange={(e) => setForm((f) => ({ ...f, crew_count: e.target.value ? parseInt(e.target.value, 10) : null }))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
        <textarea value={form.notes || ""} onChange={set("notes")} rows={2} placeholder="Optional notes..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg border border-gray-200">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim() || !form.date || !form.start_time || !form.end_time}
          className="px-4 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {initial ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function ProductionSchedule() {
  const { currentOrg, currentEvent } = useOrg();

  // State
  const [schedule, setSchedule] = useState(null);
  const [items, setItems] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // UI state
  const [viewMode, setViewMode] = useState("daysheet"); // "daysheet" | "timeline"
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterDept, setFilterDept] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Timeline-specific state
  const [rooms, setRooms] = useState([]);
  const [rehearsalSlots, setRehearsalSlots] = useState([]);

  // No event selected
  if (!currentEvent) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <Calendar size={32} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Select an event</h2>
        <p className="text-sm text-gray-500">Choose an event from the sidebar to view its production schedule.</p>
      </div>
    );
  }

  // Date range for navigation
  const eventDates = useMemo(() => {
    const start = currentEvent.load_in_date || currentEvent.start_date;
    const end = currentEvent.load_out_date || currentEvent.end_date;
    if (!start || !end) return [today()];
    return getDateRange(start, end);
  }, [currentEvent]);

  // Load data
  const loadData = useCallback(async () => {
    if (!currentEvent || !currentOrg) return;
    setLoading(true);
    setError("");

    const { data: sched, error: schedErr } = await getOrCreateSchedule(
      currentEvent.id, currentOrg.id, null
    );
    if (schedErr) {
      setError(schedErr.message);
      setLoading(false);
      return;
    }
    setSchedule(sched);

    const [itemsRes, milestonesRes, roomsRes, slotsRes] = await Promise.all([
      getScheduleItems(currentEvent.id),
      getMilestones(currentEvent.id),
      getEventRooms(currentEvent.id),
      getRehearsalSlots(currentEvent.id),
    ]);

    if (itemsRes.error) setError(itemsRes.error.message);
    setItems(itemsRes.data || []);
    setMilestones(milestonesRes.data || []);
    setRooms(roomsRes.data || []);
    setRehearsalSlots(slotsRes.data || []);
    setLoading(false);
  }, [currentEvent, currentOrg]);

  useEffect(() => {
    loadData();
    // Default to first event date
    if (!selectedDate && eventDates.length > 0) {
      setSelectedDate(eventDates[0]);
    }
  }, [loadData]);

  // Set default date when eventDates change
  useEffect(() => {
    if (!selectedDate && eventDates.length > 0) {
      setSelectedDate(eventDates[0]);
    }
  }, [eventDates, selectedDate]);

  // Unique owners and locations for filter dropdowns
  const uniqueOwners = useMemo(() => {
    return [...new Set(items.map((i) => i.owner_name).filter(Boolean))].sort();
  }, [items]);

  const uniqueLocations = useMemo(() => {
    const locs = items.map((i) => i.location || i.rooms?.name).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [items]);

  // Filtered items for the selected date
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedDate && item.date !== selectedDate) return false;
      if (filterDept && item.department !== filterDept) return false;
      if (filterPhase && item.phase !== filterPhase) return false;
      if (filterOwner && item.owner_name !== filterOwner) return false;
      if (filterLocation) {
        const loc = item.location || item.rooms?.name || "";
        if (loc !== filterLocation) return false;
      }
      return true;
    });
  }, [items, selectedDate, filterDept, filterPhase, filterOwner, filterLocation]);

  // Day milestones
  const dayMilestones = useMemo(() => {
    return milestones.filter((m) => m.date === selectedDate);
  }, [milestones, selectedDate]);

  // Stats
  const dayStats = useMemo(() => {
    const dayItems = items.filter((i) => i.date === selectedDate);
    const total = dayItems.length;
    const completed = dayItems.filter((i) => i.status === "completed").length;
    const delayed = dayItems.filter((i) => i.status === "delayed").length;
    return { total, completed, delayed };
  }, [items, selectedDate]);

  // ── Handlers ───────────────────────────────────────

  const handleAddItem = async (form) => {
    if (!schedule) return;
    setSaving(true);
    const { error: err } = await createScheduleItem({
      ...form,
      schedule_id: schedule.id,
      event_id: currentEvent.id,
      crew_count: form.crew_count || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false);
    loadData();
  };

  const handleUpdateItem = async (form) => {
    if (!editingItem) return;
    setSaving(true);
    const { error: err } = await updateScheduleItem(editingItem.id, {
      title: form.title,
      activity: form.activity,
      owner_name: form.owner_name,
      location: form.location,
      description: form.description,
      phase: form.phase,
      department: form.department,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      status: form.status,
      priority: form.priority,
      crew_count: form.crew_count || null,
      notes: form.notes,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditingItem(null);
    loadData();
  };

  const handleDeleteItem = async (id) => {
    const { error: err } = await deleteScheduleItem(id);
    if (err) { setError(err.message); return; }
    loadData();
  };

  const handleStatusChange = async (id, status) => {
    await updateScheduleItem(id, { status });
    loadData();
  };

  // Date navigation
  const dateIndex = eventDates.indexOf(selectedDate);
  const prevDate = () => dateIndex > 0 && setSelectedDate(eventDates[dateIndex - 1]);
  const nextDate = () => dateIndex < eventDates.length - 1 && setSelectedDate(eventDates[dateIndex + 1]);

  // ── Render ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} style={{ color: "#7C3AED" }} />
            Production Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{currentEvent.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("daysheet")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "daysheet" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutList size={14} /> Day Sheet
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "timeline" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={14} /> Timeline
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Date Navigator */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={prevDate} disabled={dateIndex <= 0}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-1 overflow-x-auto">
          {eventDates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                d === selectedDate
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>
        <button onClick={nextDate} disabled={dateIndex >= eventDates.length - 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day Stats */}
      <div className="flex gap-4 mb-4">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{dayStats.total}</span> items
        </div>
        {dayStats.completed > 0 && (
          <div className="text-sm text-green-600">
            <span className="font-semibold">{dayStats.completed}</span> completed
          </div>
        )}
        {dayStats.delayed > 0 && (
          <div className="text-sm text-red-600">
            <span className="font-semibold">{dayStats.delayed}</span> delayed
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Filter size={14} className="text-gray-400" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Phases</option>
          {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Owners</option>
          {uniqueOwners.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All Locations</option>
          {uniqueLocations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {(filterDept || filterPhase || filterOwner || filterLocation) && (
          <button
            onClick={() => { setFilterDept(""); setFilterPhase(""); setFilterOwner(""); setFilterLocation(""); }}
            className="text-xs text-brand-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <ItemForm
          initial={{ ...EMPTY_ITEM, date: selectedDate || today() }}
          onSave={handleAddItem}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}
      {editingItem && (
        <ItemForm
          initial={{
            title: editingItem.title,
            activity: editingItem.activity || "",
            owner_name: editingItem.owner_name || "",
            location: editingItem.location || "",
            description: editingItem.description || "",
            phase: editingItem.phase,
            department: editingItem.department,
            date: editingItem.date,
            start_time: editingItem.start_time?.slice(0, 5) || "08:00",
            end_time: editingItem.end_time?.slice(0, 5) || "09:00",
            status: editingItem.status,
            priority: editingItem.priority,
            crew_count: editingItem.crew_count,
            notes: editingItem.notes || "",
          }}
          onSave={handleUpdateItem}
          onCancel={() => setEditingItem(null)}
          saving={saving}
        />
      )}

      {/* Milestones */}
      {dayMilestones.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {dayMilestones.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
              <Diamond size={12} />
              {formatTime(m.time)} — {m.title}
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <TimelineView
          items={items}
          rehearsalSlots={rehearsalSlots}
          milestones={milestones}
          rooms={rooms}
          selectedDate={selectedDate}
          onItemClick={(item) => setEditingItem(item)}
        />
      )}

      {/* Day Sheet Table */}
      {viewMode === "daysheet" && filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No items for {formatDate(selectedDate)}</p>
          <button onClick={() => setShowForm(true)} className="text-sm text-brand-600 hover:underline mt-2">
            Add the first item
          </button>
        </div>
      ) : viewMode === "daysheet" ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-20 px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const dept = findByValue(DEPARTMENTS, item.department);
                const status = findByValue(STATUSES, item.status);
                const phase = findByValue(PHASES, item.phase);
                const location = item.location || item.rooms?.name || "—";

                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.activity || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{item.title}</div>
                      {item.notes && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{item.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.owner_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{location}</td>
                    <td className="px-4 py-3">
                      {dept && <Badge label={dept.label} color={dept.color} />}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none"
                        style={{ color: status?.color }}
                      >
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditingItem(item)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
