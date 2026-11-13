/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Auto Dark Mode Service (الوضع الليلي التلقائي)
 * Determines light/dark theme automatically using:
 * 1. Ambient Light Sensor API (Generic Sensor / devicelight) if available on the device
 * 2. Sunset/Sunrise astronomical timing based on Arabian Peninsula coordinates (~24.7°N)
 */

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  sunriseMinutes: number;
  sunsetMinutes: number;
  sunriseStr: string;
  sunsetStr: string;
  isNight: boolean;
}

export interface AutoDarkDecision {
  isDark: boolean;
  reason: 'sensor' | 'sunset';
  description: string;
  lux?: number | null;
  sunsetStr?: string;
  sunriseStr?: string;
}

/** Threshold in lux below which ambient lighting is considered dark (dim room / night) */
export const AMBIENT_LIGHT_DARK_THRESHOLD_LUX = 25;

/** Default reference latitude & longitude (Mecca / Riyadh central region) */
export const DEFAULT_REGION_COORDS = {
  lat: 24.7136,
  lng: 46.6753,
};

/**
 * Computes sunrise and sunset times for a given date and coordinates using standard solar declination.
 */
export function calculateSunTimes(
  date: Date = new Date(),
  lat: number = DEFAULT_REGION_COORDS.lat
): SunTimes {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

  // Solar declination in radians
  const declination = 0.4093 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const latRad = (lat * Math.PI) / 180;

  // Hour angle at sunrise/sunset
  let cosH = -Math.tan(latRad) * Math.tan(declination);
  cosH = Math.max(-1, Math.min(1, cosH));
  const H = Math.acos(cosH) * (180 / Math.PI);

  const solarNoonHours = 12.0;
  const halfDayHours = H / 15;

  const sunriseHour = solarNoonHours - halfDayHours;
  const sunsetHour = solarNoonHours + halfDayHours;

  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

  const currentTime = date.getTime();
  const isNight = currentTime >= sunset.getTime() || currentTime < sunrise.getTime();

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const sunriseMinutes = Math.round(sunriseHour * 60);
  const sunsetMinutes = Math.round(sunsetHour * 60);

  return {
    sunrise,
    sunset,
    sunriseMinutes,
    sunsetMinutes,
    sunriseStr: formatTime(sunrise),
    sunsetStr: formatTime(sunset),
    isNight,
  };
}

/**
 * Evaluates whether auto dark mode should be enabled based on sensor lux (if provided)
 * or sunset/sunrise timing.
 */
export function evaluateAutoDarkMode(
  lux: number | null,
  date: Date = new Date(),
  lat: number = DEFAULT_REGION_COORDS.lat
): AutoDarkDecision {
  if (lux !== null && typeof lux === 'number' && !isNaN(lux)) {
    const isDark = lux < AMBIENT_LIGHT_DARK_THRESHOLD_LUX;
    return {
      isDark,
      reason: 'sensor',
      description: isDark
        ? `مستشعر الضوء (${Math.round(lux)} لوكس - إضاءة منخفضة)`
        : `مستشعر الضوء (${Math.round(lux)} لوكس - إضاءة كافية)`,
      lux: Math.round(lux),
    };
  }

  const sun = calculateSunTimes(date, lat);
  return {
    isDark: sun.isNight,
    reason: 'sunset',
    description: sun.isNight
      ? `توقيت الغروب (${sun.sunsetStr} - ليلي)`
      : `توقيت الشروق (${sun.sunriseStr} - نهاري)`,
    sunsetStr: sun.sunsetStr,
    sunriseStr: sun.sunriseStr,
  };
}

/**
 * Subscribes to device ambient light sensor if supported by the browser/environment.
 * Returns an unsubscription function, or null if unsupported.
 */
export function subscribeAmbientLight(
  onReading: (lux: number) => void
): (() => void) | null {
  if (typeof window === 'undefined') return null;

  // 1. Try Generic Sensor API (AmbientLightSensor)
  try {
    const SensorClass = (window as unknown as {
      AmbientLightSensor?: new (opt?: { frequency?: number }) => {
        illuminance?: number;
        start: () => void;
        stop: () => void;
        onreading: (() => void) | null;
        onerror: ((e: unknown) => void) | null;
      };
    }).AmbientLightSensor;

    if (typeof SensorClass === 'function') {
      const sensor = new SensorClass({ frequency: 1 });
      sensor.onreading = () => {
        if (typeof sensor.illuminance === 'number') {
          onReading(sensor.illuminance);
        }
      };
      sensor.onerror = () => {
        // Sensor access denied or unavailable on this device
      };
      sensor.start();
      return () => {
        try {
          sensor.stop();
        } catch {}
      };
    }
  } catch {}

  // 2. Fallback to older devicelight event
  if ('ondevicelight' in window) {
    const handler = (event: Event) => {
      const luxEvent = event as unknown as { value?: number };
      if (typeof luxEvent.value === 'number') {
        onReading(luxEvent.value);
      }
    };
    window.addEventListener('devicelight', handler);
    return () => window.removeEventListener('devicelight', handler);
  }

  return null;
}
