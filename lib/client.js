window.__ModuleLoader__.load({
  id: '@kongjianguan/dsh-model-alias',
  factory: function (require) {
    var module = { exports: {} }
    var React = require('react')

    // ---- styles ------------------------------------------------------------
    // Self-contained: the loader namespaces every plugin's <style> tag by the
    // data-plugin attribute, and the harness token vars keep it theme-aware.
    var CSS = [
      '.dma-section{display:flex;flex-direction:column;gap:12px;max-width:760px;color:var(--dsw-alias-label-primary)}',
      '.dma-heading{margin:0;font-size:18px;font-weight:600}',
      '.dma-intro{margin:0;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.dma-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.dma-note{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-warn-label);word-break:break-all}',
      // Settings controls live in a card, mirroring the native plugin-card
      // chrome (border-l2 / bg-layer-3 / radius-12) with bordered rows and a
      // right-aligned footer of native-style buttons.
      '.dma-card{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:0 16px}',
      '.dma-table{display:flex;flex-direction:column}',
      // Per-provider groups: a header row (name + count + rotating chevron),
      // with rows separated by hairlines inside each group and between groups.
      '.dma-group{display:flex;flex-direction:column;min-width:0}',
      '.dma-group+.dma-group{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.dma-group-header{appearance:none;box-sizing:border-box;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:none;border:0;border-radius:8px;align-items:center;gap:8px;padding:10px 2px 6px;display:flex;min-width:0}',
      '.dma-group-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.dma-group-name{min-width:0;flex:1;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}',
      '.dma-group-count{flex:none;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;white-space:nowrap}',
      '.dma-group-chevron{flex:none;color:var(--dsw-alias-label-tertiary);display:inline-flex;transition:transform .16s}',
      '.dma-group-chevron-open{transform:rotate(180deg)}',
      '.dma-group-body{display:flex;flex-direction:column;min-width:0}',
      '.dma-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.35fr) auto;gap:8px;align-items:center;padding:12px 0}',
      '.dma-row+.dma-row{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.dma-input{width:100%;box-sizing:border-box;height:34px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.5;padding:0 12px}',
      '.dma-input:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dma-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.dma-input-invalid,.dma-input-invalid:focus-visible{border-color:var(--dsw-alias-state-error-primary)}',
      '.dma-chip{display:flex;align-items:center;gap:6px;min-width:0}',
      '.dma-chip .dma-input{flex:1 1 auto;min-width:0}',
      '.dma-chip-tag{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;white-space:nowrap}',
      '.dma-chip-btn{font:inherit;color:var(--dsw-alias-label-secondary);background:none;border:none;cursor:pointer;padding:0;font-size:12px;line-height:1.5;white-space:nowrap}',
      '.dma-chip-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary)}',
      '.dma-chip-btn:disabled{opacity:.4;cursor:default}',
      '.dma-chip-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      // Native icon-button geometry: 28px circle, hover surface tint.
      '.dma-del{appearance:none;font:inherit;cursor:pointer;flex:none;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:none;border:none;border-radius:999px;display:inline-flex;justify-content:center;align-items:center;padding:0;font-size:14px;line-height:1}',
      '.dma-del:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}',
      '.dma-del:disabled{opacity:.4;cursor:default}',
      '.dma-del:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      // Native settings footer: right-aligned, separated by a hairline.
      '.dma-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l2);padding:12px 0 4px}',
      '.dma-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}',
      '.dma-btn-primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}',
      '.dma-btn-ghost{border-color:var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}',
      '.dma-btn-ghost:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}',
      '.dma-btn:disabled{opacity:.4;cursor:default}',
      '.dma-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dma-msg{font-size:12px;line-height:1.6;padding:6px 10px;border-radius:8px;word-break:break-all}',
      '.dma-msg-ok{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-state-success-tertiary)}',
      '.dma-msg-err{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover-danger)}',
      '.dma-empty{margin:0;padding:14px 0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}',
      '@media (max-width:560px){.dma-row{grid-template-columns:1fr;gap:6px}}',
    ].join('\n')

    // ---- pure editor helpers (twin of lib/client-editor.js) ---------------
    function flattenProviders(providers) {
      var rows = []
      if (providers !== null && typeof providers === 'object' && !Array.isArray(providers)) {
        Object.keys(providers).forEach(function (route) {
          var models = providers[route]
          if (models === null || typeof models !== 'object' || Array.isArray(models)) return
          Object.keys(models).forEach(function (dshId) {
            rows.push({ route: route, dshId: dshId, wireId: models[dshId] })
          })
        })
      }
      return rows.sort(function (a, b) {
        if (a.route !== b.route) return a.route < b.route ? -1 : 1
        return a.dshId < b.dshId ? -1 : a.dshId > b.dshId ? 1 : 0
      })
    }

    // Presentation-only grouping: table rows into per-provider groups. Each
    // entry keeps its original row index so the invalid[] marks and the
    // patchRow/removeRow handlers stay aligned with the flat rows state. The
    // blank-route group — the user's in-progress new row — sorts last.
    function groupRowsByRoute(rows) {
      var groups = []
      var byRoute = {}
      for (var i = 0; i < rows.length; i++) {
        var route = String(rows[i].route === undefined || rows[i].route === null ? '' : rows[i].route).trim()
        if (byRoute[route] === undefined) {
          byRoute[route] = []
          groups.push({ route: route, rows: byRoute[route] })
        }
        byRoute[route].push({ index: i, row: rows[i] })
      }
      groups.sort(function (a, b) {
        if (a.route === '') return 1
        if (b.route === '') return -1
        return a.route < b.route ? -1 : a.route > b.route ? 1 : 0
      })
      return groups
    }

    function groupRows(rows) {
      var invalid = []
      var value = {}
      for (var i = 0; i < rows.length; i++) {
        var route = String(rows[i].route === undefined || rows[i].route === null ? '' : rows[i].route).trim()
        var dshId = String(rows[i].dshId === undefined || rows[i].dshId === null ? '' : rows[i].dshId).trim()
        var wireId = String(rows[i].wireId === undefined || rows[i].wireId === null ? '' : rows[i].wireId).trim()
        if (route === '' || dshId === '' || wireId === '') { invalid.push(i); continue }
        if (value[route] === undefined) value[route] = {}
        if (Object.prototype.hasOwnProperty.call(value[route], dshId)) { invalid.push(i); continue }
        value[route][dshId] = wireId
      }
      return { value: value, invalid: invalid }
    }

    function providersEqual(a, b) {
      if (a === undefined && b === undefined) return true
      if (a === null || typeof a !== 'object' || Array.isArray(a)) return false
      if (b === null || typeof b !== 'object' || Array.isArray(b)) return false
      var left = Object.keys(a)
      var right = Object.keys(b)
      if (left.length !== right.length) return false
      for (var i = 0; i < left.length; i++) {
        var key = left[i]
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false
        if (typeof a[key] !== 'string' || typeof b[key] !== 'string' || a[key] !== b[key]) return false
      }
      return true
    }

    // ---- page ---------------------------------------------------------------
    function lang() {
      return (typeof navigator !== 'undefined' && /^zh/i.test(navigator.language || '')) ? 'zh' : 'en'
    }
    function sectionLabel() {
      return lang() === 'zh' ? '模型别名' : 'Model Alias'
    }

    function isUserOwned(user, route, dshId) {
      var models = user && user[route]
      return models !== undefined && models !== null && typeof models[dshId] === 'string'
    }
    function isBaseOwned(base, route, dshId) {
      var models = base && base[route]
      return models !== undefined && models !== null && typeof models[dshId] === 'string'
    }

    function seededRows(config) {
      var rows = []
      flattenProviders(config.providers).forEach(function (row) {
        if (isUserOwned(config.user, row.route, row.dshId)) rows.push({ route: row.route, dshId: row.dshId, wireId: row.wireId, baseOnly: false })
        else if (isBaseOwned(config.base, row.route, row.dshId)) rows.push({ route: row.route, dshId: row.dshId, wireId: row.wireId, baseOnly: true })
        else rows.push({ route: row.route, dshId: row.dshId, wireId: row.wireId, baseOnly: false })
      })
      return rows
    }

    function apiGet() {
      return fetch('/dma/api/config', { method: 'GET' }).then(function (r) { return r.json() })
    }
    function apiSet(payload) {
      return fetch('/dma/api/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json() })
    }

    function MappingPage() {
      var statusState = React.useState('loading')
      var status = statusState[0]
      var setStatus = statusState[1]
      var configState = React.useState({ providers: {}, base: {}, user: undefined, writable: true, revision: 0, mounted: true })
      var config = configState[0]
      var setConfig = configState[1]
      var rowsState = React.useState([])
      var rows = rowsState[0]
      var setRows = rowsState[1]
      var invalidState = React.useState({})
      var invalid = invalidState[0]
      var setInvalid = invalidState[1]
      var msgState = React.useState(null)
      var msg = msgState[0]
      var setMsg = msgState[1]
      var busyState = React.useState(false)
      var busy = busyState[0]
      var setBusy = busyState[1]
      var noteState = React.useState('')
      var note = noteState[0]
      var setNote = noteState[1]
      var collapsedState = React.useState({})
      var collapsed = collapsedState[0]
      var setCollapsed = collapsedState[1]
      var rowsRef = React.useRef(rows)
      rowsRef.current = rows

      function toggleGroup(route) {
        if (route === '') return
        setCollapsed(function (prev) {
          var next = {}
          Object.keys(prev).forEach(function (key) { next[key] = prev[key] })
          next[route] = !prev[route]
          return next
        })
      }

      function load(seed) {
        setBusy(true)
        apiGet().then(function (res) {
          setBusy(false)
          if (!(res && res.ok)) {
            setStatus('unavailable')
            return
          }
          var cfg = res.config || {}
          setConfig(cfg)
          setStatus(cfg.mounted === false ? 'unavailable' : 'ready')
          if (seed !== false && !providersEqual(groupRows(rowsRef.current).value, cfg.providers)) {
            setRows(seededRows(cfg))
            setInvalid({})
            setNote('')
          }
        }).catch(function () {
          setBusy(false)
          setStatus('unavailable')
        })
      }

      React.useEffect(function () {
        load(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      var writable = status === 'ready' && config.writable !== false
      var dirty = !providersEqual(groupRows(rows).value, config.providers)

      function patchRow(index, patch) {
        setRows(rows.map(function (row, i) {
          if (i !== index) return row
          return {
            route: patch.route === undefined ? row.route : patch.route,
            dshId: patch.dshId === undefined ? row.dshId : patch.dshId,
            wireId: patch.wireId === undefined ? row.wireId : patch.wireId,
            baseOnly: false
          }
        }))
        if (invalid[index] !== undefined) {
          var nextInvalid = {}
          Object.keys(invalid).forEach(function (key) { if (Number(key) !== index) nextInvalid[key] = true })
          setInvalid(nextInvalid)
        }
        setMsg(null)
      }

      function removeRow(index) {
        var removed = rows[index]
        setRows(rows.filter(function (_, i) { return i !== index }))
        setMsg(null)
        if (removed && removed.baseOnly) {
          setNote(lang() === 'zh'
            ? '无法从设置中删除入口配置条目（' + removed.route + ' / ' + removed.dshId + '）：它由 cordis.patch.yml 提供，请到入口配置中移除。'
            : 'Entry-config entry (' + removed.route + ' / ' + removed.dshId + ') cannot be deleted here; remove it from cordis.patch.yml.')
        }
        setInvalid({})
      }

      function addRow() {
        setRows(rows.concat([{ route: '', dshId: '', wireId: '', baseOnly: false }]))
        setMsg(null)
      }

      function reload() {
        setMsg(null)
        setNote('')
        setRows([])
        setCollapsed({})
        load(true)
      }

      function save() {
        var grouped = groupRows(rows)
        if (grouped.invalid.length > 0) {
          var mark = {}
          grouped.invalid.forEach(function (i) { mark[i] = true })
          setInvalid(mark)
          setMsg({ kind: 'err', text: lang() === 'zh' ? '表格有未填或重复的行：每行都需要“提供商路由 / DSH 侧模型名 / 线上模型名”。' : 'Some rows are incomplete or duplicated: every row needs a provider route, a DSH-facing model id, and a wire model name.' })
          return
        }
        setBusy(true)
        setMsg(null)
        apiSet({ providers: grouped.value, expectedRevision: config.revision }).then(function (res) {
          setBusy(false)
          if (res && res.ok) {
            setMsg({ kind: 'ok', text: lang() === 'zh' ? '已保存到 settings.yaml；映射将在下一次请求生效，无需重启。' : 'Saved to settings.yaml; the mapping applies on the next request.' })
            return load(false)
          }
          setMsg({ kind: 'err', text: failureText(res) })
          return load(false)
        }).catch(function (error) {
          setBusy(false)
          setMsg({ kind: 'err', text: lang() === 'zh' ? '保存失败：' + String((error && error.message) || error) : 'Save failed: ' + String((error && error.message) || error) })
        })
      }

      function resetAll() {
        setBusy(true)
        setMsg(null)
        apiSet({ providers: null, expectedRevision: config.revision }).then(function (res) {
          setBusy(false)
          if (res && res.ok) {
            setMsg({ kind: 'ok', text: lang() === 'zh' ? '已恢复默认：映射回到入口配置（或为空）。' : 'Reset to defaults: mappings now come from the entry config (or are empty).' })
            return load(false)
          }
          setMsg({ kind: 'err', text: failureText(res) })
          return load(false)
        }).catch(function (error) {
          setBusy(false)
          setMsg({ kind: 'err', text: lang() === 'zh' ? '操作失败：' + String((error && error.message) || error) : 'Failed: ' + String((error && error.message) || error) })
        })
      }

      function failureText(res) {
        if (res && res.code === 'conflict') {
          return lang() === 'zh' ? '写入被拒绝：配置在读取后被修改（可能来自其他窗口或编辑器）。点“重新载入”后重试。' : 'Write refused: the config changed after it was read. Reload and retry.'
        }
        var detail = res && (res.error || res.message)
        return lang() === 'zh' ? '写入被拒绝：' + (detail || '未知错误') : 'Write refused: ' + (detail || 'unknown error')
      }

      if (status === 'loading') {
        return React.createElement('div', { className: 'dma-section' },
          React.createElement('h2', { className: 'dma-heading' }, sectionLabel()),
          React.createElement('p', { className: 'dma-intro' }, lang() === 'zh' ? '正在读取映射配置…' : 'Loading mapping configuration…')
        )
      }

      if (status === 'unavailable') {
        return React.createElement('div', { className: 'dma-section' },
          React.createElement('h2', { className: 'dma-heading' }, sectionLabel()),
          React.createElement('p', { className: 'dma-intro' }, lang() === 'zh'
            ? '配置服务不可用：dsh-model-alias 未挂载设置命名空间（部署未启用 settings 提供方，或插件运行在入口配置-only 模式）。请确认已启用设置提供方（如 dsh-settings-file）并重启。'
            : 'Settings unavailable: the dsh-model-alias namespace is not mounted (no settings provider in this deployment).')
        )
      }

      return React.createElement('div', { className: 'dma-section' },
        React.createElement('h2', { className: 'dma-heading' }, sectionLabel()),
        React.createElement('p', { className: 'dma-intro' }, lang() === 'zh'
          ? '提供商范围内的模型名映射：表格列出生效映射（DSH 侧模型名 → 线上真实模型名）。保存写入 ~/.dsh/settings.yaml，无需重启，下一个请求即生效。'
          : 'Provider-scoped model name mapping: the table lists the effective mappings (DSH-facing model id → wire model name). Saving writes ~/.dsh/settings.yaml and takes effect on the next request.'),
        !writable ? React.createElement('p', { className: 'dma-hint' }, lang() === 'zh' ? '本部署的设置为只读。' : 'This deployment stores settings read-only.') : null,
        React.createElement('div', { className: 'dma-card' },
          rows.length === 0
            ? React.createElement('p', { className: 'dma-empty' }, lang() === 'zh' ? '尚未配置任何映射。点击“添加映射”开始。' : 'No mappings configured yet. Click “Add mapping” to start.')
            : React.createElement('div', { className: 'dma-table' }, groupRowsByRoute(rows).map(function (group, gi) {
                var groupCollapsed = group.route !== '' && collapsed[group.route] === true
                var chevron = group.route === ''
                  ? null
                  : React.createElement('span', { className: groupCollapsed ? 'dma-group-chevron dma-group-chevron-open' : 'dma-group-chevron' },
                      React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true },
                        React.createElement('path', { d: 'M3.5 5.25L7 8.75L10.5 5.25', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
                      )
                    )
                return React.createElement('div', { className: 'dma-group', key: 'group-' + gi },
                  React.createElement('button', {
                    type: 'button',
                    className: 'dma-group-header',
                    'aria-expanded': !groupCollapsed,
                    onClick: function () { toggleGroup(group.route) }
                  },
                    React.createElement('span', { className: 'dma-group-name', title: group.route !== '' ? group.route : undefined },
                      group.route !== '' ? group.route : (lang() === 'zh' ? '未指定提供商' : 'Unassigned provider')
                    ),
                    React.createElement('span', { className: 'dma-group-count' }, String(group.rows.length)),
                    chevron
                  ),
                  groupCollapsed ? null : React.createElement('div', { className: 'dma-group-body' },
                    group.rows.map(function (entry) {
                      var i = entry.index
                      var row = entry.row
                      return React.createElement('div', { className: 'dma-row', key: i },
                        React.createElement('input', {
                          className: invalid[i] ? 'dma-input dma-input-invalid' : 'dma-input',
                          type: 'text',
                          placeholder: lang() === 'zh' ? '提供商路由' : 'Provider route',
                          value: row.route,
                          disabled: !writable,
                          onChange: function (e) { patchRow(i, { route: e.target.value }) }
                        }),
                        React.createElement('input', {
                          className: invalid[i] ? 'dma-input dma-input-invalid' : 'dma-input',
                          type: 'text',
                          placeholder: lang() === 'zh' ? 'DSH 侧模型名' : 'DSH-facing model id',
                          value: row.dshId,
                          disabled: !writable,
                          onChange: function (e) { patchRow(i, { dshId: e.target.value }) }
                        }),
                        React.createElement('div', { className: 'dma-chip' },
                          React.createElement('input', {
                            className: invalid[i] ? 'dma-input dma-input-invalid' : 'dma-input',
                            type: 'text',
                            placeholder: lang() === 'zh' ? '线上模型名' : 'Wire model name',
                            value: row.wireId,
                            disabled: !writable,
                            onChange: function (e) { patchRow(i, { wireId: e.target.value }) }
                          }),
                          row.baseOnly ? React.createElement('span', { className: 'dma-chip-tag', title: lang() === 'zh' ? '来自 cordis.patch.yml 入口配置' : 'From the cordis.patch.yml entry config' }, lang() === 'zh' ? '入口' : 'entry') : null,
                          row.baseOnly ? React.createElement('button', {
                            type: 'button',
                            className: 'dma-chip-btn',
                            disabled: !writable,
                            onClick: function () { patchRow(i, {}) }
                          }, lang() === 'zh' ? '覆盖' : 'Override') : null
                        ),
                        React.createElement('button', {
                          type: 'button',
                          className: 'dma-del',
                          disabled: !writable,
                          title: lang() === 'zh' ? '删除此行' : 'Remove row',
                          'aria-label': 'remove',
                          onClick: function () { removeRow(i) }
                        }, '✕')
                      )
                    })
                  )
                )
              })),
          Object.keys(invalid).length > 0
            ? React.createElement('p', { className: 'dma-hint' }, lang() === 'zh' ? '标红的行需要补齐，或删除重复行，才能保存。' : 'Highlighted rows need values (or removal of duplicates) before saving.')
            : null,
          React.createElement('div', { className: 'dma-actions' },
            React.createElement('button', { type: 'button', className: 'dma-btn dma-btn-ghost', disabled: !writable || busy, onClick: resetAll }, lang() === 'zh' ? '恢复默认' : 'Reset'),
            React.createElement('button', { type: 'button', className: 'dma-btn dma-btn-ghost', disabled: busy, onClick: reload }, lang() === 'zh' ? '重新载入' : 'Reload'),
            React.createElement('button', { type: 'button', className: 'dma-btn dma-btn-ghost', disabled: !writable, onClick: addRow }, lang() === 'zh' ? '添加映射' : 'Add mapping'),
            React.createElement('button', { type: 'button', className: 'dma-btn dma-btn-primary', disabled: !writable || busy || !dirty, onClick: save }, lang() === 'zh' ? '保存' : 'Save')
          )
        ),
        note ? React.createElement('p', { className: 'dma-note' }, note) : null,
        msg ? React.createElement('p', { className: msg.kind === 'ok' ? 'dma-msg dma-msg-ok' : 'dma-msg dma-msg-err' }, msg.text) : null
      )
    }

    // ---- plugin -------------------------------------------------------------
    function apply(ctx) {
      var styleTag = document.createElement('style')
      // data-plugin carries the module id so the loader's style bookkeeping and
      // client-hmr's removeOwnedStyles() can reclaim this tag on rebuild.
      styleTag.setAttribute('data-plugin', '@kongjianguan/dsh-model-alias')
      styleTag.textContent = CSS
      document.head.appendChild(styleTag)

      // cordis effect() runs its argument immediately and treats the RETURN
      // VALUE as the dispose-time cleanup — pass a wrapper so the tag survives
      // for the plugin's whole lifetime and is removed only on dispose.
      var cleanup = function () {
        if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
      }
      var registerCleanup = function () { return cleanup }

      var slots = ctx.get('slots')
      if (slots === undefined) {
        ctx.effect(registerCleanup)
        return
      }

      slots.inject('settings.section', function () {
        return slots.register(
          { name: 'settings.section', id: 'model-alias', order: 25, label: sectionLabel },
          function () { return React.createElement(MappingPage, null) }
        )
      })

      ctx.effect(registerCleanup)
    }

    module.exports = { name: 'dsh-model-alias', apply: apply }
    return module.exports
  }
})