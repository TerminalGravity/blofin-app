<template>
  <div class="app-layout">
    <nav class="navbar">
      <div class="nav-brand">BloFin Trading</div>
      <div class="nav-links">
        <NuxtLink to="/" class="nav-link"> Home </NuxtLink>
        <NuxtLink to="/trading" class="nav-link"> Trading </NuxtLink>
        <NuxtLink to="/settings" class="nav-link"> Settings </NuxtLink>
      </div>
    </nav>

    <main class="main-content">
      <Nuxt />
    </main>
  </div>
</template>

<script>
export default {
  name: 'DefaultLayout',
}
</script>

<style>
html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  box-sizing: border-box;
  font-size: 16px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  background-color: #f8f9fa;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.nuxt-link-exact-active {
  color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.main-content {
  flex: 1;
  padding: 2rem;
}
</style>
