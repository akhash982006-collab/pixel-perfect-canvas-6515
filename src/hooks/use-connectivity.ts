import { useCallback, useEffect, useRef, useState } from "react";
import { hasInternetAccess } from "@/services/connectivityService";

export type ConnectivityState = "checking" | "online" | "offline";

interface Options {
  /** Fast polling interval while online / checking (ms). */
  intervalMs?: number;
  /** Slower polling interval once offline is confirmed (ms). Reduces WiFi chatter during the quiz. */
  slowIntervalMs?: number;
  /** Consecutive failed probes required before reporting offline. */
  offlineConfirmations?: number;
  enabled?: boolean;
  /** When true, switch to slowIntervalMs after offline is confirmed. */
  adaptive?: boolean;
}

/**
 * Continuously determines whether this device really has internet access.
 * Starts in "checking" so nothing is unlocked on an unknown state.
 * Adaptive mode slows polling once offline is confirmed, which keeps the
 * quiz responsive without flooding the lab network with probes.
 */
export function useConnectivity({
  intervalMs = 2500,
  slowIntervalMs = 8000,
  offlineConfirmations = 2,
  enabled = true,
  adaptive = false,
}: Options = {}) {
  const [state, setState] = useState<ConnectivityState>("checking");
  const offlineStreak = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const online = await hasInternetAccess();
      if (!mounted.current) return;
      if (online) {
        offlineStreak.current = 0;
        setState("online");
      } else {
        offlineStreak.current += 1;
        const nowOffline = offlineStreak.current >= offlineConfirmations;
        setState((prev) => (nowOffline ? "offline" : prev === "online" ? "checking" : prev));
      }
    } finally {
      busy.current = false;
    }
  }, [offlineConfirmations]);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return;
    void check();
    // Once offline is confirmed, slow down probes to reduce network chatter.
    const effectiveInterval = adaptive && state === "offline" ? slowIntervalMs : intervalMs;
    const id = window.setInterval(() => void check(), effectiveInterval);
    const immediate = () => void check();
    window.addEventListener("online", immediate);
    window.addEventListener("offline", immediate);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener("online", immediate);
      window.removeEventListener("offline", immediate);
    };
  }, [check, enabled, intervalMs, slowIntervalMs, adaptive, state]);

  return { state, isOffline: state === "offline", isOnline: state === "online", recheck: check };
}
