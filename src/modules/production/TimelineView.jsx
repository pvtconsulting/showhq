/**
 * TimelineView — Horizontal room-by-time grid for the production schedule.
 *
 * Rows = rooms (or departments when toggled). Columns = hourly time slots.
 * Schedule items render as colored blocks positioned by start/end time.
 * Rehearsal slots from StagePilot appear as locked purple blocks.
 * Milestones appear as diamond markers at their time position.
 */
import { useState, useMemo } from "react";
import {
  Lock, Diamond, Users, AlertTriangle,
} from "lucide-react";
import { DEPARTMENTS, STATUSES, PHASES } from "./production-queries.js";

// ── Constants ────────────────────────────────────────

/** Hour range displayed on the timeline (6 AM to 11 PM) */
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

/** Convert "HH:MM" or "HH:MM:SS" to fractional hours */
function timeToHours(t) {
  if (!t) return 0;
  const [h, m] = t.split(":");
  return parseInt(h, 10) + parseInt(m, 10) / 60;
}

/** Format hour number to "6 AM", "12 PM", etc. */
function formatHourLabel(hour) {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

/** Format "HH:MM:SS" to "H:MM AM/PM" */
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/** Calculate left% and width% for a time block on the grid */
function blockPosition(startTime, endTime) {
  const start = Math.max(timeToHours(startTime), START_HOUR);
  const end = Math.min(timeToHours(endTime), END_HOUR);
  if (end <= start) return null;
  const left = ((start - START_HOUR) / TOTAL_HOURS) * 100;
  const width = ((end - start) / TOTAL_HOURS) * 100;
  return { left: `${left}%`, width: `${width}%` };
}

/** Lookup helper */
function findByValue(list, value) {
  return list.find((item) => item.value === value);
}

// ── Block Component ──────────────────────────────────

function TimeBlock({ item, isRehearsal, onClick }) {
  const dept = findByValue(DEPARTMENTS, item.department);
  const status = findByValue(STATUSES, item.status);
  const pos = blockPosition(item.start_time, item.end_time);
  if (!pos) return null;

  const bgColor = isRehearsal
    ? "#6366F1"
    : dept?.color || "#6B7280";

  const isDelayed = item.status === "delayed";
  const isCompleted = item.status === "completed";

  return (
    <div
      className="absolute top-1 bottom-1 rounded-md cursor-pointer group overflow-hidden transition-shadow hover:shadow-md"
      style={{
        left: pos.left,
        width: pos.width,
        backgroundColor: bgColor + (isCompleted ? "30" : "20"),
        borderLeft: `3px solid ${bgColor}`,
        borderRight: isDelayed ? "3px solid #DC2626" : "none",
      }}
      onClick={onClick}
      title={`${item.title}${item.owner_name ? ` — ${item.owner_name}` : ""}  (${formatTime(item.start_time)} – ${formatTime(item.end_time)})`}
    >
      <div className="px-1.5 py-0.5 flex items-center gap-1 h-full min-w-0">
        {isRehearsal && <Lock size={10} className="shrink-0" style={{ color: bgColor }} />}
        <span
          className="text-[10px] font-medium truncate leading-tight"
          style={{ color: bgColor }}
        >
          {item.title}
        </span>
        {item.crew_count > 0 && (
          <span className="text-[9px] opacity-60 shrink-0 flex items-center gap-0.5" style={{ color: bgColor }}>
            <Users size={8} />{item.crew_count}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Milestone Marker ─────────────────────────────────

function MilestoneMarker({ milestone }) {
  const hours = timeToHours(milestone.time);
  if (hours < START_HOUR || hours > END_HOUR) return null;
  const left = ((hours - START_HOUR) / TOTAL_HOURS) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center z-10 pointer-events-auto"
      style={{ left: `${left}%` }}
      title={`${milestone.title} — ${formatTime(milestone.time)}`}
    >
      <div className="w-px h-full bg-amber-400 opacity-60" />
      <div className="absolute -top-1">
        <Diamond size={10} className="text-amber-500 fill-amber-500" />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function TimelineView({
  items,
  rehearsalSlots,
  milestones,
  rooms,
  selectedDate,
  onItemClick,
}) {
  const [groupBy, setGroupBy] = useState("room"); // "room" | "department"

  // Merge rehearsal slots into a compatible format
  const rehearsalItems = useMemo(() => {
    if (!rehearsalSlots || rehearsalSlots.length === 0) return [];
    return rehearsalSlots
      .filter((s) => s.date === selectedDate)
      .map((slot) => {
        const startHours = timeToHours(slot.start_time);
        const endMinutes = startHours * 60 + (slot.duration || 60);
        const endH = Math.floor(endMinutes / 60);
        const endM = Math.round(endMinutes % 60);
        const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

        // Extract session title from nested booking
        const booking = slot.bookings?.[0];
        const title = booking?.sessions?.title || "Rehearsal";

        return {
          id: `rehearsal-${slot.id}`,
          title,
          start_time: slot.start_time,
          end_time: endTime,
          department: "rehearsal",
          status: slot.status === "completed" ? "completed" : "planned",
          room_id: slot.room_id,
          is_locked: true,
          crew_count: null,
          owner_name: null,
        };
      });
  }, [rehearsalSlots, selectedDate]);

  // Filter items for selected date
  const dayItems = useMemo(() => {
    return items.filter((i) => i.date === selectedDate);
  }, [items, selectedDate]);

  // All items (production + rehearsal)
  const allItems = useMemo(() => [...dayItems, ...rehearsalItems], [dayItems, rehearsalItems]);

  // Day milestones
  const dayMilestones = useMemo(() => {
    return (milestones || []).filter((m) => m.date === selectedDate);
  }, [milestones, selectedDate]);

  // Group items by room or department
  const groups = useMemo(() => {
    if (groupBy === "room") {
      // Build room list — rooms from event_rooms + "Unassigned"
      const roomMap = new Map();
      (rooms || []).forEach((r) => {
        roomMap.set(r.id, { id: r.id, label: r.name, items: [] });
      });
      // Add "Unassigned" for items without a room
      roomMap.set(null, { id: null, label: "Unassigned", items: [] });

      allItems.forEach((item) => {
        const key = item.room_id || null;
        if (!roomMap.has(key)) {
          roomMap.set(key, { id: key, label: `Room ${key?.slice(0, 6) || "?"}`, items: [] });
        }
        roomMap.get(key).items.push(item);
      });

      // Only show rows that have items, plus event rooms
      return [...roomMap.values()].filter(
        (g) => g.items.length > 0 || (rooms || []).some((r) => r.id === g.id)
      );
    }

    // Group by department
    const deptMap = new Map();
    DEPARTMENTS.forEach((d) => {
      deptMap.set(d.value, { id: d.value, label: d.label, color: d.color, items: [] });
    });
    // Rehearsal pseudo-department
    deptMap.set("rehearsal", { id: "rehearsal", label: "Rehearsal", color: "#6366F1", items: [] });

    allItems.forEach((item) => {
      const key = item.department || "other";
      if (!deptMap.has(key)) {
        deptMap.set(key, { id: key, label: key, color: "#94A3B8", items: [] });
      }
      deptMap.get(key).items.push(item);
    });

    return [...deptMap.values()].filter((g) => g.items.length > 0);
  }, [allItems, rooms, groupBy]);

  // Conflict detection — items overlapping in same room
  const conflicts = useMemo(() => {
    const found = new Set();
    const roomItems = new Map();

    allItems.forEach((item) => {
      if (!item.room_id) return;
      if (!roomItems.has(item.room_id)) roomItems.set(item.room_id, []);
      roomItems.get(item.room_id).push(item);
    });

    roomItems.forEach((roomList) => {
      for (let i = 0; i < roomList.length; i++) {
        for (let j = i + 1; j < roomList.length; j++) {
          const a = roomList[i];
          const b = roomList[j];
          const aStart = timeToHours(a.start_time);
          const aEnd = timeToHours(a.end_time);
          const bStart = timeToHours(b.start_time);
          const bEnd = timeToHours(b.end_time);
          // Overlap: a starts before b ends AND b starts before a ends
          if (aStart < bEnd && bStart < aEnd) {
            found.add(a.id);
            found.add(b.id);
          }
        }
      }
    });
    return found;
  }, [allItems]);

  // Hour column headers
  const hourLabels = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hourLabels.push(h);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Group by:</span>
          <button
            onClick={() => setGroupBy("room")}
            className={`px-2 py-1 rounded ${groupBy === "room" ? "bg-brand-100 text-brand-700 font-medium" : "hover:bg-gray-100"}`}
          >
            Room
          </button>
          <button
            onClick={() => setGroupBy("department")}
            className={`px-2 py-1 rounded ${groupBy === "department" ? "bg-brand-100 text-brand-700 font-medium" : "hover:bg-gray-100"}`}
          >
            Department
          </button>
        </div>
        {conflicts.size > 0 && (
          <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertTriangle size={12} />
            {conflicts.size} overlapping items
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Hour Headers */}
          <div className="flex border-b border-gray-200">
            {/* Row label column */}
            <div className="w-36 shrink-0 px-3 py-2 bg-gray-50 border-r border-gray-200" />
            {/* Hour columns */}
            <div className="flex-1 relative flex">
              {hourLabels.map((h) => (
                <div
                  key={h}
                  className="border-r border-gray-100 text-[10px] text-gray-400 text-center py-2 font-medium"
                  style={{ width: `${100 / TOTAL_HOURS}%` }}
                >
                  {formatHourLabel(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {groups.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No items to display on the timeline
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id || "unassigned"} className="flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                {/* Row label */}
                <div className="w-36 shrink-0 px-3 py-3 border-r border-gray-200 flex items-center">
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {group.color && (
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {group.label}
                  </span>
                </div>

                {/* Timeline area */}
                <div className="flex-1 relative" style={{ minHeight: "40px" }}>
                  {/* Hour gridlines */}
                  {hourLabels.map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-r border-gray-50"
                      style={{ left: `${((h - START_HOUR) / TOTAL_HOURS) * 100}%` }}
                    />
                  ))}

                  {/* Milestones */}
                  {dayMilestones.map((m) => (
                    <MilestoneMarker key={m.id} milestone={m} />
                  ))}

                  {/* Time blocks */}
                  {group.items.map((item) => (
                    <TimeBlock
                      key={item.id}
                      item={item}
                      isRehearsal={item.is_locked || item.department === "rehearsal"}
                      onClick={() => !item.is_locked && onItemClick?.(item)}
                    />
                  ))}

                  {/* Conflict indicators */}
                  {group.items
                    .filter((item) => conflicts.has(item.id))
                    .map((item) => {
                      const pos = blockPosition(item.start_time, item.end_time);
                      if (!pos) return null;
                      return (
                        <div
                          key={`conflict-${item.id}`}
                          className="absolute top-0 bottom-0 pointer-events-none"
                          style={{ left: pos.left, width: pos.width }}
                        >
                          <div className="absolute inset-0 border-2 border-red-400 rounded-md opacity-60" />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <Lock size={9} className="text-indigo-500" /> Rehearsal (locked)
        </span>
        <span className="flex items-center gap-1">
          <Diamond size={9} className="text-amber-500 fill-amber-500" /> Milestone
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 border-2 border-red-400 rounded-sm inline-block" /> Conflict
        </span>
        {PHASES.slice(0, 5).map((p) => (
          <span key={p.value} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
