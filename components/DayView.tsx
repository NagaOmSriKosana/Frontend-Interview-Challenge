/**
 * DayView Component
 *
 * Displays appointments for a single day in a timeline format.
 *
 * TODO for candidates:
 * 1. Generate time slots (8 AM - 6 PM, 30-minute intervals)
 * 2. Position appointments in their correct time slots
 * 3. Handle appointments that span multiple slots
 * 4. Display appointment details (patient, type, duration)
 * 5. Color-code appointments by type
 * 6. Handle overlapping appointments gracefully
 */

'use client';

import type { Appointment, Doctor, TimeSlot, PopulatedAppointment } from '@/types';
import { DEFAULT_CALENDAR_CONFIG } from '@/types';
import { format, addMinutes, isBefore, isAfter, parseISO, differenceInMinutes } from 'date-fns';
import { useRef, useEffect, useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import AppointmentCard from './AppointmentCard';

interface DayViewProps {
  appointments: Appointment[];
  doctor: Doctor | undefined;
  date: Date;
}

/**
 * DayView Component
 *
 * Renders a daily timeline view with appointments.
 *
 * TODO: Implement this component
 *
 * Architecture suggestions:
 * 1. Create a helper function to generate time slots
 * 2. Create a TimeSlotRow component for each time slot
 * 3. Create an AppointmentCard component for each appointment
 * 4. Calculate appointment positioning based on start/end times
 *
 * Consider:
 * - How to handle appointments that span multiple 30-min slots?
 * - How to show overlapping appointments?
 * - How to make the timeline scrollable if needed?
 * - How to highlight the current time?
 */
export function DayView({ appointments, doctor, date }: DayViewProps) {
  /**
   * TODO: Generate time slots
   *
   * Create an array of TimeSlot objects from 8 AM to 6 PM
   * with 30-minute intervals
   *
   * Hint: You can use a loop or date-fns utilities
   */
  function generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const { startHour, endHour, slotDuration } = DEFAULT_CALENDAR_CONFIG;
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);

    for (let mins = 0; mins < (endHour - startHour) * 60; mins += slotDuration) {
      const slotStart = addMinutes(start, mins);
      const slotEnd = addMinutes(slotStart, slotDuration);
      slots.push({ start: slotStart, end: slotEnd, label: format(slotStart, 'p') });
    }

    return slots;
  }

  /**
   * TODO: Find appointments for a specific time slot
   *
   * Given a time slot, find all appointments that overlap with it
   */
  // We'll layout appointments for the whole day to avoid duplicate renderings per slot
  const dayStart = new Date(date);
  dayStart.setHours(DEFAULT_CALENDAR_CONFIG.startHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(DEFAULT_CALENDAR_CONFIG.endHour, 0, 0, 0);

  const dayAppointments = appointments
    .filter((apt) => {
      const s = parseISO(apt.startTime);
      const e = parseISO(apt.endTime);
      return s < dayEnd && e > dayStart;
    })
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());

  // Robust pixel-based interval partitioning. We compute column assignment
  // (minimum columns) and then, once we know the container width, convert
  // columns into pixel left/width using a fixed gutter in px. This removes
  // percent-vs-pixel mismatch and avoids overlap caused by padding.
  function layoutAppointments(apts: typeof dayAppointments) {
    const placed: Record<string, { leftPx?: number; widthPx?: number; col: number; cols: number }> = {};

    // columnsEnd stores the current end time (ms) for each column
    const columnsEnd: number[] = [];
    const appointmentColumn: Record<string, number> = {};

    for (const apt of apts) {
      const sMs = parseISO(apt.startTime).getTime();
      const eMs = parseISO(apt.endTime).getTime();

      let assigned = -1;
      for (let i = 0; i < columnsEnd.length; i++) {
        if (columnsEnd[i] <= sMs) {
          assigned = i;
          break;
        }
      }

      if (assigned === -1) {
        columnsEnd.push(eMs);
        assigned = columnsEnd.length - 1;
      } else {
        columnsEnd[assigned] = eMs;
      }

      appointmentColumn[apt.id] = assigned;
    }

    const totalCols = columnsEnd.length || 1;
    for (const apt of apts) {
      const col = appointmentColumn[apt.id];
      placed[apt.id] = { col, cols: totalCols };
    }

    return placed;
  }

  const layout = layoutAppointments(dayAppointments);

  const PIXELS_PER_MINUTE = 1; // 1px per minute for simple mapping

  // measure container width for pixel math
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    function measure() {
      const w = timelineRef.current?.clientWidth || 0;
      setContainerWidth(w);
    }

    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => measure());
      if (timelineRef.current) ro.observe(timelineRef.current);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const timeSlots = generateTimeSlots();

  return (
    <div className="day-view">
      {/* Day header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {/* TODO: Format date nicely (e.g., "Monday, October 15, 2024") */}
          {date.toDateString()}
        </h3>
        {doctor && (
          <p className="text-sm text-gray-600">
            {`Dr. ${doctor.name}`} - {doctor.specialty.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        )}
      </div>

      {/* Timeline grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex">
          <div className="w-24 p-2">
            <div className="space-y-6">
              {timeSlots.map((slot, i) => (
                <div key={i} className="text-sm text-gray-600" style={{ height: `${DEFAULT_CALENDAR_CONFIG.slotDuration}px` }}>
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          <div ref={timelineRef} className="flex-1 p-2 relative" style={{ height: `${(DEFAULT_CALENDAR_CONFIG.endHour - DEFAULT_CALENDAR_CONFIG.startHour) * 60 * PIXELS_PER_MINUTE}px` }}>
            {dayAppointments.map((apt) => {
              const populated = appointmentService.getPopulatedAppointment(apt) as PopulatedAppointment | null;
              if (!populated) return null;
              const s = parseISO(apt.startTime);
              const e = parseISO(apt.endTime);
              const top = Math.max(0, differenceInMinutes(s, dayStart) * PIXELS_PER_MINUTE);
              const height = Math.max(20, differenceInMinutes(e, s) * PIXELS_PER_MINUTE);
              const posMeta = layout[apt.id];

              // If we have a measured container width, compute exact pixel positions
              if (containerWidth > 0 && posMeta) {
                const GUTTER = 8; // px gutter between columns
                const totalCols = posMeta.cols;
                const columnWidth = Math.max(20, Math.floor((containerWidth - GUTTER * (totalCols - 1)) / totalCols));
                const leftPx = Math.round(posMeta.col * (columnWidth + GUTTER));
                const widthPx = columnWidth;

                return (
                  <div key={apt.id} className="absolute" style={{ top: `${top}px`, height: `${height}px`, left: `${leftPx}px`, width: `${widthPx}px` }}>
                    <div className="h-full w-full box-border p-1">
                      <AppointmentCard appointment={populated} absolute />
                    </div>
                  </div>
                );
              }

              // Fallback to percent-based layout if container not measured yet
              const pos = layout[apt.id] || { left: 0, cols: 1, col: 0 };
              const leftPercent = (pos.col / (pos.cols || 1)) * 100;
              const widthPercent = (1 / (pos.cols || 1)) * 100;
              return (
                <div key={apt.id} className="absolute" style={{ top: `${top}px`, height: `${height}px`, left: `${leftPercent}%`, width: `calc(${widthPercent}% - 8px)` }}>
                  <div className="h-full w-full box-border p-1">
                    <AppointmentCard appointment={populated} absolute />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          No appointments scheduled for this day
        </div>
      )}
    </div>
  );
}

/**
 * TODO: Create an AppointmentCard component
 *
 * This should be a small, reusable component that displays
 * a single appointment with appropriate styling.
 *
 * Consider:
 * - Show patient name
 * - Show appointment type
 * - Show duration
 * - Color-code by appointment type (use APPOINTMENT_TYPE_CONFIG from types)
 * - Make it visually clear when appointments span multiple slots
 */
