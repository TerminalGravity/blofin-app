import blofinAPI from '@/services/blofin-api'

export const state = () => ({
  instruments: [],
  selectedInstrument: null,
  positions: [],
  activeOrders: [],
  orderBook: {
    asks: [],
    bids: [],
  },
  ticker: null,
  wsConnected: false,
  credentials: {
    apiKey: '',
    secretKey: '',
    passphrase: '',
  },
  loading: {
    instruments: false,
    positions: false,
    orders: false,
    orderPlacement: false,
  },
  errors: {
    instruments: null,
    positions: null,
    orders: null,
    orderPlacement: null,
    websocket: null,
  },
})

export const mutations = {
  SET_INSTRUMENTS(state, instruments) {
    state.instruments = instruments
  },
  SET_SELECTED_INSTRUMENT(state, instrument) {
    state.selectedInstrument = instrument
  },
  SET_POSITIONS(state, positions) {
    state.positions = positions
  },
  SET_ACTIVE_ORDERS(state, orders) {
    state.activeOrders = orders
  },
  SET_ORDER_BOOK(state, orderBook) {
    state.orderBook = orderBook
  },
  SET_TICKER(state, ticker) {
    state.ticker = ticker
  },
  SET_WS_CONNECTED(state, connected) {
    state.wsConnected = connected
  },
  SET_CREDENTIALS(state, credentials) {
    state.credentials = credentials
    blofinAPI.setCredentials(
      credentials.apiKey,
      credentials.secretKey,
      credentials.passphrase
    )
  },
  SET_LOADING(state, { type, value }) {
    state.loading[type] = value
  },
  SET_ERROR(state, { type, error }) {
    state.errors[type] = error
  },
  CLEAR_ERROR(state, type) {
    state.errors[type] = null
  },
}

export const actions = {
  async fetchInstruments({ commit }) {
    commit('SET_LOADING', { type: 'instruments', value: true })
    commit('CLEAR_ERROR', 'instruments')

    try {
      const response = await blofinAPI.getInstruments()
      if (response.code === '0') {
        commit('SET_INSTRUMENTS', response.data)
      } else {
        throw new Error(response.msg || 'Failed to fetch instruments')
      }
    } catch (error) {
      commit('SET_ERROR', {
        type: 'instruments',
        error: error.message || 'Failed to fetch instruments',
      })
      console.error('Error fetching instruments:', error)
    } finally {
      commit('SET_LOADING', { type: 'instruments', value: false })
    }
  },

  async fetchPositions({ commit }) {
    commit('SET_LOADING', { type: 'positions', value: true })
    commit('CLEAR_ERROR', 'positions')

    try {
      const response = await blofinAPI.getPositions()
      if (response.code === '0') {
        commit('SET_POSITIONS', response.data)
      } else {
        throw new Error(response.msg || 'Failed to fetch positions')
      }
    } catch (error) {
      commit('SET_ERROR', {
        type: 'positions',
        error: error.message || 'Failed to fetch positions',
      })
      console.error('Error fetching positions:', error)
    } finally {
      commit('SET_LOADING', { type: 'positions', value: false })
    }
  },

  async fetchActiveOrders({ commit, state }) {
    commit('SET_LOADING', { type: 'orders', value: true })
    commit('CLEAR_ERROR', 'orders')

    try {
      const response = await blofinAPI.getActiveOrders(
        state.selectedInstrument?.instId
      )
      if (response.code === '0') {
        commit('SET_ACTIVE_ORDERS', response.data)
      } else {
        throw new Error(response.msg || 'Failed to fetch orders')
      }
    } catch (error) {
      commit('SET_ERROR', {
        type: 'orders',
        error: error.message || 'Failed to fetch orders',
      })
      console.error('Error fetching active orders:', error)
    } finally {
      commit('SET_LOADING', { type: 'orders', value: false })
    }
  },

  async placeOrder({ commit, dispatch }, orderData) {
    commit('SET_LOADING', { type: 'orderPlacement', value: true })
    commit('CLEAR_ERROR', 'orderPlacement')

    try {
      const response = await blofinAPI.placeOrder(orderData)
      if (response.code === '0') {
        await Promise.all([
          dispatch('fetchActiveOrders'),
          dispatch('fetchPositions'),
        ])
        return response
      } else {
        throw new Error(response.msg || 'Failed to place order')
      }
    } catch (error) {
      commit('SET_ERROR', {
        type: 'orderPlacement',
        error: error.message || 'Failed to place order',
      })
      console.error('Error placing order:', error)
      throw error
    } finally {
      commit('SET_LOADING', { type: 'orderPlacement', value: false })
    }
  },

  async cancelOrder({ commit, dispatch }, orderId) {
    try {
      const response = await blofinAPI.cancelOrder(orderId)
      if (response.code === '0') {
        await dispatch('fetchActiveOrders')
        return response
      } else {
        throw new Error(response.msg || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error canceling order:', error)
      throw error
    }
  },

  initializeWebSocket({ commit, state, dispatch }) {
    const handleWebSocketError = (error) => {
      commit('SET_WS_CONNECTED', false)
      commit('SET_ERROR', {
        type: 'websocket',
        error: 'WebSocket connection error',
      })
      console.error('WebSocket error:', error)
    }

    const handlePublicMessage = (data) => {
      if (data.arg?.channel === 'books') {
        commit('SET_ORDER_BOOK', data.data?.[0] || { asks: [], bids: [] })
      } else if (data.arg?.channel === 'tickers') {
        commit('SET_TICKER', data.data?.[0] || null)
      }
    }

    const handlePrivateMessage = (data) => {
      // Handle order updates
      if (data.arg?.channel === 'orders') {
        dispatch('fetchActiveOrders')
      }
      // Handle position updates
      else if (data.arg?.channel === 'positions') {
        dispatch('fetchPositions')
      }
    }

    const publicWs = blofinAPI.createPublicWebSocket(
      handlePublicMessage,
      handleWebSocketError
    )

    const privateWs = blofinAPI.createPrivateWebSocket(
      handlePrivateMessage,
      handleWebSocketError
    )

    if (state.selectedInstrument) {
      const subscriptions = [
        {
          channel: 'books',
          instId: state.selectedInstrument.instId,
        },
        {
          channel: 'tickers',
          instId: state.selectedInstrument.instId,
        },
      ]

      if (publicWs.readyState === WebSocket.OPEN) {
        publicWs.send(
          JSON.stringify({
            op: 'subscribe',
            args: subscriptions,
          })
        )
      }
    }

    commit('SET_WS_CONNECTED', true)
    commit('CLEAR_ERROR', 'websocket')
  },

  cleanup({ commit }) {
    blofinAPI.cleanup()
    commit('SET_WS_CONNECTED', false)
  },
}

export const getters = {
  instrumentsList: (state) => state.instruments,
  selectedInstrument: (state) => state.selectedInstrument,
  positions: (state) => state.positions,
  activeOrders: (state) => state.activeOrders,
  orderBook: (state) => state.orderBook,
  ticker: (state) => state.ticker,
  isWsConnected: (state) => state.wsConnected,
  isLoading: (state) => (type) => state.loading[type],
  getError: (state) => (type) => state.errors[type],
}
