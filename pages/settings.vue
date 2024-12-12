<template>
  <div class="settings-page">
    <div class="settings-container">
      <h2>API Settings</h2>

      <div class="settings-form">
        <div class="form-group">
          <label>API Key</label>
          <input
            type="password"
            v-model="credentials.apiKey"
            placeholder="Enter your API key"
          />
        </div>

        <div class="form-group">
          <label>Secret Key</label>
          <input
            type="password"
            v-model="credentials.secretKey"
            placeholder="Enter your secret key"
          />
        </div>

        <div class="form-group">
          <label>Passphrase</label>
          <input
            type="password"
            v-model="credentials.passphrase"
            placeholder="Enter your passphrase"
          />
        </div>

        <button class="save-button" @click="saveCredentials">
          Save Credentials
        </button>
      </div>

      <div class="trading-preferences">
        <h2>Trading Preferences</h2>

        <div class="form-group">
          <label>Default Margin Mode</label>
          <select v-model="preferences.marginMode">
            <option value="cross">Cross</option>
            <option value="isolated">Isolated</option>
          </select>
        </div>

        <div class="form-group">
          <label>Position Mode</label>
          <select v-model="preferences.positionMode">
            <option value="net_mode">One-way Mode</option>
            <option value="long_short_mode">Hedge Mode</option>
          </select>
        </div>

        <button class="save-button" @click="savePreferences">
          Save Preferences
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import blofinAPI from '@/services/blofin-api'

export default {
  name: 'SettingsPage',

  data() {
    return {
      credentials: {
        apiKey: '',
        secretKey: '',
        passphrase: '',
      },
      preferences: {
        marginMode: 'cross',
        positionMode: 'net_mode',
      },
    }
  },

  async created() {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('blofinCredentials')
    if (savedCredentials) {
      this.credentials = JSON.parse(savedCredentials)
      this.$store.commit('trading/SET_CREDENTIALS', this.credentials)
    }

    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('blofinPreferences')
    if (savedPreferences) {
      this.preferences = JSON.parse(savedPreferences)
    }

    // If we have credentials, fetch current settings from API
    if (this.credentials.apiKey) {
      try {
        const [marginMode, positionMode] = await Promise.all([
          blofinAPI.request('GET', '/account/margin-mode'),
          blofinAPI.request('GET', '/account/position-mode'),
        ])

        if (marginMode.code === '0') {
          this.preferences.marginMode = marginMode.data.marginMode
        }
        if (positionMode.code === '0') {
          this.preferences.positionMode = positionMode.data.positionMode
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
      }
    }
  },

  methods: {
    async saveCredentials() {
      try {
        // Test the credentials with a simple API call
        blofinAPI.setCredentials(
          this.credentials.apiKey,
          this.credentials.secretKey,
          this.credentials.passphrase
        )

        const response = await blofinAPI.request('GET', '/account/positions')

        if (response.code === '0') {
          // Save credentials to localStorage
          localStorage.setItem(
            'blofinCredentials',
            JSON.stringify(this.credentials)
          )

          // Update store
          this.$store.commit('trading/SET_CREDENTIALS', this.credentials)

          this.$toast.success('API credentials saved successfully')
        } else {
          throw new Error('Invalid credentials')
        }
      } catch (error) {
        this.$toast.error('Failed to validate API credentials')
        console.error('Error saving credentials:', error)
      }
    },

    async savePreferences() {
      try {
        // Update margin mode
        const marginModeResponse = await blofinAPI.request(
          'POST',
          '/account/set-margin-mode',
          { marginMode: this.preferences.marginMode }
        )

        // Update position mode
        const positionModeResponse = await blofinAPI.request(
          'POST',
          '/account/set-position-mode',
          { positionMode: this.preferences.positionMode }
        )

        if (
          marginModeResponse.code === '0' &&
          positionModeResponse.code === '0'
        ) {
          // Save preferences to localStorage
          localStorage.setItem(
            'blofinPreferences',
            JSON.stringify(this.preferences)
          )

          this.$toast.success('Trading preferences saved successfully')
        } else {
          throw new Error('Failed to update preferences')
        }
      } catch (error) {
        this.$toast.error('Failed to save trading preferences')
        console.error('Error saving preferences:', error)
      }
    },
  },
}
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.settings-form,
.trading-preferences {
  margin-bottom: 30px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

input,
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.save-button {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.save-button:hover {
  background: #0056b3;
}
</style>
