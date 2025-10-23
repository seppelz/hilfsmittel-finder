import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackEvent, logError } from '../utils/analytics'

describe('analytics fallbacks', () => {
  let originalConsoleDebug
  let originalConsoleError

  beforeEach(() => {
    originalConsoleDebug = console.debug
    originalConsoleError = console.error
    console.debug = vi.fn()
    console.error = vi.fn()
    delete window.aboeloAnalytics
  })

  afterEach(() => {
    console.debug = originalConsoleDebug
    console.error = originalConsoleError
  })

  it('logs to console when no analytics implementation is present', () => {
    trackEvent('test_event', { foo: 'bar' })
    expect(console.debug).toHaveBeenCalledWith('[analytics] test_event', { foo: 'bar' })
  })

  it('logs errors to console when no analytics implementation is present', () => {
    const error = new Error('boom')
    logError('test_error', error, { detail: 42 })
    expect(console.error).toHaveBeenCalledWith('[analytics-error] test_error', error, { detail: 42 })
  })

  it('handles thrown errors while logging gracefully', () => {
    console.error.mockImplementation(() => {
      throw new Error('console failure')
    })

    expect(() => logError('test_error', new Error('boom'))).not.toThrow()
  })
})
