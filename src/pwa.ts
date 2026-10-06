export const UPDATE_READY_EVENT = "sierra-zero-update-ready";

let registration: ServiceWorkerRegistration | null = null;

function announceWaitingWorker() {
  window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT));
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", async () => {
    registration = await navigator.serviceWorker.register("./sw.js");
    if (registration.waiting && navigator.serviceWorker.controller) announceWaitingWorker();
    registration.addEventListener("updatefound", () => {
      const worker = registration?.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) announceWaitingWorker();
      });
    });
    void registration.update();
  });
}

export async function activateWaitingWorker() {
  registration ??= await navigator.serviceWorker.getRegistration() ?? null;
  if (!registration?.waiting) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}
