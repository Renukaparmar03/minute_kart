/**
 * Safe Area Inset Manager for Android, iOS, PWA, and WebViews
 * 
 * Accurately measures and sets CSS variables (--safe-area-bottom, --safe-area-top)
 * on :root so that bottom navigation bars, full-screen dialogs, and floating elements
 * are never clipped behind Android 3-button navigation bars, gesture bars, or iOS home indicators.
 */

export function initSafeAreaInsets() {
  if (typeof window === 'undefined') return

  const applyInsets = () => {
    try {
      const isDesktop = window.innerWidth >= 768

      if (isDesktop) {
        document.documentElement.style.setProperty('--safe-area-bottom', '0px')
        document.documentElement.style.setProperty('--safe-area-top', '0px')
        return
      }

      // 1. Measure CSS env(safe-area-inset-bottom) using a hidden probe element
      let cssBottomInset = 0
      let cssTopInset = 0

      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:0;height:0;' +
        'padding-bottom:env(safe-area-inset-bottom, 0px);' +
        'padding-top:env(safe-area-inset-top, 0px);' +
        'visibility:hidden;pointer-events:none;z-index:-9999;'
      document.body.appendChild(probe)
      const computed = window.getComputedStyle(probe)
      cssBottomInset = parseFloat(computed.paddingBottom) || 0
      cssTopInset = parseFloat(computed.paddingTop) || 0
      document.body.removeChild(probe)

      // 2. Identify native shells (Flutter InAppWebView, React Native WebView, Android WebView) or standalone PWA
      const protocol = String(window.location?.protocol || '').toLowerCase()
      const userAgent = String(window.navigator?.userAgent || '').toLowerCase()
      const isNativeShell = Boolean(
        window.flutter_inappwebview ||
        window.ReactNativeWebView ||
        protocol === 'file:' ||
        userAgent.includes(' wv') ||
        userAgent.includes('; wv') ||
        userAgent.includes('flutterwebview') ||
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      )
      const isAndroid = userAgent.includes('android')

      // 3. Determine bottom inset:
      // If browser/OS provides env(safe-area-inset-bottom), use at least that value.
      let finalBottom = cssBottomInset

      // On Android phones in native shells or full-screen WebView where 3-button navigation bar
      // (approx 48px) overlaps the viewport but env() returns 0, provide a robust 48px fallback.
      if (finalBottom < 24 && (isNativeShell || isAndroid)) {
        // If window occupies virtually full screen height (edge-to-edge mode)
        const screenDiff = window.screen.height - window.innerHeight
        if (screenDiff < 80 || isNativeShell) {
          finalBottom = Math.max(finalBottom, 48)
        } else {
          finalBottom = Math.max(finalBottom, 14)
        }
      } else if (finalBottom < 12) {
        // Default clean breathing room on mobile
        finalBottom = 12
      }

      // Top safe area
      let finalTop = cssTopInset
      if (finalTop < 24 && (isNativeShell || isAndroid)) {
        finalTop = Math.max(finalTop, 36)
      } else if (finalTop < 16) {
        finalTop = 16
      }

      document.documentElement.style.setProperty('--safe-area-bottom', `${Math.round(finalBottom)}px`)
      document.documentElement.style.setProperty('--safe-area-top', `${Math.round(finalTop)}px`)
    } catch (e) {
      // Graceful fallback
      document.documentElement.style.setProperty('--safe-area-bottom', '16px')
    }
  }

  // Run immediately and on resize/orientation changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInsets, { once: true })
  } else {
    applyInsets()
  }

  window.addEventListener('resize', applyInsets, { passive: true })
  window.addEventListener('orientationchange', applyInsets, { passive: true })
}
