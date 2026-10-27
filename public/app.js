(function () {
  var API = (window.SAIP_API || 'https://saip-sync.onrender.com').replace(/\/$/, '')
  var TOKEN_KEY = 'saip_client_portal_token'
  var app = document.getElementById('app')

  function money(n) {
    return 'R ' + Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  function dateFmt(iso) {
    if (!iso) return '—'
    try {
      return new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch {
      return String(iso).slice(0, 10)
    }
  }
  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {}
  }
  function pill(status) {
    var s = String(status || '').toLowerCase()
    var cls = 'pill-muted'
    if (['paid', 'accepted', 'done', 'resolved'].indexOf(s) >= 0) cls = 'pill-ok'
    else if (['overdue', 'rejected'].indexOf(s) >= 0) cls = 'pill-bad'
    else if (['unpaid', 'partial', 'sent', 'open', 'waiting', 'in_progress'].indexOf(s) >= 0) cls = 'pill-warn'
    return '<span class="' + cls + '" style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">' + (status || '—') + '</span>'
  }

  async function api(path, opts) {
    opts = opts || {}
    var headers = Object.assign({ Accept: 'application/json', 'Content-Type': 'application/json' }, opts.headers || {})
    var t = token()
    if (t) headers.Authorization = 'Bearer ' + t
    var res = await fetch(API + path, Object.assign({}, opts, { headers: headers }))
    var j = await res.json().catch(function () { return {} })
    if (!res.ok) throw new Error(j.error || ('Request failed (' + res.status + ')'))
    return j
  }

  function renderLogin(err) {
    app.innerHTML =
      '<div class="shell"><div class="card login-card">' +
      '<div class="brand">Client Portal</div>' +
      '<h1>Sign in</h1>' +
      '<p class="muted">Use the email and PIN your service provider shared with you.</p>' +
      '<label>Email</label><input id="email" type="email" autocomplete="username" placeholder="you@company.co.za" />' +
      '<label>PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="6-digit PIN" />' +
      '<div style="margin-top:1.1rem"><button class="btn" id="go" style="width:100%">Sign in</button></div>' +
      (err ? '<p class="err">' + err + '</p>' : '') +
      '<p class="muted" style="margin-top:1rem;font-size:12px">Powered by SA Invoice Pro</p>' +
      '</div></div>'
    document.getElementById('go').onclick = doLogin
    document.getElementById('pin').onkeydown = function (e) {
      if (e.key === 'Enter') doLogin()
    }
  }

  async function doLogin() {
    var email = document.getElementById('email').value.trim()
    var pin = document.getElementById('pin').value.trim()
    var btn = document.getElementById('go')
    btn.disabled = true
    btn.textContent = 'Signing in…'
    try {
      var j = await api('/api/client-portal/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, pin: pin }),
      })
      setToken(j.token)
      await showApp()
    } catch (e) {
      renderLogin(e.message || 'Sign-in failed')
    }
  }

  function logout() {
    setToken('')
    renderLogin()
  }

  async function showApp() {
    app.innerHTML = '<div class="shell"><p class="muted">Loading your account…</p></div>'
    try {
      var dash = await api('/api/client-portal/dashboard')
      var tab = 'overview'
      function paint() {
        var company = (dash.company && (dash.company.name || dash.company.companyName)) || 'Your account'
        var client = dash.client || {}
        var sum = dash.summary || {}
        var html =
          '<div class="shell">' +
          '<div class="topbar">' +
          '<div><div class="brand">' + company + '</div>' +
          '<div class="muted">Signed in as ' + (client.name || client.email || '') + '</div></div>' +
          '<button class="btn btn-ghost btn-sm" id="out">Sign out</button>' +
          '</div>' +
          '<div class="tabs">' +
          ['overview', 'invoices', 'quotes', 'service', 'payments'].map(function (id) {
            return '<button class="tab' + (tab === id ? ' on' : '') + '" data-tab="' + id + '">' +
              id.charAt(0).toUpperCase() + id.slice(1) + '</button>'
          }).join('') +
          '</div>'

        if (tab === 'overview') {
          html +=
            '<div class="card stats">' +
            '<div class="stat"><b>' + money(sum.openBalance) + '</b><span class="muted">Open balance</span></div>' +
            '<div class="stat"><b>' + (sum.invoices || 0) + '</b><span class="muted">Invoices</span></div>' +
            '<div class="stat"><b>' + (sum.quotes || 0) + '</b><span class="muted">Quotes</span></div>' +
            '<div class="stat"><b>' + (sum.tickets || 0) + '</b><span class="muted">Service jobs</span></div>' +
            '</div>' +
            '<div class="card"><p class="muted" style="margin:0">Use the tabs to review invoices, accept quotes, and track service jobs.</p></div>'
        }

        if (tab === 'invoices') {
          html += '<div class="card"><strong>Invoices</strong>'
          var inv = dash.invoices || []
          if (!inv.length) html += '<p class="muted">No invoices yet.</p>'
          inv.forEach(function (i) {
            html +=
              '<div class="row"><div><strong>' + (i.number || i.id || 'Invoice') + '</strong>' +
              '<div class="muted">' + dateFmt(i.date || i.issuedAt) + ' · ' + money(i.amountDue != null ? i.amountDue : i.total) + '</div></div>' +
              pill(i.status) + '</div>'
          })
          html += '</div>'
        }

        if (tab === 'quotes') {
          html += '<div class="card"><strong>Quotes</strong>'
          var qs = dash.quotes || []
          if (!qs.length) html += '<p class="muted">No quotes.</p>'
          qs.forEach(function (q) {
            var st = String(q.status || '').toLowerCase()
            var can = st === 'sent' || st === 'draft' || !st
            html +=
              '<div class="row"><div style="flex:1"><strong>' + (q.number || q.id || 'Quote') + '</strong>' +
              '<div class="muted">' + dateFmt(q.date || q.createdAt) + ' · ' + money(q.total) + '</div>' +
              (can
                ? '<div class="actions">' +
                  '<button class="btn btn-ok btn-sm" data-q="' + q.id + '" data-d="accepted">Accept</button>' +
                  '<button class="btn btn-bad btn-sm" data-q="' + q.id + '" data-d="rejected">Decline</button>' +
                  '</div>'
                : '') +
              '</div>' + pill(q.status) + '</div>'
          })
          html += '</div>'
        }

        if (tab === 'service') {
          html += '<div class="card"><strong>Service / jobs</strong>'
          var ts = dash.tickets || []
          if (!ts.length) html += '<p class="muted">No open service jobs.</p>'
          ts.forEach(function (t) {
            html +=
              '<div class="row"><div><strong>' + (t.title || t.subject || t.number || t.id) + '</strong>' +
              '<div class="muted">' + (t.description || '').slice(0, 120) + '</div></div>' +
              pill(t.status) + '</div>'
          })
          html += '</div>'
        }

        if (tab === 'payments') {
          html += '<div class="card"><strong>Payments</strong>'
          var ps = dash.payments || []
          if (!ps.length) html += '<p class="muted">No payments recorded yet.</p>'
          ps.forEach(function (p) {
            html +=
              '<div class="row"><div><strong>' + money(p.amount) + '</strong>' +
              '<div class="muted">' + dateFmt(p.date || p.paidAt) + ' · ' + (p.method || p.reference || '') + '</div></div></div>'
          })
          html += '</div>'
        }

        html += '</div>'
        app.innerHTML = html
        document.getElementById('out').onclick = logout
        app.querySelectorAll('[data-tab]').forEach(function (el) {
          el.onclick = function () {
            tab = el.getAttribute('data-tab')
            paint()
          }
        })
        app.querySelectorAll('[data-q]').forEach(function (el) {
          el.onclick = async function () {
            el.disabled = true
            try {
              await api('/api/client-portal/quote-decision', {
                method: 'POST',
                body: JSON.stringify({ quoteId: el.getAttribute('data-q'), decision: el.getAttribute('data-d') }),
              })
              dash = await api('/api/client-portal/dashboard')
              paint()
            } catch (e) {
              alert(e.message || 'Could not save decision')
              el.disabled = false
            }
          }
        })
      }
      paint()
    } catch (e) {
      setToken('')
      renderLogin(e.message || 'Session expired')
    }
  }

  if (token()) showApp()
  else renderLogin()
})()
