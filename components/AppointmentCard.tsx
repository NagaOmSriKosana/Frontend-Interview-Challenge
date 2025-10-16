"use client";

import React from 'react';
import type { PopulatedAppointment } from '@/types';
import { APPOINTMENT_TYPE_CONFIG } from '@/types';
import { format, differenceInMinutes, parseISO } from 'date-fns';

interface Props {
  appointment: PopulatedAppointment;
  compact?: boolean;
  absolute?: boolean; // when true the card is positioned absolutely and should not add external margins
}

export function AppointmentCard({ appointment, compact = false, absolute = false }: Props) {
  const color = APPOINTMENT_TYPE_CONFIG[appointment.type]?.color ?? '#6b7280';
  const start = parseISO(appointment.startTime);
  const end = parseISO(appointment.endTime);
  const duration = differenceInMinutes(end, start);

  const marginClass = absolute ? '' : (compact ? 'mb-1' : 'mb-2');

  return (
    <div
      className={`rounded-md text-white text-sm shadow-sm ${marginClass} box-border h-full overflow-hidden flex flex-col justify-between`}
      style={{ backgroundColor: color, padding: '6px' }}
      title={`${appointment.patient.name} • ${appointment.type} • ${duration} min`}
      role="article"
    >
      <div className="font-medium text-sm truncate">{appointment.patient.name}</div>
      {!compact && (
        <div className="text-xs opacity-90 truncate">
          {APPOINTMENT_TYPE_CONFIG[appointment.type]?.label} • {duration} min
        </div>
      )}
      <div className="text-xs opacity-90">{format(start, 'p')} - {format(end, 'p')}</div>
    </div>
  );
}

export default AppointmentCard;
