import { ref } from 'vue'

// Define market data types
type MarketData = {
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

type Markets = {
  [key: string]: MarketData
}

// Define order types
type OrderType = 'market' | 'limit'
type OrderSide = 'buy' | 'sell'

interface Order {
  id: string
  symbol: string
  side: OrderSide
  size: number
  price?: number
  type?: OrderType
  status: string
  timestamp: string
}

interface Position {
  symbol: string
  size: number
  entryPrice: number
  leverage: number
  pnl: number
}

interface AccountData {
  balance: number
  positions: Position[]
  orders: Order[]
}

// Mock market data
const mockMarketData: Markets = {
  BTC_USDT: {
    price: 43500,
    change24h: 2.5,
    volume24h: 1250000000,
    high24h: 44000,
    low24h: 43000,
  },
  ETH_USDT: {
    price: 2250,
    change24h: 1.8,
    volume24h: 750000000,
    high24h: 2300,
    low24h: 2200,
  },
}

// Mock account data
const mockAccountData: AccountData = {
  balance: 10000,
  positions: [
    {
      symbol: 'BTC_USDT',
      size: 0.5,
      entryPrice: 43200,
      leverage: 10,
      pnl: 150,
    },
  ],
  orders: [],
}

// Mock WebSocket for real-time updates
class MockWebSocket {
  private callbacks: { [key: string]: (event: { data: string }) => void } = {}
  private interval: NodeJS.Timer | null = null

  constructor() {
    // Simulate price updates every 2 seconds
    this.interval = setInterval(() => {
      Object.keys(mockMarketData).forEach((symbol) => {
        const market = mockMarketData[symbol]
        const currentPrice = market.price
        const change = (Math.random() - 0.5) * 100
        market.price = currentPrice + change
        
        if (this.callbacks.message) {
          this.callbacks.message({
            data: JSON.stringify({
              type: 'price_update',
              symbol,
              price: market.price,
            }),
          })
        }
      })
    }, 2000)
  }

  addEventListener(event: string, callback: (event: { data: string }) => void) {
    this.callbacks[event] = callback
  }

  close() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}

// Mock API class
export class MockBlofinAPI {
  private ws: MockWebSocket | null = null
  public isConnected = ref(false)

  // Market Data Methods
  getMarketData(symbol: string): Promise<MarketData | null> {
    return Promise.resolve(mockMarketData[symbol] || null)
  }

  getAllMarkets(): Promise<Markets> {
    return Promise.resolve(mockMarketData)
  }

  // Account Methods
  getAccountInfo(): Promise<AccountData> {
    return Promise.resolve(mockAccountData)
  }

  placeOrder(params: {
    symbol: string
    side: OrderSide
    size: number
    price?: number
    type?: OrderType
  }): Promise<Order> {
    const order: Order = {
      id: Math.random().toString(36).substring(7),
      ...params,
      status: 'filled',
      timestamp: new Date().toISOString(),
    }
    mockAccountData.orders.push(order)
    return Promise.resolve(order)
  }

  // WebSocket Methods
  connectWebSocket(): MockWebSocket {
    if (!this.ws) {
      this.ws = new MockWebSocket()
      this.isConnected.value = true
    }
    return this.ws
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected.value = false
    }
  }
}

// Export a singleton instance
export const mockApi = new MockBlofinAPI() 