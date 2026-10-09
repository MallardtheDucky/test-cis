(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const state = { branch: 'all', q: '' };

  /* ---------- emblems ---------- */
  $('#brand-emblem').innerHTML = emblemSVG(38, 'brand-emblem');
  $('#hero-emblem').innerHTML = emblemSVG(150, 'hero-emblem-svg');
  $('#footer-emblem').innerHTML = emblemSVG(34, 'footer-emblem-svg');

  /* ---------- hero: hyperspace jump ---------- */
  if (window.starfield) window.starfield.jump(2800);

  /* ---------- filter chips ---------- */
  function buildChips() {
    const items = [['all', 'All branches']].concat(COLS.map((c) => [c, BRANCHES[c].short]));
    $('#chips').innerHTML = items
      .map(([k, label]) => `<button type="button" class="chip" data-chip="${k}" aria-pressed="${state.branch === k}">${esc(label)}</button>`)
      .join('');
  }

  function setBranch(b, scroll) {
    state.branch = b;
    buildChips();
    buildMatrix();
    if (scroll) $('#matrix').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- rank matrix ---------- */
  function rankAt(b, t) { return RANKS[b].find((r) => r.t === t); }

  function cellHTML(b, r) {
    return `<td><button type="button" class="cell" data-open="${b}:${r.t}" data-name="${esc(r.n.toLowerCase())}" aria-label="${esc(r.n)}, ${esc(BRANCHES[b].name)}, grade ${r.t}">
      <span class="cell-name">${esc(r.n)}</span>${plateHTML(b, r)}</button></td>`;
  }

  function buildMatrix() {
    const cols = state.branch === 'all' ? COLS : [state.branch];
    let h = '<thead><tr><th class="tiercol" scope="col">Grade</th>';
    h += cols.map((c) => `<th scope="col" class="colhead">${esc(BRANCHES[c].name)}</th>`).join('');
    h += '</tr></thead><tbody>';

    let lastGroup = '';
    TIERS.forEach((t) => {
      const milCols = cols.filter((c) => c === 'navy' || c === 'army');
      if (t.c === 'SC-1' && milCols.length === 0) return;

      if (t.g !== lastGroup) {
        h += `<tr class="group"><th colspan="${cols.length + 1}" scope="colgroup">${esc(t.g)}</th></tr>`;
        lastGroup = t.g;
      }
      h += `<tr><th scope="row" class="tiercol"><span class="tc">${t.c}</span><span class="td">${esc(t.d)}</span></th>`;

      if (t.c === 'SC-1') {
        let done = false;
        cols.forEach((c) => {
          if (c === 'navy' || c === 'army') {
            if (done) return;
            done = true;
            const r = RANKS.supreme[0];
            h += `<td colspan="${milCols.length}" class="supreme-cell"><button type="button" class="cell" data-open="supreme:SC-1" data-name="supreme commander" aria-label="Supreme Commander, Navy and Army, grade SC-1">
              <span class="cell-name">Supreme Commander</span>${plateHTML('supreme', r, 'plate-wide')}</button></td>`;
          } else {
            h += `<td class="empty"><span>Reserved to Supreme Command</span></td>`;
          }
        });
      } else {
        cols.forEach((c) => {
          const r = rankAt(c, t.c);
          h += r ? cellHTML(c, r) : `<td class="empty"><span>No equivalent</span></td>`;
        });
      }
      h += '</tr>';
    });
    h += '</tbody>';
    $('#matrix-table').innerHTML = h;
    applySearch();
  }

  function applySearch() {
    const q = state.q.trim().toLowerCase();
    const cells = $$('#matrix-table .cell');
    let hits = 0;
    cells.forEach((c) => {
      const m = !q || c.dataset.name.includes(q);
      c.classList.toggle('dim', !m);
      if (m) hits++;
    });
    $('#result-count').textContent = q
      ? (hits ? `${hits} matching rank${hits === 1 ? '' : 's'} shown in full color.` : 'No ranks match that search. Try a shorter word, such as “captain” or “agent”.')
      : `${cells.length} ranks shown.`;
  }

  /* ---------- dossier modal ---------- */
  const modal = $('#modal');
  let current = null;       // { b, idx }
  let opener = null;

  function address(b, r) {
    if (b === 'supreme') return '“Supreme Commander”';
    if (b === 'droid') return 'By rank and unit designation, no honorific';
    const g = r.t.slice(0, 2);
    if (g === 'FG') return `${r.n}, or “Sir/Ma’am” in formal address`;
    if (g === 'SG') return `${r.n}; “Sir/Ma’am” in formal address`;
    if (b === 'intel' && (g === 'JG' || g === 'EG')) return `${r.n}; by cover name in the field`;
    if (g === 'EG') return `${r.n}, or by surname`;
    return `${r.n}, or “Sir/Ma’am”`;
  }

  function reportsTo(b, idx) {
    if (b === 'supreme') return 'No superior. Interprets the Charter itself.';
    if (idx > 0) return `${RANKS[b][idx - 1].n}`;
    if (b === 'civil') return 'The Civilian Council (Supreme Commander holds a veto)';
    return 'The Supreme Commander';
  }

  function directs(b, idx) {
    if (b === 'supreme') return 'Admiral, General, Director and Super Tactical Droids';
    const list = RANKS[b];
    return idx < list.length - 1 ? list[idx + 1].n : 'No subordinate ranks';
  }

  function openRank(key, noFocus) {
    const [b, t] = key.split(':');
    const list = RANKS[b];
    if (!list) return;
    const idx = list.findIndex((r) => r.t === t);
    if (idx < 0) return;
    const r = list[idx];
    const br = BRANCHES[b];
    current = { b, idx };

    $('#m-branch').textContent = b === 'supreme' ? 'Navy and Army' : br.name;
    $('#m-rank').textContent = r.n;
    $('#m-post').textContent = r.post;
    $('#m-tier').textContent = r.t;
    $('#m-address').textContent = address(b, r);
    $('#m-up').textContent = reportsTo(b, idx);
    $('#m-down').textContent = directs(b, idx);
    $('#m-text').textContent = r.text;
    $('#m-bintro').textContent = b === 'supreme' ? BRANCHES.navy.blurb : br.blurb;
    $('#m-bar').textContent = b === 'supreme'
      ? 'Twelve triangles in two rows, gold over crimson, beside the Confederate hexagon. The same plate is worn on the Navy’s slate-blue field and the Army’s green field.'
      : `${r.i.n} triangle${r.i.n === 1 ? '' : 's'} on the ${br.short} field. ${br.bar}`;
    $('#m-path').textContent = r.path;

    $('#m-plates').innerHTML = b === 'supreme'
      ? `<figure><div class="plate-lg">${plateHTML('navy', r)}</div><figcaption>Navy field</figcaption></figure>
         <figure><div class="plate-lg">${plateHTML('army', r)}</div><figcaption>Army field</figcaption></figure>`
      : `<figure><div class="plate-lg">${plateHTML(b, r)}</div><figcaption>${esc(br.short)} field</figcaption></figure>`;

    const ladderList = b === 'supreme' ? [] : list;
    $('#m-ladder').innerHTML = ladderList
      .map((x, i) => `<li><button type="button" data-open="${b}:${x.t}" ${i === idx ? 'aria-current="true"' : ''}><span class="l-code">${x.t}</span><span>${esc(x.n)}</span></button></li>`)
      .join('');
    $('#m-ladder').hidden = ladderList.length === 0;

    if (modal.hidden) {
      opener = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('lock');
    }
    if (!noFocus) $('#m-close').focus();
    $('.modal-body').scrollTop = 0;
    history.replaceState(null, '', '#rank=' + key);
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('lock');
    history.replaceState(null, '', location.pathname + location.search);
    if (opener && opener.focus) opener.focus();
  }

  function stepRank(delta) {
    if (!current || current.b === 'supreme') return;
    const list = RANKS[current.b];
    const i = current.idx + delta;
    if (i < 0 || i >= list.length) return;
    openRank(current.b + ':' + list[i].t, true);
    const active = $('#m-ladder [aria-current]');
    if (active) active.focus({ preventScroll: false });
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) { openRank(open.dataset.open, open.closest('#m-ladder') !== null); return; }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip) { setBranch(chip.dataset.chip, false); return; }
    const f = e.target.closest('[data-filter]');
    if (f) { setBranch(f.dataset.filter, true); }
  });

  document.addEventListener('keydown', (e) => {
    if (!crawlEl.hidden) { if (e.key === 'Escape') stopCrawl(); return; }
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); stepRank(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); stepRank(-1); }
    else if (e.key === 'Tab') {
      const f = $$('button, [href], input', modal).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $('#rank-search').addEventListener('input', (e) => { state.q = e.target.value; applySearch(); });

  /* ---------- insignia guide ---------- */
  function buildGuide() {
    $('#legend-fields').innerHTML = COLS.map((c) => {
      const b = BRANCHES[c];
      return `<li>${plateHTML(c, { i: { n: 3, first: 'up' } }, 'plate-mini')}<span><strong>${esc(b.name)}</strong></span></li>`;
    }).join('');

    const countSet = [[1, 'Midshipman'], [2, 'Junior Lieutenant'], [3, 'Lieutenant'], [4, 'Commander'], [5, 'Commodore'], [6, 'Vice Admiral']];
    $('#guide-count').innerHTML = countSet.map(([n, name]) =>
      `<figure>${plateHTML('navy', { i: { n, first: 'up' } }, 'plate-mini')}<figcaption>${n}: ${esc(name)}</figcaption></figure>`).join('');

    const barItems = [
      ['#8c1118', BRANCHES.navy.short, BRANCHES.navy.bar],
      ['#f5c518', BRANCHES.army.short, BRANCHES.army.bar],
      ['#f5c518', BRANCHES.intel.short, BRANCHES.intel.bar],
      ['#38d6ff', BRANCHES.droid.short, BRANCHES.droid.bar],
      ['#f5c518', BRANCHES.civil.short, BRANCHES.civil.bar]
    ];
    $('#legend-bars').innerHTML = barItems.map(([c, n, t]) =>
      `<li><span class="barsw" style="background:${c}"></span><span><strong>${esc(n)}.</strong> ${esc(t)}</span></li>`).join('');

    const sc = RANKS.supreme[0];
    $('#guide-supreme').innerHTML =
      `<figure>${plateHTML('navy', sc)}<figcaption>Navy field</figcaption></figure><figure>${plateHTML('army', sc)}<figcaption>Army field</figcaption></figure>`;
  }

  /* ---------- branch cards ---------- */
  function buildBranches() {
    $('#branch-grid').innerHTML = COLS.map((c) => {
      const b = BRANCHES[c];
      const top = RANKS[c][0];
      const n = RANKS[c].length;
      return `<article class="panel branch-card">
        ${plateHTML(c, top)}
        <h3>${esc(b.name)}</h3>
        <p>${esc(b.blurb)}</p>
        <p class="branch-meta"><strong>${n}</strong> ranks. Highest rank: <strong>${esc(top.n)}</strong>.</p>
        <button class="btn btn-small" type="button" data-filter="${c}">Show ${esc(b.short)} ranks</button>
      </article>`;
    }).join('');
  }

  /* ---------- timeline ---------- */
  function buildTimeline() {
    $('#timeline').innerHTML = HISTORY.map((h) =>
      `<li><span class="tl-year">${esc(h.y)}</span><div><h3>${esc(h.t)}</h3><p>${esc(h.d)}</p></div></li>`).join('');
  }

  /* ---------- opening crawl ---------- */
  const crawlEl = $('#crawl');
  function playCrawl() {
    crawlEl.hidden = false;
    document.body.classList.add('lock');
    crawlEl.classList.remove('playing');
    void crawlEl.offsetWidth;
    crawlEl.classList.add('playing');
    $('#crawl-skip').focus();
  }
  function stopCrawl() {
    crawlEl.hidden = true;
    crawlEl.classList.remove('playing');
    document.body.classList.remove('lock');
    $('#play-crawl').focus();
  }
  $('#play-crawl').addEventListener('click', playCrawl);
  $('#crawl-skip').addEventListener('click', stopCrawl);
  $('.crawl-text').addEventListener('animationend', stopCrawl);

  /* ---------- init ---------- */
  buildChips();
  buildMatrix();
  buildGuide();
  buildBranches();
  buildTimeline();

  const m = location.hash.match(/^#rank=([a-z]+:[A-Z]{2}-\d)$/);
  if (m) openRank(m[1], false);
})();
