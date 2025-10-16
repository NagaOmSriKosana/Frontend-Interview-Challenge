/**
 * ScheduleView Component
 *
 * Main component that orchestrates the schedule display.
 * This component should compose smaller components together.
 *
 * TODO for candidates:
 * 1. Create the component structure (header, controls, calendar)
 * 2. Compose DoctorSelector, DayView, WeekView together
 * 3. Handle view switching (day vs week)
 * 4. Manage state or use the useAppointments hook
 * 5. Think about component composition and reusability
 */

 'use client';

import { useState } from 'react';
import type { CalendarView } from '@/types';
import DoctorSelector from './DoctorSelector';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { useAppointments } from '@/hooks/useAppointments';
import { appointmentService } from '@/services/appointmentService';
import { format } from 'date-fns';

export default function ScheduleViewWrapper(props: any) {
  return <ScheduleView {...props} />;
}
interface ScheduleViewProps {
  selectedDoctorId: string;
  selectedDate: Date;
  view: CalendarView;
  onDoctorChange: (doctorId: string) => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

/**
 * ScheduleView Component
 *
 * This is the main container component for the schedule interface.
 *
 * TODO: Implement this component
 *
 * Consider:
 * - How to structure the layout (header, controls, calendar)
 * - How to compose smaller components
 * - How to pass data down to child components
 * - How to handle user interactions (view switching, date changes)
 */
export function ScheduleView({
  selectedDoctorId,
  selectedDate,
  view,
  onDoctorChange,
  onDateChange,
  onViewChange,
}: ScheduleViewProps) {
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday

  const { appointments, doctor, loading, error } = useAppointments({
    doctorId: selectedDoctorId,
    date: selectedDate,
    startDate: view === 'week' ? weekStart : undefined,
    endDate: view === 'week' ? new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59) : undefined,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* TODO: Implement the component structure */}

      {/* Header with doctor info and controls */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Doctor Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">
              {doctor ? (
                <>
                  {`${doctor.name}`} — {doctor.specialty.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </>
              ) : (
                'Select a doctor to view schedule'
              )}
            </p>
          </div>

          <div className="flex gap-4 items-center w-96">
            <div className="flex-1">
              <DoctorSelector selectedDoctorId={selectedDoctorId} onDoctorChange={onDoctorChange} />
            </div>

            <div>
              <input
                type="date"
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={(e) => onDateChange(new Date(e.target.value))}
                className="px-3 py-2 border rounded"
                aria-label="Select date"
              />
            </div>

            <div className="flex gap-2">
              <button
                className={`px-4 py-2 text-sm rounded ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => onViewChange('day')}
              >
                Day
              </button>
              <button
                className={`px-4 py-2 text-sm rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => onViewChange('week')}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="p-6">
        {/* TODO: Conditionally render DayView or WeekView based on view prop */}
        {loading && (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        )}

        {!loading && (
          <div>
            {view === 'day' ? (
              <DayView appointments={appointments} doctor={doctor} date={selectedDate} />
            ) : (
              <WeekView appointments={appointments} doctor={doctor} weekStartDate={weekStart} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
