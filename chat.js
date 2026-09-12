// Чат-помощник «Александр» — инженер SMARTKLIMAT. Интерфейс + связь с мозгом на /api/bot.
// Тёмная тема сайта, аватар с настроениями, память диалога в localStorage,
// ночной статус, быстрые вопросы. Заявку (имя+телефон) отдаёт в общий sendLead().
(function () {
  var API = '/api/bot';
  var LS = 'sk_chat_v1';
  var HINT_LS = 'sk_chat_hint';
  var history = [];
  try { history = JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) {}
  var leadDone = false;

  // ---- Аватар Александра (SVG, инженер в каске) ----
  var AVA = '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' +
    '<circle cx="24" cy="24" r="24" fill="#1f1f23"/>' +
    '<circle cx="24" cy="19" r="8" fill="#f2c9a0"/>' +
    '<path d="M13 12h22a11 11 0 0 0-22 0z" fill="#ffdc4e"/>' +
    '<rect x="11" y="11" width="26" height="3" rx="1.5" fill="#ffc400"/>' +
    '<path d="M24 29c-7 0-13 4-13 10v9h26v-9c0-6-6-10-13-10z" fill="#2a2a30"/>' +
    '<path d="M20 29c1 2 7 2 8 0" fill="none" stroke="#ff9f1c" stroke-width="1.5"/>' +
    '</svg>';

  var MOOD = {
    hello: '🙂', praise: '👍', boss: '🛠️', grumble: '😌', think: '💭', rest: '😴'
  };

  // ---- Стили ----
  var css = document.createElement('style');
  css.textContent =
    '.ak-bubble{position:fixed;left:22px;bottom:22px;z-index:9998;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#ffdc4e,#ff9f1c);box-shadow:0 8px 28px rgba(255,220,78,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;transition:transform .2s}' +
    '.ak-bubble:hover{transform:scale(1.08)}' +
    '.ak-bubble svg{width:32px;height:32px}' +
    '.ak-badge{position:absolute;top:-3px;right:-3px;width:20px;height:20px;border-radius:50%;background:#121214;border:2px solid #ffdc4e;font-size:11px;display:flex;align-items:center;justify-content:center}' +
    '.ak-hint{position:fixed;left:92px;bottom:34px;z-index:9998;background:#17171a;color:#f4f4f5;font-size:13px;font-weight:600;padding:10px 13px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45);cursor:pointer;max-width:210px;border:1px solid rgba(255,220,78,.35)}' +
    '.ak-hint:after{content:"";position:absolute;left:-6px;bottom:14px;border:6px solid transparent;border-right-color:#17171a;border-left:0}' +
    '.ak-stage{position:fixed;left:22px;bottom:94px;z-index:9999;width:370px;max-width:calc(100vw - 32px);display:none;font-family:inherit}' +
    '.ak-stage.open{display:block}' +
    '.ak-win{height:540px;max-height:calc(100vh - 130px);background:#121214;border:1px solid rgba(255,255,255,.09);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden}' +
    '.ak-head{background:linear-gradient(135deg,#1f1f23,#17171a);padding:13px 15px;display:flex;align-items:center;gap:11px;border-bottom:1px solid rgba(255,220,78,.18)}' +
    '.ak-hava{width:42px;height:42px;border-radius:50%;overflow:hidden;flex:none;box-shadow:0 0 0 2px rgba(255,220,78,.4)}' +
    '.ak-who{line-height:1.3;flex:1;min-width:0}' +
    '.ak-who b{font-size:16px;font-weight:800;color:#f4f4f5;display:block}' +
    '.ak-who span{font-size:11px;color:#a3a3ab;display:inline-flex;align-items:center;gap:6px}' +
    '.ak-dot{width:7px;height:7px;border-radius:50%;background:#35d07f;box-shadow:0 0 0 3px rgba(53,208,127,.25)}' +
    '.ak-close{margin-left:auto;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);border:none;color:#f4f4f5;font-size:19px;cursor:pointer;line-height:1}' +
    '.ak-msgs{flex:1;overflow-y:auto;padding:15px 13px 6px;display:flex;flex-direction:column;gap:10px}' +
    '.ak-row{display:flex;gap:8px;align-items:flex-end;max-width:100%}' +
    '.ak-row.user{flex-direction:row-reverse}' +
    '.ak-ava{width:28px;height:28px;border-radius:50%;overflow:hidden;flex:none}' +
    '.ak-m{padding:9px 13px;border-radius:15px;font-size:14px;line-height:1.5;max-width:78%;white-space:pre-wrap;word-wrap:break-word}' +
    '.ak-m.bot{background:#1f1f23;color:#f4f4f5;border-bottom-left-radius:4px}' +
    '.ak-m.user{background:linear-gradient(135deg,#ffdc4e,#ff9f1c);color:#0a0a0b;font-weight:600;border-bottom-right-radius:4px}' +
    '.ak-typing{display:none;gap:4px;padding:9px 13px;background:#1f1f23;border-radius:15px;border-bottom-left-radius:4px;width:fit-content}' +
    '.ak-typing i{width:6px;height:6px;border-radius:50%;background:#a3a3ab;animation:akb 1s infinite}' +
    '.ak-typing i:nth-child(2){animation-delay:.15s}.ak-typing i:nth-child(3){animation-delay:.3s}' +
    '@keyframes akb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}' +
    '.ak-quick{display:flex;flex-wrap:wrap;gap:7px;padding:4px 13px 12px}' +
    '.ak-q{background:rgba(255,220,78,.1);border:1px solid rgba(255,220,78,.35);color:#ffe9a3;font-size:12.5px;padding:7px 11px;border-radius:20px;cursor:pointer;transition:background .15s}' +
    '.ak-q:hover{background:rgba(255,220,78,.2)}' +
    '.ak-foot{display:flex;gap:8px;padding:11px 12px;border-top:1px solid rgba(255,255,255,.08);background:#121214}' +
    '.ak-in{flex:1;background:#1f1f23;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:10px 15px;color:#f4f4f5;font-size:14px;outline:none;font-family:inherit}' +
    '.ak-in:focus{border-color:rgba(255,220,78,.5)}' +
    '.ak-send{width:42px;height:42px;flex:none;border:none;border-radius:50%;background:linear-gradient(135deg,#ffdc4e,#ff9f1c);color:#0a0a0b;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.ak-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '@media(max-width:600px){.ak-stage{left:10px;right:10px;width:auto;bottom:80px}' +
    '.ak-bubble{width:50px;height:50px;left:14px;bottom:14px}.ak-bubble svg{width:26px;height:26px}' +
    '.ak-hint{left:72px;bottom:22px;max-width:150px;font-size:12px;padding:8px 11px}' +
    '.ak-win{height:min(72vh,470px)}}';
  document.head.appendChild(css);

  // ---- Кнопка-пузырь ----
  var bubble = document.createElement('button');
  bubble.className = 'ak-bubble';
  bubble.setAttribute('aria-label', 'Открыть чат с инженером');
  bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="#0a0a0b"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.5 1.3 4.8 3.4 6.3-.1 1-.6 2.4-1.4 3.4 1.6-.2 3.3-.9 4.5-1.8 1.1.3 2.3.5 3.5.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>' +
    '<span class="ak-badge" id="akBadge">🙂</span>';
  document.body.appendChild(bubble);

  // ---- Окно ----
  var stage = document.createElement('div');
  stage.className = 'ak-stage';
  stage.innerHTML =
    '<div class="ak-win">' +
      '<div class="ak-head">' +
        '<div class="ak-hava">' + AVA + '</div>' +
        '<div class="ak-who"><b>Александр</b><span id="akStatus"><i class="ak-dot"></i>инженер SMARTKLIMAT · онлайн</span></div>' +
        '<button class="ak-close" aria-label="Закрыть">&times;</button>' +
      '</div>' +
      '<div class="ak-msgs" id="akMsgs">' +
        '<div class="ak-typing" id="akTyping"><i></i><i></i><i></i></div>' +
      '</div>' +
      '<div class="ak-quick" id="akQuick">' +
        '<button class="ak-q" data-t="Какая мощность кондиционера нужна на мою комнату?">Какая мощность нужна?</button>' +
        '<button class="ak-q" data-t="Сколько стоит установка кондиционера?">Сколько стоит установка?</button>' +
        '<button class="ak-q" data-t="Какие бренды кондиционеров у вас есть?">Какие бренды есть?</button>' +
        '<button class="ak-q" data-t="Вы устанавливаете в моём городе?">Ставите в моём городе?</button>' +
        '<button class="ak-q" data-t="Какая гарантия и есть ли договор?">Гарантия и договор?</button>' +
      '</div>' +
      '<div class="ak-foot">' +
        '<input type="text" class="ak-hp" tabindex="-1" autocomplete="off" id="akHp">' +
        '<input type="text" class="ak-in" id="akIn" placeholder="Спросите Александра…" autocomplete="off">' +
        '<button class="ak-send" id="akSend" aria-label="Отправить">➤</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(stage);

  var msgs = stage.querySelector('#akMsgs');
  var typing = stage.querySelector('#akTyping');
  var input = stage.querySelector('#akIn');
  var quick = stage.querySelector('#akQuick');
  var badge = document.getElementById('akBadge');

  // Ночной статус (по Минску UTC+3, 22:00–08:00).
  (function () {
    var mh = (new Date().getUTCHours() + 3) % 24;
    if (mh < 8 || mh >= 22) {
      var s = document.getElementById('akStatus');
      if (s) s.innerHTML = '<i class="ak-dot" style="background:#e8a400;box-shadow:0 0 0 3px rgba(232,164,0,.28)"></i>ночью — отвечу утром';
    }
  })();

  function setMood(m) { badge.textContent = MOOD[m] || MOOD.hello; }

  function add(role, text, save) {
    var isUser = role === 'user';
    var row = document.createElement('div');
    row.className = 'ak-row ' + (isUser ? 'user' : 'bot');
    row.innerHTML = (isUser ? '' : '<div class="ak-ava">' + AVA + '</div>') +
      '<div class="ak-m ' + (isUser ? 'user' : 'bot') + '"></div>';
    row.querySelector('.ak-m').textContent = text;
    msgs.insertBefore(row, typing);
    msgs.scrollTop = msgs.scrollHeight;
    if (save !== false) {
      history.push({ role: role, text: text });
      try { localStorage.setItem(LS, JSON.stringify(history.slice(-30))); } catch (e) {}
    }
  }

  function maybeLead(d) {
    if (leadDone || !d.lead || !d.phone) return;
    var digits = (d.phone || '').replace(/\D/g, '');
    if (digits.length < 7) return;
    leadDone = true;
    if (typeof window.sendLead === 'function') {
      window.sendLead(d.name || 'Из чата', d.phone, 'Заявка из чата с Александром');
    }
  }

  function ask(sendText) {
    typing.style.display = 'flex';
    setMood('think');
    msgs.scrollTop = msgs.scrollHeight;
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12), page: location.pathname, hp: document.getElementById('akHp').value })
    }).then(function (r) { return r.json(); }).then(function (d) {
      typing.style.display = 'none';
      var reply = d.reply || 'Оставьте телефон — мастер перезвонит за 15 минут. Или звоните: +375 44 761-16-53';
      add('assistant', reply);
      setMood(d.mood || 'hello');
      maybeLead(d);
    }).catch(function () {
      typing.style.display = 'none';
      add('assistant', 'Связь чуть шалит. Позвоните нам: +375 44 761-16-53 — или оставьте телефон, перезвоним.');
      setMood('hello');
    });
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    quick.style.display = 'none';
    add('user', text);
    input.value = '';
    ask(text);
  }

  var opened = false;
  function greet() {
    if (history.length) { history.forEach(function (m) { add(m.role, m.text, false); }); quick.style.display = 'none'; return; }
    ask('');
  }

  function open() {
    stage.classList.add('open');
    hint.style.display = 'none';
    try { localStorage.setItem(HINT_LS, '1'); } catch (e) {}
    setMood('hello');
    if (!opened) { opened = true; greet(); }
    input.focus();
  }
  function close() { stage.classList.remove('open'); }

  bubble.onclick = function () { stage.classList.contains('open') ? close() : open(); };
  stage.querySelector('.ak-close').onclick = close;
  document.getElementById('akSend').onclick = function () { send(input.value); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });
  quick.querySelectorAll('.ak-q').forEach(function (b) { b.onclick = function () { send(b.dataset.t); }; });

  // ---- Подсказка через 5 сек ----
  var hint = document.createElement('div');
  hint.className = 'ak-hint';
  hint.textContent = 'Подобрать кондиционер? Спросите инженера 👷';
  hint.style.display = 'none';
  hint.onclick = open;
  document.body.appendChild(hint);
  var seen = false;
  try { seen = !!localStorage.getItem(HINT_LS); } catch (e) {}
  if (!seen) setTimeout(function () {
    if (stage.classList.contains('open')) return;
    hint.style.display = 'block';
    setTimeout(function () { hint.style.display = 'none'; }, 9000);
  }, 5000);

  window.smartChat = { open: open };
})();
