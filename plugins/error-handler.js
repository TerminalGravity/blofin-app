export default ({ app }, inject) => {
  // Global error handler
  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error)

    let message = 'An unexpected error occurred'

    if (error.response) {
      // API error with response
      message = error.response.data?.msg || error.message
    } else if (error.message) {
      // Standard error object
      message = error.message
    } else if (typeof error === 'string') {
      // String error
      message = error
    }

    // Show toast notification
    app.$toast.error(message, {
      duration: 5000,
      keepOnHover: true,
    })

    return message
  }

  // Inject the error handler into the Vue instance
  inject('handleError', handleError)

  // Add Axios interceptor for API errors
  if (app.$axios) {
    app.$axios.onError((error) => {
      handleError(error, 'API Request')
      return Promise.reject(error)
    })
  }
}
