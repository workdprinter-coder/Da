import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CalculationResult } from "@/lib/calculations/spur-gear";

export type UnitSystem = "metric" | "imperial";
export type DecimalPlaces = 2 | 3 | 4 | 5 | 6;
export type DefaultPressureAngle = 14.5 | 20 | 25;

export interface Settings {
  unitSystem: UnitSystem;
  decimalPlaces: DecimalPlaces;
  defaultPressureAngle: DefaultPressureAngle;
  darkMode: boolean;
}

export interface StoredCalculation {
  type: "spur" | "helical" | "worm" | "spiral-bevel";
  label: string;
  inputs: Record<string, number | string>;
  results: CalculationResult[];
  timestamp: number;
}

interface CalculatorContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  storedCalcs: Partial<Record<string, StoredCalculation>>;
  storeCalc: (type: StoredCalculation["type"], calc: StoredCalculation) => void;
  clearCalcs: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  unitSystem: "metric",
  decimalPlaces: 4,
  defaultPressureAngle: 20,
  darkMode: true,
};

const CalculatorContext = createContext<CalculatorContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage("gear-calc-settings", DEFAULT_SETTINGS)
  );
  const [storedCalcs, setStoredCalcs] = useState<Partial<Record<string, StoredCalculation>>>(
    () => loadFromStorage("gear-calc-stored", {})
  );

  useEffect(() => {
    localStorage.setItem("gear-calc-settings", JSON.stringify(settings));
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("gear-calc-stored", JSON.stringify(storedCalcs));
  }, [storedCalcs]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const storeCalc = (type: StoredCalculation["type"], calc: StoredCalculation) => {
    setStoredCalcs((prev) => ({ ...prev, [type]: calc }));
  };

  const clearCalcs = () => {
    setStoredCalcs({});
  };

  return (
    <CalculatorContext.Provider value={{ settings, updateSettings, storedCalcs, storeCalc, clearCalcs }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used within CalculatorProvider");
  return ctx;
}
