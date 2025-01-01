import type { Prettify } from 'surrealdb.js'

export interface IMU extends Record<string, unknown> {
  angles: [number, number, number]
  temp: number
}

export interface MAG extends Record<string, unknown> {
  raw: [number, number, number]
  heading: number
}

export interface GPS extends Record<string, unknown> {
  speed_kmh: number
  latitude: number
  longitude: number
  satellites: number
  fix: boolean
  heading: number
}

export interface Analog extends Record<string, unknown> {
  battery: number
}

export interface Sensors extends Record<string, unknown> {
  mag: MAG
  imu: IMU
  analog: Analog
  gps: GPS
}

export interface Modem extends Record<string, unknown> {
  quality: number
}

export interface Control extends Prettify<Record<string, unknown>> {
  time: number
  steer: number
  speed: number
}

export interface Switch extends Prettify<Record<string, unknown>> {
  esc: boolean
}
