/**
 * DailyCallSheet — Printable daily crew call sheet.
 *
 * Auto-generated from schedule items for a given date.
 * Grouped by department, shows task, time, room, owner, crew count.
 * Includes general call time, meal break, estimated wrap, and producer notes.
 * Designed to be printed / posted on the production office wall.
 */
import { useState, useEffect, useMemo } from "react";
import {
  FileText, Clock, Coffee, Sunset, Printer, Edit3, Check, X,
  Loader2, AlertTriangle, Users, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getOrCreateDailyCall, updateDailyCall,
  DEPARTMENTS, STATUSES,
} from "./production-queries.js";

// ── Helpers ──────────────────────────────────────────

/** Format "HH:MM:SS" or "HH:MM" to "H:MM AM/PM" */
function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/** Format date to readable string */
function formatDateLong(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function findByValue(list, value) {
  return list.find((item) => item.value === value);
}

// ── Department Section ───────────────────────────────

function DeptSection({ dept, items, collapsed, onToggle }) {
  const totalCrew = items.reduce((sum, i) => sum + (i.crew_count || 0), 0);
  const completedCount = items.filter((i) => i.status === "completed").length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Department header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: dept.color }}
          />
          <span className="text-sm font-semibold text-gray-900">{dept.label}</span>
          <span className="text-xs text-gray-500">
            {items.length} task{items.length !== 1 ? "s" : ""}
          </span>
          {totalCrew > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <Users size={10} /> {totalCrew}
            </span>
          )}
          {completedCount === items.length && items.length > 0 && (
            <span className="text-xs text-green-600 font-medium">All complete</span>
          )}
        </div>
        {collapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
      </button>

      {/* Tasks */}
      {!collapsed && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-gray-200 bg-white">
              <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Time</th>
              <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Task</th>
              <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Owner</th>
              <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Location</th>
              <th className="text-right px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Crew</th>
              <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = findByValue(STATUSES, item.status);
              const location = item.location || item.rooms?.name || "—";
              return (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap text-xs">
                    {formatTime(item.start_time)} – {formatTime(item.end_time)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-gray-900 text-xs font-medium">{item.title}</div>
                    {item.notes && (
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {item.owner_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{location}</td>
                  <td className="px-4 py-2 text-xs text-gray-600 text-right">
                    {item.crew_count || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        color: status?.color,
                        backgroundColor: (status?.color || "#6B7280") + "15",
                      }}
                    >
                      {status?.label || item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function DailyCallSheet({
  scheduleId,
  eventId,
  eventName,
  venueName,
  selectedDate,
  items,
}) {
  const [dailyCall, setDailyCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collapsedDepts, setCollapsedDepts] = useState(new Set());

  // Editable fields
  const [callTime, setCallTime] = useState("07:00");
  const [mealTime, setMealTime] = useState("");
  const [wrapTime, setWrapTime] = useState("18:00");
  const [weatherNote, setWeatherNote] = useState("");
  const [notes, setNotes] = useState("");

  // Load daily call data
  useEffect(() => {
    if (!scheduleId || !selectedDate) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error: err } = await getOrCreateDailyCall(scheduleId, eventId, selectedDate);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setDailyCall(data);
      setCallTime(data.general_call?.slice(0, 5) || "07:00");
      setMealTime(data.meal_break_time?.slice(0, 5) || "");
      setWrapTime(data.estimated_wrap?.slice(0, 5) || "18:00");
      setWeatherNote(data.weather_note || "");
      setNotes(data.notes || "");
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [scheduleId, eventId, selectedDate]);

  // Group items by department, sorted by start time
  const departmentGroups = useMemo(() => {
    const dayItems = items.filter((i) => i.date === selectedDate);
    const groups = new Map();

    dayItems.forEach((item) => {
      const key = item.department || "other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    // Sort items within each group by start time
    groups.forEach((groupItems) => {
      groupItems.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    });

    // Sort departments by DEPARTMENTS order
    const deptOrder = DEPARTMENTS.map((d) => d.value);
    return [...groups.entries()]
      .sort((a, b) => {
        const ai = deptOrder.indexOf(a[0]);
        const bi = deptOrder.indexOf(b[0]);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
      .map(([key, groupItems]) => ({
        key,
        dept: findByValue(DEPARTMENTS, key) || { value: key, label: key, color: "#94A3B8" },
        items: groupItems,
      }));
  }, [items, selectedDate]);

  // Summary stats
  const stats = useMemo(() => {
    const dayItems = items.filter((i) => i.date === selectedDate);
    return {
      total: dayItems.length,
      totalCrew: dayItems.reduce((s, i) => s + (i.crew_count || 0), 0),
      departments: departmentGroups.length,
      completed: dayItems.filter((i) => i.status === "completed").length,
    };
  }, [items, selectedDate, departmentGroups]);

  // Save daily call edits
  const handleSave = async () => {
    if (!dailyCall) return;
    setSaving(true);
    const { data, error: err } = await updateDailyCall(dailyCall.id, {
      general_call: callTime || null,
      meal_break_time: mealTime || null,
      estimated_wrap: wrapTime || null,
      weather_note: weatherNote || null,
      notes: notes || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDailyCall(data);
    setEditing(false);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Toggle collapsed department
  const toggleDept = (key) => {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Call Sheet Header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-brand-500" />
              <h2 className="text-lg font-bold text-gray-900">Daily Call Sheet</h2>
            </div>
            <p className="text-sm text-gray-600">{eventName}</p>
            <p className="text-xs text-gray-400">{venueName || "Venue TBD"}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{formatDateLong(selectedDate)}</p>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Edit3 size={12} /> Edit
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 print:hidden"
            >
              <Printer size={12} /> Print
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 flex items-center gap-1.5">
            <AlertTriangle size={12} /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X size={10} /></button>
          </div>
        )}

        {/* Call Times */}
        <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-400">General Call</div>
              {editing ? (
                <input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)}
                  className="text-sm font-semibold text-gray-900 border border-gray-300 rounded px-2 py-0.5 w-28" />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{formatTime(callTime)}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coffee size={14} className="text-amber-500" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-400">Meal Break</div>
              {editing ? (
                <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)}
                  className="text-sm font-semibold text-gray-900 border border-gray-300 rounded px-2 py-0.5 w-28" />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{mealTime ? formatTime(mealTime) : "TBD"}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sunset size={14} className="text-orange-500" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-400">Est. Wrap</div>
              {editing ? (
                <input type="time" value={wrapTime} onChange={(e) => setWrapTime(e.target.value)}
                  className="text-sm font-semibold text-gray-900 border border-gray-300 rounded px-2 py-0.5 w-28" />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{formatTime(wrapTime)}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-green-500" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-400">Total Crew</div>
              <div className="text-sm font-semibold text-gray-900">{stats.totalCrew}</div>
            </div>
          </div>
        </div>

        {/* Weather / Notes (editable) */}
        {editing && (
          <div className="px-6 pb-3 space-y-2">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">Weather / Conditions</label>
              <input value={weatherNote} onChange={(e) => setWeatherNote(e.target.value)}
                placeholder="e.g. Outdoor — 95°F, UV high, hydration stations required"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">Producer Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Important notes for the day..."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50 flex items-center gap-1">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Save
              </button>
            </div>
          </div>
        )}

        {/* Display notes when not editing */}
        {!editing && (weatherNote || notes) && (
          <div className="px-6 pb-3 space-y-1">
            {weatherNote && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Weather:</span> {weatherNote}
              </p>
            )}
            {notes && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Notes:</span> {notes}
              </p>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
          <span><strong className="text-gray-900">{stats.total}</strong> tasks</span>
          <span><strong className="text-gray-900">{stats.departments}</strong> departments</span>
          <span><strong className="text-gray-900">{stats.completed}</strong>/{stats.total} complete</span>
        </div>
      </div>

      {/* Department Sections */}
      <div className="space-y-3">
        {departmentGroups.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No tasks scheduled for this date.
          </div>
        ) : (
          departmentGroups.map(({ key, dept, items: deptItems }) => (
            <DeptSection
              key={key}
              dept={dept}
              items={deptItems}
              collapsed={collapsedDepts.has(key)}
              onToggle={() => toggleDept(key)}
            />
          ))
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-6 pt-3 border-t border-gray-300 text-center text-[10px] text-gray-400">
        Generated by ShowHQ — {formatDateLong(selectedDate)} — {eventName}
      </div>
    </div>
  );
}
