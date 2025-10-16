/**
 * WeekView Component
 *
 * Displays appointments for a week (Monday - Sunday) in a grid format.
 *
 * TODO for candidates:
 * 1. Generate a 7-day grid (Monday through Sunday)
 * 2. Generate time slots for each day
 * 3. Position appointments in the correct day and time
 * 4. Make it responsive (may need horizontal scroll on mobile)
 * 5. Color-code appointments by type
 * 6. Handle overlapping appointments
 */

'use client';

import type { Appointment, Doctor, TimeSlot } from '@/types';
import { DEFAULT_CALENDAR_CONFIG } from '@/types';
import { format, addDays, addMinutes, parseISO, isBefore, isAfter } from 'date-fns';
import AppointmentCard from './AppointmentCard';
import { appointmentService } from '@/services/appointmentService';

interface WeekViewProps {
  appointments: Appointment[];
  doctor: Doctor | undefined;
  weekStartDate: Date; // Should be a Monday
}

/**
 * WeekView Component
 *
 * Renders a weekly calendar grid with appointments.
 *
 * TODO: Implement this component
 *
 * Architecture suggestions:
 * 1. Generate an array of 7 dates (Mon-Sun) from weekStartDate
 * 2. Generate time slots (same as DayView: 8 AM - 6 PM)
 * 3. Create a grid: rows = time slots, columns = days
 * 4. Position appointments in the correct cell (day + time)
 *
 * Consider:
 * - How to make the grid scrollable horizontally on mobile?
 * - How to show day names and dates in headers?
 * - How to handle appointments that span multiple hours?
 * - Should you reuse logic from DayView?
 */
export function WeekView({ appointments, doctor, weekStartDate }: WeekViewProps) {
  /**
   * TODO: Generate array of 7 dates (Monday through Sunday)
   *
   * Starting from weekStartDate, create an array of the next 7 days
   */
  function getWeekDays(): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStartDate, i));
    }
    return days;
  }

  /**
   * TODO: Generate time slots (same as DayView)
   */
  function generateTimeSlots() {
    const slots: TimeSlot[] = [];
    const { startHour, endHour, slotDuration } = DEFAULT_CALENDAR_CONFIG;
    const base = new Date();
    base.setHours(startHour, 0, 0, 0);
    for (let mins = 0; mins < (endHour - startHour) * 60; mins += slotDuration) {
      const s = addMinutes(base, mins);
      const e = addMinutes(s, slotDuration);
      slots.push({ start: s, end: e, label: format(s, 'p') });
    }
    return slots;
  }

  /**
   * TODO: Get appointments for a specific day
   */
  function getAppointmentsForDay(date: Date): Appointment[] {
    return appointments.filter((apt) => {
      const aptStart = parseISO(apt.startTime);
      return aptStart.getFullYear() === date.getFullYear() && aptStart.getMonth() === date.getMonth() && aptStart.getDate() === date.getDate();
    });
  }

  /**
   * TODO: Get appointments for a specific day and time slot
   */
  function getAppointmentsForDayAndSlot(date: Date, slotStart: Date): Appointment[] {
    // To avoid duplicate rendering across multiple slots, only render
    // an appointment in the slot that contains its start time.
    const dayApts = getAppointmentsForDay(date);
    const slotEnd = addMinutes(slotStart, DEFAULT_CALENDAR_CONFIG.slotDuration);
    return dayApts.filter((apt) => {
      const aptStart = parseISO(apt.startTime);
      return aptStart >= slotStart && aptStart < slotEnd;
    });
  }

  const weekDays = getWeekDays();
  const timeSlots = generateTimeSlots();

  return (
    <div className="week-view">
      {/* Week header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {/* TODO: Format week range (e.g., "Oct 14 - Oct 20, 2024") */}
          Week View
        </h3>
        {doctor && (
          <p className="text-sm text-gray-600">
            {`${doctor.name}`} - {doctor.specialty.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </p>
        )}
      </div>

      {/* Week grid - may need horizontal scroll on mobile */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead>
            <tr>
              <th className="w-24 p-2 text-xs bg-gray-50">Time</th>
              {weekDays.map((day, index) => (
                <th key={index} className="p-2 text-xs bg-gray-50 border-l">
                  <div className="font-semibold">{format(day, 'EEE')}</div>
                  <div className="text-gray-600">{format(day, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => (
              <tr key={slotIndex} className="border-t">
                <td className="p-2 text-xs text-gray-600 align-top">{slot.label}</td>
                {weekDays.map((day, dayIndex) => (
                  <td key={dayIndex} className="p-1 border-l align-top min-h-[48px]">
                    {getAppointmentsForDayAndSlot(day, slot.start).map((apt) => {
                      const populated = appointmentService.getPopulatedAppointment(apt);
                      if (!populated) return null;
                      return <AppointmentCard key={apt.id} appointment={populated} compact />;
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* TODO: Replace above with actual grid implementation */}
        {/* Example structure:
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="w-20 p-2 text-xs bg-gray-50">Time</th>
              {weekDays.map((day, index) => (
                <th key={index} className="p-2 text-xs bg-gray-50 border-l">
                  <div className="font-semibold">{format(day, 'EEE')}</div>
                  <div className="text-gray-600">{format(day, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => (
              <tr key={slotIndex} className="border-t">
                <td className="p-2 text-xs text-gray-600">{slot.label}</td>
                {weekDays.map((day, dayIndex) => (
                  <td key={dayIndex} className="p-1 border-l align-top min-h-[60px]">
                    {getAppointmentsForDayAndSlot(day, slot.start).map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} compact />
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        */}

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          No appointments scheduled for this week
        </div>
      )}
    </div>
  );
}

/**
 * TODO: Consider reusing the AppointmentCard component from DayView
 *
 * You might want to add a "compact" prop to make it smaller for week view
 */
