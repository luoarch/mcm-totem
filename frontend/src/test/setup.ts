import '@testing-library/jest-dom'

// Mock WebSocket for jsdom environment
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === 'open') this.onopen = listener as (event: Event) => void
    if (type === 'close') this.onclose = listener as (event: CloseEvent) => void
    if (type === 'message') this.onmessage = listener as (event: MessageEvent) => void
    if (type === 'error') this.onerror = listener as (event: Event) => void
  }

  removeEventListener() { }

  close() {
    this.readyState = MockWebSocket.CLOSED
  }

  send() { }
}

// @ts-expect-error - Mocking WebSocket for test environment
globalThis.WebSocket = MockWebSocket
