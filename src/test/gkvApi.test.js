import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { gkvApi } from '../services/gkvApi'

const mockResponse = (data, init = {}) =>
  Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(data),
  })

describe('gkvApi.fetchWithRetry', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns JSON payload on first successful attempt', async () => {
    const payload = { hello: 'world' }
    global.fetch.mockImplementation(() => mockResponse(payload))

    const result = await gkvApi.fetchWithRetry('https://example.com/test')

    expect(result).toEqual(payload)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on failure before succeeding', async () => {
    const payload = { ok: true }
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('network error')),
    )
    global.fetch.mockImplementationOnce(() => mockResponse(payload))

    const result = await gkvApi.fetchWithRetry('https://example.com/test', 2)

    expect(result).toEqual(payload)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('throws error after exhausting retries', async () => {
    global.fetch.mockImplementation(() => Promise.reject(new Error('fail')))

    await expect(gkvApi.fetchWithRetry('https://example.com/test', 2)).rejects.toThrow('fail')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
