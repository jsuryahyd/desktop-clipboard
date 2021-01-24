// part of polyfill for preventable 'will-navigate' for webviews
// https://github.com/electron/electron/issues/1378
// add webview listeners within window.addEventListener('load', ...) and add at least one

document.addEventListener('DOMContentLoaded', () => {
  const {addEventListener, removeEventListener} = WebView.prototype
  const webviews = new WeakMap()

  WebView.prototype.addEventListener = function (type, listener) {
    if (!webviews.has(this)) {
      const willNavigateListeners = new Set()
      webviews.set(this, willNavigateListeners)

      addEventListener.call(this, 'will-navigate', (event) => {
        let defaultPrevented = false

        const newEventProperties = {
          cancelable: true,
          preventDefault () {
            defaultPrevented = true
          },
          get defaultPrevented () {
            return defaultPrevented
          }
        }

        const eventProxy = new Proxy(event, {
          get (event, property) {
            return newEventProperties[property] === undefined ? event[property] : newEventProperties[property]
          }
        })

        for (const listener of willNavigateListeners) {
          listener(eventProxy)
        }

        if (!defaultPrevented) {
          this.src = event.url
        }
      })
    }

    if (type === 'will-navigate') {
      if (typeof listener !== 'function') {
        throw new TypeError('Expected listener to be function')
      }

      webviews.get(this).add(listener)
    } else {
      addEventListener.call(this, type, listener)
    }
  }

  WebView.prototype.removeEventListener = function (type, listener) {
    if (type === 'will-navigate') {
      if (typeof listener !== 'function') {
        throw new TypeError('Expected listener to be function')
      }

      webviews.get(this).delete(listener)
    } else {
      removeEventListener.call(this, type, listener)
    }
  }
})