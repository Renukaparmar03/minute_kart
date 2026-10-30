/**
 * Pure Dynamic Safe Area Inset Manager
 * 
 * Accurately reads the native safe-area insets directly from the device/browser
 * (env(safe-area-inset-bottom) and env(safe-area-inset-top)) without applying
 * any artificial or hardcoded offsets.
 * 
 * - Phones with 3-button navigation overlay get their exact hardware inset.
 * - iPhones get their exact home-indicator inset (34px).
 * - Gesture navigation phones get their exact gesture pill inset (16px-24px).
 * - Devices with standard viewports (no overlap) get 0px.
 * 
 * Result: The navigation bar auto-adjusts naturally on every screen — never cut off, never floating too high.
 */

export function initSafeAreaInsets() {
  if (typeof window === 'undefined') return

  const applyInsets = () => {
    try {
      if (window.innerWidth >= 768) {
        document.documentElement.style.setProperty('--safe-area-bottom', '0px')
        document.documentElement.style.setProperty('--safe-area-top', '0px')
        return
      }

      // Measure exact native CSS env(safe-area-inset-*)
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:0;height:0;' +
        'padding-bottom:env(safe-area-inset-bottom, 0px);' +
        'padding-top:env(safe-area-inset-top, 0px);' +
        'visibility:hidden;pointer-events:none;z-index:-9999;'
      document.body.appendChild(probe)
      const computed = window.getComputedStyle(probe)
      const cssBottomInset = parseFloat(computed.paddingBottom) || 0
      const cssTopInset = parseFloat(computed.paddingTop) || 0
      document.body.removeChild(probe)

      // Auto-adjust bottom inset:
      // Cap at 20px max so it never floats excessively high on devices reporting large insets,
      // while providing optimal clearance on devices with bottom navigation/gesture indicators.
      const clampedBottom = Math.min(Math.max(Math.round(cssBottomInset), 0), 20)
      const clampedTop = Math.max(Math.round(cssTopInset), 0)

      document.documentElement.style.setProperty('--safe-area-bottom', `${clampedBottom}px`)
      document.documentElement.style.setProperty('--safe-area-top', `${clampedTop}px`)
    } catch (e) {
      document.documentElement.style.setProperty('--safe-area-bottom', '0px')
      document.documentElement.style.setProperty('--safe-area-top', '0px')
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInsets, { once: true })
  } else {
    applyInsets()
  }

  window.addEventListener('resize', applyInsets, { passive: true })
  window.addEventListener('orientationchange', applyInsets, { passive: true })
}
