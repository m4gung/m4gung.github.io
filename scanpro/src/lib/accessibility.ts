// Accessibility utilities and helpers

export interface FocusTrapOptions {
  onEscape?: () => void
  onTabForward?: () => void
  onTabBackward?: () => void
}

export function trapFocus(element: HTMLElement, options: FocusTrapOptions = {}): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
          options.onTabBackward?.()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
          options.onTabForward?.()
        }
      }
    } else if (e.key === 'Escape') {
      options.onEscape?.()
    }
  }

  element.addEventListener('keydown', handleKeyDown)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer()
  announcer.setAttribute('aria-live', priority)
  announcer.textContent = ''
  // Force reflow
  void announcer.offsetWidth
  announcer.textContent = message
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div')
  announcer.id = 'sr-announcer'
  announcer.setAttribute('aria-live', 'polite')
  announcer.setAttribute('aria-atomic', 'true')
  announcer.style.position = 'absolute'
  announcer.style.left = '-9999px'
  announcer.style.width = '1px'
  announcer.style.height = '1px'
  announcer.style.overflow = 'hidden'
  document.body.appendChild(announcer)
  return announcer
}

export function setFocusVisible(element: HTMLElement): void {
  element.classList.add('focus-visible')
  element.addEventListener('blur', () => {
    element.classList.remove('focus-visible')
  }, { once: true })
}

export function createAriaLabel(label: string, describedBy?: string): Record<string, string> {
  const attrs: Record<string, string> = { 'aria-label': label }
  if (describedBy) {
    attrs['aria-describedby'] = describedBy
  }
  return attrs
}

export function generateId(prefix = 'el'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

export interface KeyboardNavigationOptions {
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onHome?: () => void
  onEnd?: () => void
}

export function handleKeyboardNavigation(e: KeyboardEvent, options: KeyboardNavigationOptions): void {
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      options.onEnter?.()
      break
    case ' ':
      e.preventDefault()
      options.onSpace?.()
      break
    case 'Escape':
      options.onEscape?.()
      break
    case 'ArrowUp':
      e.preventDefault()
      options.onArrowUp?.()
      break
    case 'ArrowDown':
      e.preventDefault()
      options.onArrowDown?.()
      break
    case 'ArrowLeft':
      e.preventDefault()
      options.onArrowLeft?.()
      break
    case 'ArrowRight':
      e.preventDefault()
      options.onArrowRight?.()
      break
    case 'Home':
      e.preventDefault()
      options.onHome?.()
      break
    case 'End':
      e.preventDefault()
      options.onEnd?.()
      break
  }
}

export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0
}

export function getFocusableChildren(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(el => isElementVisible(el))
}

export function moveFocus(direction: 'next' | 'previous', container: HTMLElement): boolean {
  const focusable = getFocusableChildren(container)
  const currentIndex = focusable.findIndex(el => el === document.activeElement)
  
  if (currentIndex === -1) {
    focusable[0]?.focus()
    return true
  }

  const nextIndex = direction === 'next' 
    ? (currentIndex + 1) % focusable.length
    : (currentIndex - 1 + focusable.length) % focusable.length

  focusable[nextIndex]?.focus()
  return true
}

export function createSkipLink(targetId: string, label = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.textContent = label
  link.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded'
  return link
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = (e: MediaQueryListEvent) => callback(e.matches)
  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}

// High contrast detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches
}

// Color scheme detection
export function prefersColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'no-preference'
}

export function onColorSchemeChange(callback: (scheme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light')
  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}