import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.SESSION_SECRET = 'test-secret'
process.env.IRACING_CLIENT_ID = 'test-client'