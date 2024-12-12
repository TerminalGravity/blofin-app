<template>
  <div class="trading-page">
    <div class="trading-header">
      <div class="instrument-selector">
        <select v-model="selectedInstrumentId" @change="handleInstrumentChange">
          <option
            v-for="inst in instruments"
            :key="inst.instId"
            :value="inst.instId"
          >
            {{ inst.instId }}
          </option>
        </select>
      </div>
      <div v-if="ticker" class="ticker-info">
        <div class="price">
          <span>Last Price:</span>
          <span
            :class="{
              'text-success': ticker.last > ticker.open24h,
              'text-danger': ticker.last < ticker.open24h,
            }"
          >
            {{ ticker.last }}
          </span>
        </div>
        <div class="change">
          <span>24h Change:</span>
          <span
            :class="{
              'text-success': ticker.last > ticker.open24h,
              'text-danger': ticker.last < ticker.open24h,
            }"
          >
            {{
              (((ticker.last - ticker.open24h) / ticker.open24h) * 100).toFixed(
                2
              )
            }}%
          </span>
        </div>
        <div class="volume">
          <span>24h Volume:</span>
          <span>{{ ticker.vol24h }}</span>
        </div>
      </div>
    </div>

    <div class="trading-content">
      <div class="order-book-section">
        <h3>Order Book</h3>
        <div class="order-book">
          <div class="asks">
            <div
              v-for="(ask, index) in orderBook.asks"
              :key="'ask-' + index"
              class="order-row"
            >
              <span class="price text-danger">{{ ask[0] }}</span>
              <span class="size">{{ ask[1] }}</span>
            </div>
          </div>
          <div class="spread">Spread: {{ calculateSpread() }}</div>
          <div class="bids">
            <div
              v-for="(bid, index) in orderBook.bids"
              :key="'bid-' + index"
              class="order-row"
            >
              <span class="price text-success">{{ bid[0] }}</span>
              <span class="size">{{ bid[1] }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="trading-form">
        <div class="form-tabs">
          <button
            v-for="tab in ['Market', 'Limit']"
            :key="tab"
            :class="{ active: orderType === tab.toLowerCase() }"
            @click="orderType = tab.toLowerCase()"
          >
            {{ tab }}
          </button>
        </div>

        <div class="form-content">
          <div class="position-type">
            <button
              v-for="type in ['Long', 'Short']"
              :key="type"
              :class="{ active: positionSide === type.toLowerCase() }"
              @click="positionSide = type.toLowerCase()"
            >
              {{ type }}
            </button>
          </div>

          <div class="form-group">
            <label>Leverage</label>
            <input
              type="number"
              v-model="leverage"
              min="1"
              :max="selectedInstrument?.maxLeverage || 100"
            />
          </div>

          <div class="form-group">
            <label>Size (Contracts)</label>
            <input type="number" v-model="orderSize" min="1" />
          </div>

          <div v-if="orderType === 'limit'" class="form-group">
            <label>Price</label>
            <input type="number" v-model="orderPrice" step="0.1" />
          </div>

          <div class="form-group">
            <label>Take Profit</label>
            <input type="number" v-model="tpPrice" step="0.1" />
          </div>

          <div class="form-group">
            <label>Stop Loss</label>
            <input type="number" v-model="slPrice" step="0.1" />
          </div>

          <button class="submit-button" @click="placeOrder">
            {{ positionSide === 'long' ? 'Buy/Long' : 'Sell/Short' }}
          </button>
        </div>
      </div>

      <div class="positions-section">
        <h3>Positions</h3>
        <div class="positions-list">
          <div
            v-for="position in positions"
            :key="position.positionId"
            class="position-item"
          >
            <div class="position-header">
              <span>{{ position.instId }}</span>
              <span
                :class="{
                  'text-success': position.unrealizedPnl > 0,
                  'text-danger': position.unrealizedPnl < 0,
                }"
              >
                PnL: {{ position.unrealizedPnl }}
              </span>
            </div>
            <div class="position-details">
              <div>Size: {{ position.positions }}</div>
              <div>Entry: {{ position.averagePrice }}</div>
              <div>Liq. Price: {{ position.liquidationPrice }}</div>
              <div>Margin Ratio: {{ position.marginRatio }}%</div>
            </div>
            <button class="close-position" @click="closePosition(position)">
              Close Position
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="orders-section">
      <h3>Active Orders</h3>
      <div class="orders-list">
        <div
          v-for="order in activeOrders"
          :key="order.orderId"
          class="order-item"
        >
          <div class="order-info">
            <span>{{ order.instId }}</span>
            <span>{{ order.side.toUpperCase() }}</span>
            <span>{{ order.price }}</span>
            <span>{{ order.size }}</span>
            <span>{{ order.state }}</span>
          </div>
          <button class="cancel-order" @click="cancelOrder(order.orderId)">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'TradingPage',

  data() {
    return {
      selectedInstrumentId: '',
      orderType: 'market',
      positionSide: 'long',
      leverage: 1,
      orderSize: 1,
      orderPrice: 0,
      tpPrice: 0,
      slPrice: 0,
    }
  },

  computed: {
    ...mapState({
      ticker: (state) => state.trading.ticker,
      orderBook: (state) => state.trading.orderBook,
    }),
    ...mapGetters({
      instruments: 'trading/instrumentsList',
      positions: 'trading/positions',
      activeOrders: 'trading/activeOrders',
      selectedInstrument: 'trading/selectedInstrument',
    }),
  },

  async created() {
    await this.fetchInstruments()
    if (this.instruments.length > 0) {
      this.selectedInstrumentId = this.instruments[0].instId
      await this.handleInstrumentChange()
    }
    this.initializeWebSocket()
    this.startDataPolling()
  },

  methods: {
    ...mapActions({
      fetchInstruments: 'trading/fetchInstruments',
      fetchPositions: 'trading/fetchPositions',
      fetchActiveOrders: 'trading/fetchActiveOrders',
      placeOrderAction: 'trading/placeOrder',
      cancelOrderAction: 'trading/cancelOrder',
      initializeWebSocket: 'trading/initializeWebSocket',
    }),

    calculateSpread() {
      if (this.orderBook.asks.length && this.orderBook.bids.length) {
        const lowestAsk = parseFloat(this.orderBook.asks[0][0])
        const highestBid = parseFloat(this.orderBook.bids[0][0])
        return (lowestAsk - highestBid).toFixed(2)
      }
      return '0.00'
    },

    async handleInstrumentChange() {
      const instrument = this.instruments.find(
        (i) => i.instId === this.selectedInstrumentId
      )
      this.$store.commit('trading/SET_SELECTED_INSTRUMENT', instrument)
      await Promise.all([this.fetchPositions(), this.fetchActiveOrders()])
    },

    async placeOrder() {
      try {
        const orderData = {
          instId: this.selectedInstrumentId,
          marginMode: 'cross', // or 'isolated'
          positionSide: 'net', // or 'long'/'short' for hedge mode
          side: this.positionSide === 'long' ? 'buy' : 'sell',
          orderType: this.orderType,
          size: this.orderSize.toString(),
          leverage: this.leverage.toString(),
        }

        if (this.orderType === 'limit') {
          orderData.price = this.orderPrice.toString()
        }

        if (this.tpPrice) {
          orderData.tpTriggerPrice = this.tpPrice.toString()
          orderData.tpOrderPrice = this.tpPrice.toString()
        }

        if (this.slPrice) {
          orderData.slTriggerPrice = this.slPrice.toString()
          orderData.slOrderPrice = this.slPrice.toString()
        }

        await this.placeOrderAction(orderData)
        this.$toast.success('Order placed successfully')
      } catch (error) {
        this.$toast.error(error.message || 'Failed to place order')
      }
    },

    async cancelOrder(orderId) {
      try {
        await this.cancelOrderAction(orderId)
        this.$toast.success('Order cancelled successfully')
      } catch (error) {
        this.$toast.error(error.message || 'Failed to cancel order')
      }
    },

    async closePosition(position) {
      try {
        await this.placeOrderAction({
          instId: position.instId,
          marginMode: position.marginMode,
          positionSide: position.positionSide,
          side: position.positions > 0 ? 'sell' : 'buy',
          orderType: 'market',
          size: Math.abs(position.positions).toString(),
          reduceOnly: 'true',
        })
        this.$toast.success('Position closed successfully')
      } catch (error) {
        this.$toast.error(error.message || 'Failed to close position')
      }
    },

    startDataPolling() {
      setInterval(async () => {
        if (this.selectedInstrumentId) {
          await Promise.all([this.fetchPositions(), this.fetchActiveOrders()])
        }
      }, 5000)
    },
  },
}
</script>

<style scoped>
.trading-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.trading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trading-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  margin-bottom: 20px;
}

.order-book-section,
.trading-form,
.positions-section {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-book {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.trading-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-tabs,
.position-type {
  display: flex;
  gap: 10px;
}

.form-tabs button,
.position-type button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submit-button {
  padding: 12px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.positions-list,
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.position-item,
.order-item {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

button.active {
  background: #007bff;
  color: white;
}

.close-position,
.cancel-order {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  border: none;
  border-radius: 4px;
  background: #dc3545;
  color: white;
  cursor: pointer;
}
</style>
