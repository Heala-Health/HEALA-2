
export interface AnalyticsData {
  totalAppointments: number;
  activePhysicians: number;
  emergencyRequests: number;
  monthlyAppointments: any[];
  appointmentsByStatus: any[];
  physicianWorkload: any[];
}

export interface AnalyticsMetrics {
  totalAppointments: number;
  activePhysicians: number;
  emergencyRequests: number;
  thisMonthAppointments: number;
}
