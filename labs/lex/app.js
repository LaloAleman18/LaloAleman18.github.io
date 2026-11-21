/* Lex — inferencia de tipos, CSV y tabla. Todo en el navegador. */
(function () {
  'use strict';

  var input = document.getElementById('input');
  var gutter = document.getElementById('gutter');
  var rootName = document.getElementById('root-name');
  var optional = document.getElementById('optional');
  var outCode = document.getElementById('out-code');
  var outTable = document.getElementById('out-table');
  var status = document.getElementById('status');
  var statusText = document.getElementById('status-text');
  var statusMeta = document.getElementById('status-meta');
  var copyButton = document.getElementById('copy');
  var inputMeta = document.getElementById('input-meta');
  var clock = document.getElementById('clock');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));

  var SAMPLE = {
    orderId: 'ORD-2026-0184',
    createdAt: '2026-11-18T09:42:00Z',
    status: 'pending',
    customer: {
      id: 4821,
      name: 'Mariana Solís',
      email: 'mariana@example.com',
      phone: null
    },
    items: [
      {
        sku: 'CAF-500',
        name: 'Tostado medio 500 g',
        quantity: 2,
        unitPrice: 168.5,
        tags: ['café', 'tueste medio']
      },
      {
        sku: 'MOL-250',
        name: 'Molido fino 250 g',
        quantity: 1,
        unitPrice: 98,
        discount: 0.1
      }
    ],
    shipping: {
      method: 'pickup',
      cost: 0,
      address: null
    },
    total: 337,
    paid: false
  };

  var state = {
    tab: 'ts',
    ts: '',
    csv: '',
    rows: [],
    source: '—',
    parsed: null
  };

  /* Inferencia ------------------------------------------------------------ */
  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function infer(value) {
    if (value === null) return { kind: 'null' };
    if (Array.isArray(value)) {
      return { kind: 'array', items: mergeTypes(value.map(infer)) };
    }
    if (isPlainObject(value)) {
      var fields = {};
      Object.keys(value).forEach(function (key) {
        fields[key] = { type: infer(value[key]), optional: false };
      });
      return { kind: 'object', fields: fields };
    }
    var name = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';
    return { kind: 'primitive', name: name };
  }

  function signature(type) {
    if (type.kind === 'primitive') return type.name;
    if (type.kind === 'null') return 'null';
    if (type.kind === 'unknown') return 'unknown';
    if (type.kind === 'array') return 'array<' + signature(type.items) + '>';
    if (type.kind === 'union') {
      return type.options.map(signature).sort().join('|');
    }
    return 'object{' + Object.keys(type.fields).sort().map(function (key) {
      var field = type.fields[key];
      return key + (field.optional ? '?' : '') + ':' + signature(field.type);
    }).join(',') + '}';
  }

  function mergeTypes(list) {
    var flat = [];
    list.forEach(function (type) {
      if (type.kind === 'union') flat = flat.concat(type.options);
      else flat.push(type);
    });

    var unique = [];
    var seen = new Set();
    flat.forEach(function (type) {
      var key = signature(type);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(type);
      }
    });

    if (!unique.length) return { kind: 'unknown' };
    if (unique.length === 1) return unique[0];
    if (unique.every(function (type) { return type.kind === 'object'; })) {
      return mergeObjects(unique);
    }
    return { kind: 'union', options: unique };
  }

  function mergeObjects(objects) {
    var keys = [];
    objects.forEach(function (object) {
      Object.keys(object.fields).forEach(function (key) {
        if (keys.indexOf(key) === -1) keys.push(key);
      });
    });

    var fields = {};
    keys.forEach(function (key) {
      var present = objects.filter(function (object) { return object.fields[key]; });
      fields[key] = {
        type: mergeTypes(present.map(function (object) { return object.fields[key].type; })),
        optional: present.length < objects.length || present.some(function (object) { return object.fields[key].optional; })
      };
    });
    return { kind: 'object', fields: fields };
  }

  /* Nombres --------------------------------------------------------------- */
  var usedNames = new Set();
  var queue = [];

  function pascal(value) {
    var cleaned = String(value).replace(/[^A-Za-z0-9]+/g, ' ').trim();
    if (!cleaned) return 'Type';
    var result = cleaned.split(/\s+/).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
    return /^[0-9]/.test(result) ? 'T' + result : result;
  }

  function singular(word) {
    var irregular = {
      people: 'Person',
      children: 'Child',
      men: 'Man',
      women: 'Woman',
      data: 'Datum',
      addresses: 'Address',
      statuses: 'Status'
    };
    var lower = word.toLowerCase();
    if (irregular[lower]) return irregular[lower];
    if (/ies$/i.test(word)) return word.slice(0, -3) + 'y';
    if (/ses$/i.test(word)) return word.slice(0, -2);
    if (/s$/i.test(word) && !/ss$/i.test(word)) return word.slice(0, -1);
    return word;
  }

  function uniqueName(base) {
    var name = base || 'Type';
    var candidate = name;
    var index = 2;
    while (usedNames.has(candidate)) {
      candidate = name + index;
      index += 1;
    }
    usedNames.add(candidate);
    return candidate;
  }

  function registerType(type, key) {
    if (type.kind === 'object') {
      if (!type.name) {
        type.name = uniqueName(pascal(key));
        queue.push(type);
      }
    } else if (type.kind === 'array') {
      registerType(type.items, singular(key));
    } else if (type.kind === 'union') {
      type.options.forEach(function (option) { registerType(option, key); });
    }
  }

  function nameTypes(root, rootLabel) {
    usedNames = new Set();
    queue = [];
    var base = pascal(rootLabel || 'Root');

    if (root.kind === 'object') {
      root.name = uniqueName(base);
      queue.push(root);
    } else if (root.kind === 'array') {
      uniqueName(base);
      if (root.items.kind === 'object') {
        root.items.name = uniqueName(base + 'Item');
        queue.push(root.items);
      } else if (root.items.kind === 'union') {
        root.items.options.forEach(function (option) {
          if (option.kind === 'object' && !option.name) {
            option.name = uniqueName(base + 'Item');
            queue.push(option);
          }
        });
      }
    } else {
      uniqueName(base);
    }

    for (var i = 0; i < queue.length; i++) {
      var object = queue[i];
      Object.keys(object.fields).forEach(function (key) {
        registerType(object.fields[key].type, key);
      });
    }

    return base;
  }

  /* TypeScript ------------------------------------------------------------ */
  function typeExpr(type) {
    if (type.kind === 'primitive') return type.name;
    if (type.kind === 'null') return 'null';
    if (type.kind === 'unknown') return 'unknown';
    if (type.kind === 'object') {
      if (type.name) return type.name;
      return inlineObject(type);
    }
    if (type.kind === 'array') {
      var inner = typeExpr(type.items);
      return type.items.kind === 'union' ? '(' + inner + ')[]' : inner + '[]';
    }
    return type.options.map(typeExpr).join(' | ');
  }

  function inlineObject(type) {
    var fields = Object.keys(type.fields).map(function (key) {
      return key + ': ' + typeExpr(type.fields[key].type);
    });
    return '{ ' + fields.join('; ') + ' }';
  }

  function renderTS(root, alias, includeOptional) {
    var blocks = [];

    queue.forEach(function (object) {
      var lines = ['export interface ' + object.name + ' {'];
      Object.keys(object.fields).forEach(function (key) {
        var field = object.fields[key];
        var safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        var mark = field.optional && includeOptional ? '?' : '';
        lines.push('  ' + safeKey + mark + ': ' + typeExpr(field.type) + ';');
      });
      lines.push('}');
      blocks.push(lines.join('\n'));
    });

    if (root.kind !== 'object') {
      blocks.push('export type ' + alias + ' = ' + typeExpr(root) + ';');
    }

    return blocks.join('\n\n') + '\n';
  }

  /* Filas, CSV y tabla ---------------------------------------------------- */
  function pickDataset(value) {
    if (Array.isArray(value)) {
      return {
        rows: value.filter(isPlainObject),
        source: 'raíz'
      };
    }
    if (isPlainObject(value)) {
      var arrayKeys = Object.keys(value).filter(function (key) {
        var candidate = value[key];
        return Array.isArray(candidate) && candidate.length > 0 && candidate.every(isPlainObject);
      });
      if (arrayKeys.length === 1) {
        return { rows: value[arrayKeys[0]], source: arrayKeys[0] };
      }
      return { rows: [value], source: 'raíz' };
    }
    return { rows: [], source: '—' };
  }

  function flattenRow(object, prefix, target) {
    Object.keys(object).forEach(function (key) {
      var value = object[key];
      var label = prefix ? prefix + '.' + key : key;
      if (isPlainObject(value)) {
        flattenRow(value, label, target);
      } else if (Array.isArray(value)) {
        target[label] = value.map(function (item) {
          return isPlainObject(item) ? JSON.stringify(item) : String(item);
        }).join(' | ');
      } else {
        target[label] = value === null ? '' : String(value);
      }
    });
    return target;
  }

  function csvCell(value) {
    var text = value === undefined || value === null ? '' : String(value);
    return /[",\r\n]|^\s|\s$/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function toCSV(rows) {
    if (!rows.length) return '';
    var flat = rows.map(function (row) { return flattenRow(row, '', {}); });
    var columns = [];
    flat.forEach(function (row) {
      Object.keys(row).forEach(function (key) {
        if (columns.indexOf(key) === -1) columns.push(key);
      });
    });

    var lines = [columns.map(csvCell).join(',')];
    flat.forEach(function (row) {
      lines.push(columns.map(function (column) { return csvCell(row[column]); }).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlightType(expression) {
    return escapeHTML(expression)
      .replace(/\b(string|number|boolean|null|unknown)\b/g, '<span class="ty">$1</span>')
      .replace(/\b([A-Z][A-Za-z0-9_$]*)\b/g, '<span class="ty">$1</span>');
  }

  function highlightTS(code) {
    return code.split('\n').map(function (line) {
      var match;

      if ((match = /^(export interface) ([A-Za-z0-9_$]+) (\{)$/.exec(line))) {
        return '<span class="kw">' + match[1] + '</span> <span class="ty">' + escapeHTML(match[2]) + '</span> ' + match[3];
      }
      if ((match = /^(export type) ([A-Za-z0-9_$]+) (=) (.*);$/.exec(line))) {
        return '<span class="kw">' + match[1] + '</span> <span class="ty">' + escapeHTML(match[2]) +
          '</span> ' + match[3] + ' ' + highlightType(match[4]) + ';';
      }
      if ((match = /^  (.*?)(\??): (.*);$/.exec(line))) {
        return '  <span class="pr">' + escapeHTML(match[1]) + '</span><span class="op">' +
          match[2] + ':</span> ' + highlightType(match[3]) + ';';
      }
      if (line === '}') return '<span class="op">}</span>';
      return escapeHTML(line);
    }).join('\n');
  }

  function renderTable(rows) {
    if (!rows.length) {
      outTable.innerHTML = '<p class="table-empty">Este JSON no tiene filas. Prueba con un array de objetos o con un objeto que contenga uno.</p>';
      return;
    }

    var flat = rows.slice(0, 200).map(function (row) { return flattenRow(row, '', {}); });
    var columns = [];
    flat.forEach(function (row) {
      Object.keys(row).forEach(function (key) {
        if (columns.indexOf(key) === -1) columns.push(key);
      });
    });

    var html = '<table><thead><tr>';
    columns.forEach(function (column) { html += '<th>' + escapeHTML(column) + '</th>'; });
    html += '</tr></thead><tbody>';
    flat.forEach(function (row) {
      html += '<tr>';
      columns.forEach(function (column) {
        html += '<td>' + escapeHTML(row[column] === undefined ? '' : row[column]) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    outTable.innerHTML = html;
  }

  /* Interfaz -------------------------------------------------------------- */
  function setStatus(kind, text, meta) {
    status.classList.toggle('is-error', kind === 'error');
    status.classList.toggle('is-warn', kind === 'warn');
    statusText.textContent = text;
    statusMeta.textContent = meta || '';
  }

  function selectTab(name) {
    state.tab = name;
    tabs.forEach(function (button) {
      button.setAttribute('aria-selected', button.getAttribute('data-tab') === name ? 'true' : 'false');
    });
  }

  function updateGutter() {
    var lines = input.value.split('\n').length;
    var numbers = [];
    for (var i = 1; i <= lines; i++) numbers.push(i);
    gutter.textContent = numbers.join('\n');
    inputMeta.textContent = lines + (lines === 1 ? ' línea' : ' líneas') + ' · ' + input.value.length + ' car.';
  }

  function renderOutput() {
    var isTable = state.tab === 'table';
    outCode.hidden = isTable;
    outTable.hidden = !isTable;

    if (state.tab === 'ts') {
      outCode.innerHTML = highlightTS(state.ts || '// Pega un JSON para empezar.');
      outCode.classList.remove('is-error');
    } else if (state.tab === 'csv') {
      outCode.textContent = state.csv || '// Sin filas para exportar.';
      outCode.classList.remove('is-error');
    } else {
      renderTable(state.rows);
    }

    copyButton.textContent = isTable || state.tab === 'csv' ? 'Copiar CSV' : 'Copiar';
  }

  function showError(error, raw) {
    var message = error && error.message ? error.message : 'JSON inválido';
    var where = '';
    var match = /position (\d+)/.exec(message);

    if (match) {
      var position = Math.min(Number(match[1]), raw.length);
      var before = raw.slice(0, position);
      var line = before.split('\n').length;
      var column = position - before.lastIndexOf('\n');
      where = 'L' + line + ':' + column;
    }

    state.ts = '';
    state.csv = '';
    state.rows = [];
    selectTab('ts');
    outCode.hidden = false;
    outTable.hidden = true;
    outCode.classList.add('is-error');
    outCode.textContent = '// JSON inválido\n// ' + message + (where ? '\n// ' + where : '');
    setStatus('error', 'JSON inválido', where || 'revisa la sintaxis');
  }

  function generate() {
    var raw = input.value.trim();

    if (!raw) {
      state.ts = '';
      state.csv = '';
      state.rows = [];
      selectTab('ts');
      outCode.hidden = false;
      outTable.hidden = true;
      outCode.classList.remove('is-error');
      outCode.textContent = '// Pega un JSON para empezar.';
      setStatus('idle', 'Esperando JSON', 'Ctrl + Enter');
      return;
    }

    if (raw.length > 1500000) {
      setStatus('warn', 'JSON demasiado grande', 'máximo 1.5 MB');
      return;
    }

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      showError(error, raw);
      return;
    }

    var started = performance.now();
    var root = infer(parsed);
    var alias = nameTypes(root, rootName.value);
    state.ts = renderTS(root, alias, optional.checked);
    state.parsed = parsed;

    var dataset = pickDataset(parsed);
    state.rows = dataset.rows;
    state.source = dataset.source;
    state.csv = toCSV(dataset.rows);

    var elapsed = Math.max(1, Math.round(performance.now() - started));
    outCode.classList.remove('is-error');
    renderOutput();
    setStatus('ok', 'JSON válido', dataset.rows.length + ' filas · ' + dataset.source + ' · ' + elapsed + ' ms');
  }

  function save() {
    if (input.value.length > 300000) return;
    try { localStorage.setItem('lex.input', input.value); } catch (error) { /* modo privado */ }
  }

  var timer = null;
  input.addEventListener('input', function () {
    updateGutter();
    clearTimeout(timer);
    timer = setTimeout(generate, 180);
    save();
  });

  input.addEventListener('scroll', function () {
    gutter.scrollTop = input.scrollTop;
  });

  rootName.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(generate, 180);
  });

  optional.addEventListener('change', generate);

  tabs.forEach(function (button) {
    button.addEventListener('click', function () {
      state.tab = button.getAttribute('data-tab');
      tabs.forEach(function (other) {
        other.setAttribute('aria-selected', other === button ? 'true' : 'false');
      });
      renderOutput();
    });

    button.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var index = tabs.indexOf(button);
      var next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
    });
  });

  copyButton.addEventListener('click', function () {
    var text = state.tab === 'ts' ? state.ts : state.csv;
    if (!text) return;

    function done() {
      copyButton.textContent = 'Copiado';
      copyButton.classList.add('is-copied');
      setTimeout(function () {
        copyButton.classList.remove('is-copied');
        renderOutput();
      }, 1400);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text); done(); });
    } else {
      legacyCopy(text);
      done();
    }
  });

  function legacyCopy(text) {
    var helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    try { document.execCommand('copy'); } catch (error) { /* sin permiso */ }
    helper.remove();
  }

  document.querySelectorAll('[data-act]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.getAttribute('data-act');

      if (action === 'sample') {
        input.value = JSON.stringify(SAMPLE, null, 2);
        updateGutter();
        input.scrollTop = 0;
        gutter.scrollTop = 0;
        generate();
        save();
        input.focus();
      }

      if (action === 'format') {
        try {
          var parsed = JSON.parse(input.value);
          input.value = JSON.stringify(parsed, null, 2);
          updateGutter();
          generate();
          save();
        } catch (error) {
          showError(error, input.value);
        }
      }

      if (action === 'clear') {
        input.value = '';
        updateGutter();
        generate();
        save();
        input.focus();
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    var mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === 'Enter') {
      event.preventDefault();
      generate();
    }
    if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      copyButton.click();
    }
  });

  /* Archivos arrastrados -------------------------------------------------- */
  var editor = document.querySelector('.editor');
  ['dragenter', 'dragover'].forEach(function (name) {
    editor.addEventListener(name, function (event) {
      event.preventDefault();
      editor.classList.add('is-drop');
    });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    editor.addEventListener(name, function (event) {
      event.preventDefault();
      editor.classList.remove('is-drop');
    });
  });
  editor.addEventListener('drop', function (event) {
    var file = event.dataTransfer && event.dataTransfer.files[0];
    if (!file || file.size > 1500000) return;
    file.text().then(function (text) {
      input.value = text;
      updateGutter();
      generate();
      save();
    });
  });

  /* Reloj ----------------------------------------------------------------- */
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date());
    } catch (error) {
      clock.textContent = '—';
    }
  }
  tick();
  setInterval(tick, 30000);

  /* Arranque -------------------------------------------------------------- */
  var saved = null;
  try { saved = localStorage.getItem('lex.input'); } catch (error) { saved = null; }
  input.value = saved && saved.trim() ? saved : JSON.stringify(SAMPLE, null, 2);
  updateGutter();
  generate();
})();
