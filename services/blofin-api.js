import axios from 'axios'
import CryptoJS from 'crypto-js'

const BASE_URL = 'https://openapi.blofin.com'
const WS_PUBLIC_URL = 'wss://openapi.blofin.com/ws/public'
const WS_PRIVATE_URL = 'wss://openapi.blofin.com/ws/private'

const RECONNECT_DELAY = 3000
const MAX_RECONNECT_ATTEMPTS = 5

class BlofinAPI {
  constructor() {
    this.apiKey = ''
    this.secretKey = ''
    this.passphrase = ''
    this.publicWs = null
    this.privateWs = null
    this.reconnectAttempts = 0
    this.pingInterval = null
  }

  setCredentials(apiKey, secretKey, passphrase) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.passphrase = passphrase
  }

  generateSignature(timestamp, method, requestPath, body = '') {
    try {
      const nonce = Math.random().toString(36).substring(7)
      const prehash = `${requestPath}${method}${timestamp}${nonce}${body}`
      const signature = CryptoJS.enc.Base64.stringify(
        CryptoJS.enc.Utf8.parse(
          CryptoJS.HmacSHA256(prehash, this.secretKey).toString()
        )
      )
      return { signature, nonce }
    } catch (error) {
      console.error('Error generating signature:', error)
      throw new Error('Failed to generate API signature')
    }
  }

  async request(method, endpoint, data = null) {
    if (!this.apiKey || !this.secretKey || !this.passphrase) {
      throw new Error('API credentials not set')
    }

    const timestamp = Date.now().toString()
    const requestPath = `/api/v1${endpoint}`
    const { signature, nonce } = this.generateSignature(
      timestamp,
      method,
      requestPath,
      data ? JSON.stringify(data) : ''
    )

    const headers = {
      'ACCESS-KEY': this.apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-NONCE': nonce,
      'ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    }

    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${requestPath}`,
        headers,
        data,
        timeout: 10000, // 10 second timeout
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw {
          code: error.response.data.code,
          message: error.response.data.msg || 'API request failed',
          status: error.response.status,
        }
      }
      throw {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
        originalError: error,
      }
    }
  }

  setupWebSocket(ws, onMessage, onError, isPrivate = false) {
    let pingTimeout = null

    const heartbeat = () => {
      if (pingTimeout) clearTimeout(pingTimeout)
      pingTimeout = setTimeout(() => {
        console.log('WebSocket connection timed out')
        ws.close()
      }, 30000) // 30 second timeout
    }

    ws.onopen = () => {
      console.log(`${isPrivate ? 'Private' : 'Public'} WebSocket connected`)
      this.reconnectAttempts = 0
      heartbeat()

      if (isPrivate && this.apiKey) {
        ws.send(JSON.stringify(this.generateWSLogin()))
      }

      // Start ping interval
      this.pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 20000)
    }

    ws.onmessage = (event) => {
      if (event.data === 'pong') {
        heartbeat()
        return
      }
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error(
        `${isPrivate ? 'Private' : 'Public'} WebSocket error:`,
        error
      )
      onError(error)
    }

    ws.onclose = () => {
      console.log(`${isPrivate ? 'Private' : 'Public'} WebSocket closed`)
      if (pingTimeout) clearTimeout(pingTimeout)
      if (this.pingInterval) clearInterval(this.pingInterval)

      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          console.log(
            `Attempting to reconnect (${
              this.reconnectAttempts + 1
            }/${MAX_RECONNECT_ATTEMPTS})`
          )
          this.reconnectAttempts++
          if (isPrivate) {
            this.createPrivateWebSocket(onMessage, onError)
          } else {
            this.createPublicWebSocket(onMessage, onError)
          }
        }, RECONNECT_DELAY)
      } else {
        console.error('Max reconnection attempts reached')
      }
    }

    return ws
  }

  createPublicWebSocket(onMessage, onError) {
    if (this.publicWs) {
      this.publicWs.close()
    }
    this.publicWs = this.setupWebSocket(
      new WebSocket(WS_PUBLIC_URL),
      onMessage,
      onError,
      false
    )
    return this.publicWs
  }

  createPrivateWebSocket(onMessage, onError) {
    if (this.privateWs) {
      this.privateWs.close()
    }
    this.privateWs = this.setupWebSocket(
      new WebSocket(WS_PRIVATE_URL),
      onMessage,
      onError,
      true
    )
    return this.privateWs
  }

  // Market Data Methods with error handling and retries
  async getInstruments(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.request('GET', '/market/instruments')
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  async getTickers(instId, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.request(
          'GET',
          `/market/tickers${instId ? `?instId=${instId}` : ''}`
        )
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  async getOrderBook(instId, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.request('GET', `/market/books?instId=${instId}`)
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  // Trading Methods with validation
  async getPositions(instId) {
    return this.request(
      'GET',
      `/account/positions${instId ? `?instId=${instId}` : ''}`
    )
  }

  async placeOrder(orderData) {
    // Validate required fields
    const requiredFields = ['instId', 'marginMode', 'side', 'orderType', 'size']
    for (const field of requiredFields) {
      if (!orderData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate numeric values
    if (orderData.price && isNaN(parseFloat(orderData.price))) {
      throw new Error('Invalid price value')
    }
    if (isNaN(parseFloat(orderData.size))) {
      throw new Error('Invalid size value')
    }

    return this.request('POST', '/trade/order', orderData)
  }

  async cancelOrder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required')
    }
    return this.request('POST', '/trade/cancel-order', { orderId })
  }

  async getActiveOrders(instId) {
    return this.request(
      'GET',
      `/trade/orders-pending${instId ? `?instId=${instId}` : ''}`
    )
  }

  // WebSocket Authentication
  generateWSLogin() {
    const timestamp = Date.now().toString()
    const { signature, nonce } = this.generateSignature(
      timestamp,
      'GET',
      '/users/self/verify',
      ''
    )

    return {
      op: 'login',
      args: [
        {
          apiKey: this.apiKey,
          passphrase: this.passphrase,
          timestamp,
          sign: signature,
          nonce,
        },
      ],
    }
  }

  // Cleanup method
  cleanup() {
    if (this.publicWs) {
      this.publicWs.close()
      this.publicWs = null
    }
    if (this.privateWs) {
      this.privateWs.close()
      this.privateWs = null
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

export default new BlofinAPI()
