window.__ModuleLoader__.load({
  id: '@davidmaxlll/travel-quote-se',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useRef, useState } = React
    const APP_URL = 'http://127.0.0.1:17866/'
    const TAB_KEY = 'tq-se.sidebar.tabId'
    const markTextColor = (hex) => {
      const value = String(hex || '').replace('#', '')
      if (!/^[0-9a-f]{6}$/i.test(value)) return '#fff'
      const r = parseInt(value.slice(0, 2), 16) / 255
      const g = parseInt(value.slice(2, 4), 16) / 255
      const b = parseInt(value.slice(4, 6), 16) / 255
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      return lum > 0.62 ? '#12312F' : '#fff'
    }

    function currentTabs(ctx) {
      try { return ctx.sidebarRight?.openTabs?.getSnapshot?.() || [] } catch { return [] }
    }
    function savedTabId() {
      try { return localStorage.getItem(TAB_KEY) || '' } catch { return '' }
    }
    function rememberTabId(tabId) {
      try { if (tabId) localStorage.setItem(TAB_KEY, tabId) } catch {}
    }

    function TravelQuoteAction({ wide, onOpen }) {
      const [open, setOpen] = useState(false)
      const [pos, setPos] = useState({ left: 16, top: 80 })
      const [accent, setAccent] = useState('#12312F')
      const anchorRef = useRef(null)
      const menuRef = useRef(null)

      useEffect(() => {
        let alive = true
        const loadTheme = () => {
          fetch(APP_URL + '__theme', { cache: 'no-store' })
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
              if (alive && /^#[0-9a-f]{6}$/i.test(String(data?.primary || ''))) setAccent(String(data.primary).toLowerCase())
            })
            .catch(() => {})
        }
        loadTheme()
        const timer = setInterval(loadTheme, 10000)
        window.addEventListener('focus', loadTheme)
        return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', loadTheme) }
      }, [])

      useEffect(() => {
        if (!open) return
        const close = (event) => {
          if (anchorRef.current?.contains(event.target)) return
          if (menuRef.current?.contains(event.target)) return
          setOpen(false)
        }
        const esc = (event) => { if (event.key === 'Escape') setOpen(false) }
        window.addEventListener('pointerdown', close)
        window.addEventListener('keydown', esc)
        return () => {
          window.removeEventListener('pointerdown', close)
          window.removeEventListener('keydown', esc)
        }
      }, [open])

      const toggle = () => {
        const rect = anchorRef.current?.getBoundingClientRect()
        if (rect) setPos({ left: Math.max(8, rect.left), top: Math.max(8, rect.top - 260) })
        setOpen((value) => !value)
      }

      const item = (label, action) => h('button', {
        type: 'button',
        role: 'menuitem',
        className: 'tq-menu-item',
        onClick: () => { setOpen(false); onOpen(action) },
      }, label)

      return h(React.Fragment, null,
        h('style', null, `
          .tq-wrap{display:flex;align-items:center;gap:2px;width:100%;min-width:0}
          .tq-sidebar-action{font-family:inherit;display:flex;align-items:center;gap:8px;min-width:0;flex:1;min-height:34px;padding:0 7px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-text-primary,#172B2C);text-decoration:none;font-size:13px;cursor:pointer;box-sizing:border-box;text-align:left}
          .tq-sidebar-action:hover,.tq-sidebar-caret:hover{background:var(--dsw-alias-bg-hover,#F1F4F1)}
          .tq-sidebar-action:focus-visible,.tq-sidebar-caret:focus-visible{outline:2px solid var(--dsw-alias-accent,#0C6B63);outline-offset:2px}
          .tq-sidebar-mark{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;border-radius:6px;background:#12312F;color:#fff;font-size:9px;font-weight:700;letter-spacing:-.4px}
          .tq-sidebar-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .tq-sidebar-caret{display:flex;align-items:center;justify-content:center;width:29px;height:34px;flex:none;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-text-secondary,#6F7D78);cursor:pointer;font-size:16px}
          .tq-menu{position:fixed;z-index:100000;width:190px;padding:5px;border:1px solid var(--dsw-alias-border,#E3E9E4);border-radius:9px;background:var(--dsw-alias-bg-elevated,#fff);box-shadow:0 10px 30px rgba(0,0,0,.16);display:flex;flex-direction:column;gap:2px}
          .tq-menu-item{display:block;width:100%;padding:8px 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-text-primary,#172B2C);font:inherit;font-size:12px;text-align:left;cursor:pointer}
          .tq-menu-item:hover{background:var(--dsw-alias-bg-hover,#F1F4F1)}
          .tq-menu-sep{height:1px;background:var(--dsw-alias-border,#E3E9E4);margin:3px 4px}
        `),
        h('div', { className: 'tq-wrap', ref: anchorRef },
          h('button', {
            type: 'button',
            className: 'tq-sidebar-action',
            title: '游乐 Svelte',
            'aria-label': '打开游乐 Svelte',
            onClick: () => onOpen(''),
          },
          h('span', { className: 'tq-sidebar-mark', 'aria-hidden': true, style: { background: accent, color: markTextColor(accent) } }, 'TQ'),
          wide ? h('span', { className: 'tq-sidebar-label' }, '游乐 Svelte') : null,
          ),
          h('button', {
            type: 'button',
            className: 'tq-sidebar-caret',
            title: '快捷动作',
            'aria-label': '游乐 Svelte 快捷动作',
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            onClick: toggle,
          }, '▾'),
        ),
        open ? h('div', { className: 'tq-menu', role: 'menu', ref: menuRef, style: pos },
          item('浏览器中打开', '__external__'),
          item('新建报价', '?action=new'),
          item('继续上次报价', '?action=last'),
        ) : null,
      )
    }

    return {
      inject: ['slots', 'sidebarRight'],
      apply(ctx) {
        let openingTab = false
        const open = (query = '') => {
          if (query === '__external__') {
            window.open(APP_URL, 'travel-quote-se')
            return
          }
          const url = query ? `${APP_URL}?embed=1&${query.slice(1)}` : `${APP_URL}?embed=1`
          try {
            const tabs = currentTabs(ctx)
            const saved = savedTabId()
            const existing = tabs.find((tab) => tab.tabId === saved && tab.kind === 'browser')
            if (existing && query && ctx.sidebarRight?.openTab) {
              ctx.sidebarRight.openTab('browser', { params: { url }, replaceTab: existing.tabId })
              return
            }
            if (existing && ctx.sidebarRight?.focus) {
              ctx.sidebarRight.focus(existing.tabId)
              if (ctx.sidebarRight?.toggleExpanded && !ctx.sidebarRight.isExpanded?.()) ctx.sidebarRight.toggleExpanded()
              return
            }
            if (ctx.sidebarRight?.openTab) {
              if (openingTab) return
              openingTab = true
              setTimeout(() => { openingTab = false }, 900)
              const before = new Set(tabs.map((tab) => tab.tabId))
              ctx.sidebarRight.openTab('browser', { params: { url } })
              setTimeout(() => {
                const created = currentTabs(ctx).find((tab) => tab.kind === 'browser' && !before.has(tab.tabId))
                if (created) rememberTabId(created.tabId)
              }, 120)
              return
            }
          } catch (error) {
            console.warn('Travel Quote SE sidebar browser failed, falling back to a new tab', error)
          }
          window.open(url, 'travel-quote-se')
        }
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'travel-quote-se',
          order: 100,
          label: '游乐 Svelte',
        }, (props) => h(TravelQuoteAction, { ...props, onOpen: open })))
      },
    }
  },
})
