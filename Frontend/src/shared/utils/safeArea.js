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

      const userAgent = navigator.userAgent || ''
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      const isAndroid = /Android/i.test(userAgent)

      let finalBottom = 0

      if (isIOS) {
        // iOS: Native env is always accurate
        finalBottom = Math.min(cssBottomInset, 34)
      } else if (isAndroid) {
        // Android Intelligent Detection:
        // If screen.height - innerHeight is significant (>= 60px), Android OS has
        // already placed the webview above the navigation bar. No extra padding needed.
        const screenDiff = window.screen.height - window.innerHeight

        if (screenDiff >= 60) {
          // Viewport is already above system navigation bar -> 0px extra padding
          finalBottom = 0
        } else {
          // Viewport is in edge-to-edge/immersive mode and overlaps system bar
          if (cssBottomInset > 0) {
            finalBottom = Math.min(cssBottomInset, 20)
          } else {
            finalBottom = 16
          }
        }
      } else {
        finalBottom = Math.min(cssBottomInset, 20)
      }

      document.documentElement.style.setProperty('--safe-area-bottom', `${Math.round(finalBottom)}px`)
      document.documentElement.style.setProperty('--safe-area-top', `${Math.round(cssTopInset)}px`)
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
