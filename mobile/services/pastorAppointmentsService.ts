import { supabase } from "@/services/supabase";

export type AppointmentStatus = "enviado" | "pendiente" | "aceptada" | "rechazada";

export type PastorAppointment = {
  id: number;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: AppointmentStatus;
  response_message: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_country_code: string | null;
  phone_number: string | null;
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  enviado: "Enviado",
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada"
};

export const getMyAppointments = async () => {
  const { data, error } = await supabase
    .from("pastor_appointments")
    .select("id,user_id,appointment_date,appointment_time,reason,status,response_message,responded_by,responded_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PastorAppointment[];
};

export const createPastorAppointment = async (userId: string, appointmentDate: string, appointmentTime: string, reason: string) => {
  const { error } = await supabase.from("pastor_appointments").insert({
    user_id: userId,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    reason: reason.trim(),
    status: "enviado"
  });

  if (error) throw error;
};

export const getAppointmentsForResponse = async () => {
  const { data, error } = await supabase
    .from("pastor_appointments")
    .select("id,user_id,appointment_date,appointment_time,reason,status,response_message,responded_by,responded_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const appointments = (data ?? []) as PastorAppointment[];
  const userIds = Array.from(new Set(appointments.map((appointment) => appointment.user_id)));

  if (!userIds.length) return { appointments, profilesById: {} as Record<string, AppointmentProfile> };

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone_country_code,phone_number")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  return {
    appointments,
    profilesById: Object.fromEntries(((profiles ?? []) as AppointmentProfile[]).map((profile) => [profile.id, profile]))
  };
};

export const respondPastorAppointment = async (appointmentId: number, status: AppointmentStatus, responseMessage: string, responderId: string) => {
  const { error } = await supabase
    .from("pastor_appointments")
    .update({
      status,
      response_message: responseMessage.trim() || null,
      responded_by: responderId,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", appointmentId);

  if (error) throw error;
};
