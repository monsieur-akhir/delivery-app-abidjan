<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <router-view />
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useSocketStore } from '@/stores/socket'
import { mapState } from 'pinia'

export default {
  name: 'App',
  computed: {
    ...mapState(useThemeStore, ['isDarkMode'])
  },
  created() {
    const authStore = useAuthStore()
    authStore.initAuth()
    
    // Initialiser le store de WebSocket après l'authentification
    const socketStore = useSocketStore()
    socketStore.initSocket()
  }
}
</script>

<style>
:root {
  --primary-color: #FF6B00;
  --primary-light: #FFB74D;
  --primary-dark: #E65100;
  --secondary-color: #4CAF50;
  --secondary-light: #81C784;
  --secondary-dark: #388E3C;
  --danger-color: #F44336;
  --warning-color: #FFC107;
  --info-color: #2196F3;
  --success-color: #4CAF50;
  --text-color: #212121;
  --text-secondary: #757575;
  --background-color: #FFFFFF;
  --background-secondary: #F5F5F5;
  --border-color: #E0E0E0;
  --card-background: #FFFFFF;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

.dark-mode {
  --primary-color: #FF6B00;
  --primary-light: #FFB74D;
  --primary-dark: #E65100;
  --secondary-color: #4CAF50;
  --secondary-light: #81C784;
  --secondary-dark: #388E3C;
  --danger-color: #F44336;
  --warning-color: #FFC107;
  --info-color: #2196F3;
  --success-color: #4CAF50;
  --text-color: #FFFFFF;
  --text-secondary: #B0B0B0;
  --background-color: #121212;
  --background-secondary: #1E1E1E;
  --border-color: #2C2C2C;
  --card-background: #1E1E1E;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  color: #FFFFFF;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

.btn-secondary {
  color: #FFFFFF;
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}

.btn-secondary:hover {
  background-color: var(--secondary-dark);
  border-color: var(--secondary-dark);
}

.btn-danger {
  color: #FFFFFF;
  background-color: var(--danger-color);
  border-color: var(--danger-color);
}

.btn-danger:hover {
  background-color: #D32F2F;
  border-color: #D32F2F;
}

.btn-outline {
  color: var(--primary-color);
  background-color: transparent;
  border-color: var(--primary-color);
}

.btn-outline:hover {
  color: #FFFFFF;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
}

.alert {
  position: relative;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeeba;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.d-flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.justify-content-between {
  justify-content: space-between;
}

.justify-content-center {
  justify-content: center;
}

.align-items-center {
  align-items: center;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mt-5 {
  margin-top: 3rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mb-5 {
  margin-bottom: 3rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.ml-3 {
  margin-left: 1rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mr-3 {
  margin-right: 1rem;
}

.p-1 {
  padding: 0.25rem;
}

.p-2 {
  padding: 0.5rem;
}

.p-3 {
  padding: 1rem;
}

.p-4 {
  padding: 1.5rem;
}

.p-5 {
  padding: 3rem;
}

.w-100 {
  width: 100%;
}

.h-100 {
  height: 100%;
}

.rounded {
  border-radius: 4px;
}

.rounded-circle {
  border-radius: 50%;
}

.shadow {
  box-shadow: 0 2px 8px var(--shadow-color);
}

.text-primary {
  color: var(--primary-color);
}

.text-secondary {
  color: var(--text-secondary);
}

.text-success {
  color: var(--success-color);
}

.text-danger {
  color: var(--danger-color);
}

.text-warning {
  color: var(--warning-color);
}

.text-info {
  color: var(--info-color);
}

.bg-primary {
  background-color: var(--primary-color);
}

.bg-secondary {
  background-color: var(--background-secondary);
}

.bg-success {
  background-color: var(--success-color);
}

.bg-danger {
  background-color: var(--danger-color);
}

.bg-warning {
  background-color: var(--warning-color);
}

.bg-info {
  background-color: var(--info-color);
}

.font-weight-bold {
  font-weight: 700;
}

.font-weight-normal {
  font-weight: 400;
}

.font-weight-light {
  font-weight: 300;
}

.text-uppercase {
  text-transform: uppercase;
}

.text-lowercase {
  text-transform: lowercase;
}

.text-capitalize {
  text-transform: capitalize;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-nowrap {
  white-space: nowrap;
}

.text-break {
  word-break: break-word;
  word-wrap: break-word;
}

.text-muted {
  color: var(--text-secondary);
}

.invisible {
  visibility: hidden;
}

.visible {
  visibility: visible;
}

.d-none {
  display: none;
}

.d-block {
  display: block;
}

.d-inline {
  display: inline;
}

.d-inline-block {
  display: inline-block;
}

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}

.position-fixed {
  position: fixed;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-auto {
  overflow: auto;
}

.overflow-scroll {
  overflow: scroll;
}

.overflow-visible {
  overflow: visible;
}

.border {
  border: 1px solid var(--border-color);
}

.border-top {
  border-top: 1px solid var(--border-color);
}

.border-right {
  border-right: 1px solid var(--border-color);
}

.border-bottom {
  border-bottom: 1px solid var(--border-color);
}

.border-left {
  border-left: 1px solid var(--border-color);
}

.border-0 {
  border: 0;
}

.border-primary {
  border-color: var(--primary-color);
}

.border-secondary {
  border-color: var(--text-secondary);
}

.border-success {
  border-color: var(--success-color);
}

.border-danger {
  border-color: var(--danger-color);
}

.border-warning {
  border-color: var(--warning-color);
}

.border-info {
  border-color: var(--info-color);
}
</style>
