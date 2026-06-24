    window.__SCRIPT_START = 1;
    // ========== CONSTANTS ==========
    const SUPABASE_URL = 'https://rwgbcstfqjlraqfophjw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z2Jjc3RmcWpscmFxZm9waGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTMxOTksImV4cCI6MjA5Nzc4OTE5OX0.qjw1z2moKdpQ8piKwuKTGM69pl2wknuuN-8yWzdPmSk';

    // ========== SUPABASE REST API (fetch-based, no SDK needed) ==========
    const api = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      async insert(table, row) {
        const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
          method: 'POST', headers: this.headers, body: JSON.stringify(row)
        });
        if (!res.ok) return { error: { message: 'HTTP ' + res.status } };
        return { error: null };
      },
      async select(table, order) {
        var url = SUPABASE_URL + '/rest/v1/' + table + '?select=*';
        if (order) url += '&order=' + order;
        const res = await fetch(url, { headers: this.headers });
        if (!res.ok) return { data: null, error: { message: 'HTTP ' + res.status } };
        return { data: await res.json(), error: null };
      }
    };

    // ========== APPLICATION STATE ==========
    const state = {
      step: 1,
      name: null,
      datetime: null
    };

    let _transitioning = false;

    // ========== CALENDAR STATE ==========
    let calDate = new Date();
    let calSelectedDay = null;

    // ========== HELPER: QUERY SELECTOR ==========
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    // ========== STEP NAVIGATION ==========
    function setStep(n) {
      if (_transitioning || n < 1 || n > 6 || n === state.step) return;
      _transitioning = true;

      const currentStep = document.getElementById('step' + state.step);
      const nextStep = document.getElementById('step' + n);

      if (!currentStep || !nextStep) {
        _transitioning = false;
        return;
      }

      // Fade out current
      currentStep.classList.add('fade-out');
      currentStep.classList.remove('fade-in');

      currentStep.addEventListener('animationend', function handler() {
        currentStep.removeEventListener('animationend', handler);
        currentStep.classList.remove('active', 'fade-out');

        // Fade in next
        nextStep.classList.add('active', 'fade-in');

        nextStep.addEventListener('animationend', function handler2() {
          nextStep.removeEventListener('animationend', handler2);
          nextStep.classList.remove('fade-in');
          _transitioning = false;
        }, { once: true });

        initStep(n);
      }, { once: true });

      state.step = n;
    }

    function goNext() {
      if (state.step < 6) {
        if (state.step === 3 && !state.datetime) {
          shakeElement($('#step3 .btn-gold'));
          return;
        }
        setStep(state.step + 1);
      }
    }

    function goBack() {
      if (state.step > 1) {
        setStep(state.step - 1);
      }
    }

    // ========== NO OVERLAY ==========
    function showNoOverlay() {
      document.getElementById('noOverlay').classList.add('show');
    }

    function hideNoOverlay() {
      document.getElementById('noOverlay').classList.remove('show');
    }

    // ========== SHAKE ANIMATION ==========
    function shakeElement(el) {
      if (!el) return;
      el.classList.add('shake');
      el.addEventListener('animationend', function handler() {
        el.removeEventListener('animationend', handler);
        el.classList.remove('shake');
      }, { once: true });
    }

    // ========== STEP 2 — NAME INPUT ==========
    function initStep2() {
      document.getElementById('nameInput').value = '';
      document.getElementById('nameInput').focus();
    }

    function confirmName() {
      const name = document.getElementById('nameInput').value.trim();
      if (!name) {
        document.getElementById('nameInput').style.animation = 'shake 0.4s ease';
        setTimeout(() => document.getElementById('nameInput').style.animation = '', 400);
        return;
      }
      state.name = name;
      goNext();
    }

    // ========== STEP 3 — CALENDAR ==========
    function initStep3() {
      const btnSelect = document.getElementById('btnSelectDate');
      const overlay = document.getElementById('calendarOverlay');
      btnSelect.onclick = () => { calDate = new Date(); calSelectedDay = null; renderCalendar(); overlay.classList.add('show'); };
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
      document.getElementById('calPrev').onclick = () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); };
      document.getElementById('calNext').onclick = () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); };
      const hourSel = document.getElementById('timeHour');
      hourSel.innerHTML = '';
      for (let h = 1; h <= 12; h++) { const opt = document.createElement('option'); opt.value = h; opt.textContent = h; hourSel.appendChild(opt); }
      document.getElementById('calConfirm').onclick = confirmDateTime;
      document.getElementById('selectedDateTime').style.display = 'none';
      document.getElementById('btnStep3Next').style.display = 'none';
      renderCalendar();
    }

    function renderCalendar() {
      const year = calDate.getFullYear();
      const month = calDate.getMonth();
      document.getElementById('calMonthYear').textContent = calDate.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' });
      const daysEl = document.getElementById('calDays');
      daysEl.innerHTML = '';
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      for (let i = firstDay - 1; i >= 0; i--) { const btn = document.createElement('button'); btn.textContent = daysInPrevMonth - i; btn.classList.add('other-month'); daysEl.appendChild(btn); }
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement('button'); btn.textContent = d;
        const thisDate = new Date(year, month, d); thisDate.setHours(0, 0, 0, 0);
        if (thisDate < today) { btn.disabled = true; btn.style.opacity = '0.3'; }
        if (calSelectedDay && calSelectedDay.day === d && calSelectedDay.month === month && calSelectedDay.year === year) { btn.classList.add('selected'); }
        btn.onclick = () => { calSelectedDay = { day: d, month: month, year: year }; renderCalendar(); };
        daysEl.appendChild(btn);
      }
      const totalCells = firstDay + daysInMonth;
      const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let i = 1; i <= remaining; i++) { const btn = document.createElement('button'); btn.textContent = i; btn.classList.add('other-month'); daysEl.appendChild(btn); }
    }

    function confirmDateTime() {
      if (!calSelectedDay) return;
      const sel = calSelectedDay;
      const selDate = new Date(sel.year, sel.month, sel.day);
      const monthStr = selDate.toLocaleDateString('zh-CN', { month: 'long' });
      const hour = document.getElementById('timeHour').value;
      const minute = document.getElementById('timeMinute').value;
      const amPm = document.getElementById('timeAmPm').value;
      state.datetime = `${sel.year}年${monthStr}${sel.day}日 ${amPm}${hour}:${minute}`;
      document.getElementById('selectedDateTime').textContent = '📅 ' + state.datetime;
      document.getElementById('selectedDateTime').style.display = 'block';
      document.getElementById('btnStep3Next').style.display = 'block';
      document.getElementById('calendarOverlay').classList.remove('show');
    }

    // ========== STEP 4 — CONFIRMATION CARD + SUPABASE SUBMIT ==========
    function initStep4() {
      const card = document.getElementById('confirmCard');
      card.innerHTML = `
        <div class="confirm-card">
          <div style="text-align:center;margin-bottom:12px;font-size:2rem;">🀄</div>
          <div class="card-row">
            <div class="card-icon">👤</div>
            <div><div class="card-label">参与人</div><div class="card-value">${escapeHtml(state.name)}</div></div>
          </div>
          <div class="card-row">
            <div class="card-icon">📅</div>
            <div><div class="card-label">时间</div><div class="card-value">${escapeHtml(state.datetime)}</div></div>
          </div>
          <div class="card-row">
            <div class="card-icon">📍</div>
            <div>
              <div class="card-label">地点</div>
              <div class="card-value" style="font-size:0.85rem;">老地方见</div>
              <img src="微信图片_20260623212816_200_32.jpg" alt="地点定位" class="card-map-img" style="margin-top:6px;">
            </div>
          </div>
          <button class="btn btn-gold" id="btnSubmitRSVP" style="width:100%;margin-top:16px;">确认提交</button>
        </div>
      `;
    }

    async function submitRSVP(e) {
      const btn = e ? e.target : document.getElementById('btnSubmitRSVP');
      btn.disabled = true;
      btn.textContent = '提交中...';
      const { error } = await api.insert('responses', { name: state.name, datetime: state.datetime });
      if (error) { alert('提交失败，请重试'); btn.disabled = false; btn.textContent = '确认提交'; return; }
      goNext();
    }

    // ========== STEP INITIALIZERS ==========
    function initStep(n) {
      switch (n) {
        case 1: initStep1(); break;
        case 2: initStep2(); break;
        case 3: initStep3(); break;
        case 4: initStep4(); break;
        case 5: initStep5(); break;
        case 6: initStep6(); break;
      }
    }

    function initStep1() {
      // Step 1 ready — no special init needed
    }

    function initStep5() {
      // Success page — animation handled by step transition
    }

const HOST_PASSWORD = 'majiang2024';

function initStep6() {
  document.getElementById('hostPassword').value = '';
  document.getElementById('hostError').style.display = 'none';
  document.getElementById('hostTable').innerHTML = '';
}

async function viewResponses() {
  const pwd = document.getElementById('hostPassword').value;
  const errEl = document.getElementById('hostError');
  if (pwd !== HOST_PASSWORD) {
    errEl.textContent = '密码错误';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const { data, error } = await api.select('responses', 'created_at.asc');
  if (error) {
    errEl.textContent = '查询失败: ' + error.message;
    errEl.style.display = 'block';
    return;
  }
  if (!data || data.length === 0) {
    document.getElementById('hostTable').innerHTML = '<p style="text-align:center;color:var(--gold);margin-top:20px;">还没有人报名 🀄</p>';
    return;
  }
  let html = '<table class="host-table"><thead><tr><th>姓名</th><th>时间</th><th>提交时间</th></tr></thead><tbody>';
  data.forEach(row => {
    const created = new Date(row.created_at).toLocaleString('zh-CN');
    html += `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.datetime)}</td><td>${created}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('hostTable').innerHTML = html;
}

    // ========== UTILITIES ==========
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    // ========== CLOSE OVERLAYS ON BACKDROP CLICK ==========

    document.getElementById('noOverlay').addEventListener('click', function(e) {
      if (e.target === this) hideNoOverlay();
    });

    // ========== HOST MODE DETECTION ==========
    if (window.location.search.includes('host')) {
      // Jump directly to step 6 for host access
      state.step = 6;
      document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
      document.getElementById('step6').classList.add('active');
      initStep(6);
    }

    // ========== INITIAL SETUP WITH EVENT BINDINGS ==========
    document.addEventListener('DOMContentLoaded', function() {
      // Bind all button click handlers
      var btnYes = document.getElementById('btnYes');
      var btnNo = document.getElementById('btnNo');
      var btnConfirmName = document.getElementById('btnConfirmName');
      var btnStep3Next = document.getElementById('btnStep3Next');
      var btnHostView = document.getElementById('hostViewBtn');
      var btnExit = document.getElementById('btnExit');

      if (btnYes) btnYes.addEventListener('click', goNext);
      if (btnNo) btnNo.addEventListener('click', showNoOverlay);
      if (btnConfirmName) btnConfirmName.addEventListener('click', confirmName);
      if (btnStep3Next) btnStep3Next.addEventListener('click', goNext);
      if (btnHostView) btnHostView.addEventListener('click', viewResponses);
      if (btnExit) btnExit.addEventListener('click', function() { window.close() || (location.href = 'about:blank'); });

      // Submit button is dynamically created in initStep4, bind via delegation
      document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'btnSubmitRSVP') submitRSVP(e);
      });

      initStep(1);
    });

    console.log('🀄 麻将邀约 — 已就绪 (fetch API mode)');
    console.log('当前步骤:', state.step);

    /* === FLOATING MAHJONG PARTICLES === */
    (function() {
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;';
      document.body.insertBefore(container, document.body.firstChild);
      const tiles = ['🀄','🀅','🀆','🀇','🀈','🀉','🀊','🀋','🀌','🀍'];
      for (let i = 0; i < 12; i++) {
        const p = document.createElement('span');
        p.textContent = tiles[Math.floor(Math.random() * tiles.length)];
        p.style.cssText = `position:absolute;bottom:-20px;left:${Math.random()*100}%;font-size:${1.2+Math.random()*1.5}rem;animation:floatUp ${10+Math.random()*15}s linear infinite;animation-delay:${Math.random()*12}s;opacity:${0.1+Math.random()*0.15};`;
        container.appendChild(p);
      }
      const style = document.createElement('style');
      style.textContent = '@keyframes floatUp { 0% { transform: translateY(105vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; } }';
      document.head.appendChild(style);
    })();
