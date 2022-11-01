import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'yp82ef',
  video: false,
  defaultCommandTimeout: 10000,
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
