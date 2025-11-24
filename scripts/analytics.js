// analytics.js: módulo mínimo para eventos personalizados (dataLayer style)
export const events = window.dataLayer || (window.dataLayer = []);

// pushEvent(obj): agrega evento estructurado al arreglo global
export function pushEvent(obj){
  events.push(obj);
}

// Helper global para uso inline si se necesita
window.pushAnalyticsEvent = pushEvent;
