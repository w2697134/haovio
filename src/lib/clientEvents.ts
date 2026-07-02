export const CLIENT_EVENTS = {
  openCustomerService: "open-customer-service",
  openLoginModal: "open-login-modal",
  balanceChanged: "balance-changed",
} as const;

export type ClientEventName = keyof typeof CLIENT_EVENTS;

export function emitClientEvent(name: ClientEventName) {
  window.dispatchEvent(new Event(CLIENT_EVENTS[name]));
}

export function listenClientEvent(name: ClientEventName, handler: () => void) {
  window.addEventListener(CLIENT_EVENTS[name], handler);
  return () => window.removeEventListener(CLIENT_EVENTS[name], handler);
}
