const isClient = typeof window !== 'undefined'
const analyticsDebug = !import.meta.env.PROD

const consoleLogger = {
  track(event, payload) {
    if (analyticsDebug) {
      console.debug(`[analytics] ${event}`, payload)
    }
  },
  error(event, error, context) {
    if (analyticsDebug) {
      console.error(`[analytics-error] ${event}`, error, context)
    }
  },
}

export function trackEvent(eventName, payload = {}) {
  try {
    if (isClient && window?.aboeloAnalytics?.trackEvent) {
      window.aboeloAnalytics.trackEvent(eventName, payload)
    } else {
      consoleLogger.track(eventName, payload)
    }
  } catch (error) {
    consoleLogger.error('trackEvent_failed', error, { eventName, payload })
  }
}

export function logError(eventName, error, context = {}) {
  try {
    if (isClient && window?.aboeloAnalytics?.logError) {
      window.aboeloAnalytics.logError(eventName, error, context)
    } else {
      consoleLogger.error(eventName, error, context)
    }
  } catch (loggerError) {
    console.error('Failed to log error', loggerError)
  }
}
