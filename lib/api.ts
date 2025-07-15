// API utility functions for NestJS integration

import { UserRole } from './enums/roles.enum';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Updated interfaces based on database schema
export interface User {
  User_ID: number;
  First_Name: string;
  Middle_Name?: string;
  Last_Name: string;
  Email: string;
  Password?: string;
  Role: UserRole;
  Phone_Number: string;
  Created_At: string;
  Updated_At: string;
  Account_Available_At?: string;
}

export interface Vehicle {
  Vehicle_ID: number;
  User_ID: number;
  Vehicle_Type: string;
  Year_Make_Model: string;
  Color: string;
  Plate_Number: string;
  Created_At: string;
  Updated_At: string;
}

export interface ParkingSpace {
  Parking_Space_ID: number;
  City: string;
  Establishment_Name: string;
  Address: string;
  Total_Spaces: number;
  Available_Spaces: number;
  Hourly_Rate: number;
  Whole_Day_Rate: number;
  Availability_Status: string;
  Created_At: string;
  Updated_At: string;
  IsDeleted: boolean;
}

export interface Reservation {
  Reservation_ID: number;
  User_ID: number;
  Parking_Space_ID: number;
  Vehicle_ID: number;
  Start_Time: string;
  End_Time: string;
  Reservation_Type: string;
  Hourly_Rate: number;
  Whole_Day_Rate: number;
  Discount: number;
  Tax: number;
  Total_Price: number;
  Discount_Note?: string;
  Status: string;
  Created_At: string;
  Updated_At: string;
}

export interface Payment {
  Payment_ID: number;
  Reservation_ID: number;
  Payment_Method: string;
  Amount: number;
  Payment_Status: string;
  Payment_Date: string;
  Receipt_Number: string;
}

export interface ParkingSpaceAdmin {
  Parking_Space_Admin_ID: number;
  Parking_Space_ID: number;
  User_ID: number;
  Assigned_By_User_ID: number;
  Assigned_At: string;
}

export interface Notification {
  Notification_ID: number;
  User_ID: number;
  Notification_Type: string;
  Message: string;
  Sent_Date: string;
  Read_Status: string;
}

// Auth API calls
export const authApi = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  register: async (
    userData: Partial<User> & { password: string }
  ): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },
};

// User API calls
export const userApi = {
  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateProfile: async (
    token: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  getAllUsers: async (token: string): Promise<ApiResponse<User[]>> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Vehicle API calls
export const vehicleApi = {
  getUserVehicles: async (token: string): Promise<ApiResponse<Vehicle[]>> => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createVehicle: async (
    token: string,
    vehicleData: Omit<Vehicle, 'id' | 'userId'>
  ): Promise<ApiResponse<Vehicle>> => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vehicleData),
    });
    return response.json();
  },
};

// Parking API calls
export const parkingApi = {
  searchEstablishments: async (
    location: string
  ): Promise<ApiResponse<ParkingSpace[]>> => {
    const response = await fetch(
      `${API_BASE_URL}/parking/search?location=${encodeURIComponent(location)}`
    );
    return response.json();
  },

  getEstablishment: async (id: string): Promise<ApiResponse<ParkingSpace>> => {
    const response = await fetch(`${API_BASE_URL}/parking/${id}`);
    return response.json();
  },

  getAllEstablishments: async (
    token: string
  ): Promise<ApiResponse<ParkingSpace[]>> => {
    const response = await fetch(`${API_BASE_URL}/parking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createEstablishment: async (
    token: string,
    establishmentData: Omit<ParkingSpace, 'Parking_Space_ID'>
  ): Promise<ApiResponse<ParkingSpace>> => {
    const response = await fetch(`${API_BASE_URL}/parking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(establishmentData),
    });
    return response.json();
  },

  updateEstablishment: async (
    token: string,
    id: string,
    establishmentData: Partial<ParkingSpace>
  ): Promise<ApiResponse<ParkingSpace>> => {
    const response = await fetch(`${API_BASE_URL}/parking/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(establishmentData),
    });
    return response.json();
  },
};

// Reservation API calls
export const reservationApi = {
  createReservation: async (
    token: string,
    reservationData: Omit<Reservation, 'Reservation_ID'>
  ): Promise<ApiResponse<Reservation>> => {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reservationData),
    });
    return response.json();
  },

  getUserReservations: async (
    token: string
  ): Promise<ApiResponse<Reservation[]>> => {
    const response = await fetch(`${API_BASE_URL}/reservations/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getAllReservations: async (
    token: string
  ): Promise<ApiResponse<Reservation[]>> => {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateReservationStatus: async (
    token: string,
    id: string,
    status: Reservation['Status']
  ): Promise<ApiResponse<Reservation>> => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
};
