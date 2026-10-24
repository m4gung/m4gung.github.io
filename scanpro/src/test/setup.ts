import { afterEach, beforeEach, expect, describe, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Runs after every test case.
afterEach(() => {
  cleanup()
})
