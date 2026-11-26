(() => {
  'use strict';

  const get = id => document.getElementById(id);
  const items = [
    ['headband', '競選頭巾', 48, 18],
    ['badge', '徽章', 38, 39],
    ['sticker', '貼紙', 61, 38],
    ['ribbon', '布條', 30, 51],
    ['flag', '小旗', 74, 56],
    ['flyer', '傳單', 50, 60],
    ['cell', '📱 手機', 24, 66]
  ];
  const duration = 45000;
  const idCard = get('id-card');
  const person = get('person');
  const winArt = new Image();
  const loseArt = new Image();
  winArt.src = 'assets/victory.webp';
  loseArt.src = 'assets/player.webp';
  let phase = 'intro';
  let removed = 0;
  let started = 0;
  let elapsed = 0;
  let timer;
  let selected;
  let drag;

  function select(item) {
    selected?.classList.remove('selected');
    selected = item;
    selected?.classList.add('selected');
  }

  function updateTime() {
    if (phase !== 'playing') return;
    elapsed = Math.min(duration, performance.now() - started);
    get('clock').textContent = `剩餘 ${Math.ceil((duration - elapsed) / 1000)} 秒`;
    if (elapsed >= duration) finish(false);
  }

  function place(target) {
    updateTime();
    if (phase !== 'playing' || !selected) return;
    if (selected.dataset.target !== target.id) {
      Arcade.sound('hit');
      get('hint').textContent = selected === idCard ? '把身分證交給人物。' :
        selected.dataset.target === 'phone' ? '手機請放進寄放籃。' : '競選小物請放進垃圾桶。';
      return;
    }

    const item = selected;
    select(null);
    if (item === idCard) {
      finish(true);
      return;
    }
    item.remove();
    removed += 1;
    Arcade.sound('tap');
    get('progress').textContent = `已整理 ${removed} / ${items.length}`;
    const ready = removed === items.length;
    person.disabled = !ready;
    idCard.disabled = !ready;
    idCard.classList.toggle('ready', ready);
    get('hint').textContent = ready ? '身分證亮起了！把它拖到人物身上。' : '收好一件！繼續整理其他物品。';
    if (ready) idCard.focus({preventScroll:true});
  }

  function clearDrag() {
    if (!drag) return;
    drag.item.classList.remove('dragging');
    drag.ghost?.remove();
    drag = null;
  }

  function bindItem(item) {
    item.addEventListener('click', () => {
      if (phase !== 'playing') return;
      select(item);
      get('hint').textContent = '已選取。點一下要放置的位置。';
    });
    item.addEventListener('pointerdown', event => {
      if (phase !== 'playing' || item.disabled || !event.isPrimary || event.button !== 0) return;
      drag = {item, x:event.clientX, y:event.clientY};
      item.setPointerCapture(event.pointerId);
    });
    item.addEventListener('pointermove', event => {
      if (drag?.item !== item) return;
      if (!drag.ghost && Math.hypot(event.clientX-drag.x,event.clientY-drag.y) < 6) return;
      if (!drag.ghost) {
        drag.ghost = document.createElement('div');
        drag.ghost.className = 'ghost';
        drag.ghost.textContent = item.textContent;
        drag.ghost.setAttribute('aria-hidden','true');
        document.body.append(drag.ghost);
        item.classList.add('dragging');
        select(item);
      }
      drag.ghost.style.left = event.clientX + 'px';
      drag.ghost.style.top = event.clientY + 'px';
    });
    item.addEventListener('pointerup', event => {
      if (drag?.item !== item) return;
      const target = drag.ghost && document.elementFromPoint(event.clientX,event.clientY)?.closest('.target');
      clearDrag();
      if (target) place(target);
    });
    item.addEventListener('pointercancel', clearDrag);
    item.addEventListener('lostpointercapture', clearDrag);
  }

  function start() {
    Arcade.unlock();
    Arcade.results.reset();
    Arcade.sound('start');
    clearInterval(timer);
    clearDrag();
    select(null);
    phase = 'playing';
    removed = 0;
    elapsed = 0;
    idCard.disabled = true;
    person.disabled = true;
    idCard.classList.remove('ready');
    get('intro').hidden = true;
    get('outcome').hidden = true;
    get('play').hidden = false;
    get('progress').textContent = `已整理 0 / ${items.length}`;
    get('hint').textContent = '可拖曳，也可先點物品，再點放置位置。';
    const buttons = items.map(([id, label, x, y]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'item';
      button.textContent = label;
      button.dataset.target = id === 'cell' ? 'phone' : 'bin';
      button.style.setProperty('--x', x + '%');
      button.style.setProperty('--y', y + '%');
      bindItem(button);
      return button;
    });
    get('items').replaceChildren(...buttons);
    started = performance.now();
    updateTime();
    timer = setInterval(updateTime, 100);
    buttons[0].focus({preventScroll:true});
  }

  function finish(won) {
    phase = won ? 'won' : 'lost';
    clearInterval(timer);
    clearDrag();
    select(null);
    idCard.disabled = true;
    idCard.classList.remove('ready');
    get('play').hidden = true;
    get('outcome').hidden = false;
    const art = get('outcome-art');
    art.src = (won ? winArt : loseArt).src;
    art.alt = won ? '人物手拿身分證，開心舉手歡呼' : '角色還在準備出門';
    art.style.objectFit = won ? 'cover' : 'contain';
    get('headline').textContent = won ? '1128返鄉票' : '東西還沒收好！';
    get('hint').textContent = won ? `${(elapsed/1000).toFixed(2)} 秒完成，帶上身分證出門！` : '挑戰時間到，再整理一次。';
    Arcade.sound(won ? 'win' : 'lose');
    get('show').focus({preventScroll:true});
  }

  function showResult() {
    const won = phase === 'won';
    const art = won ? winArt : loseArt;
    const score = won ? (elapsed/1000).toFixed(2) : removed;
    const unit = won ? '秒完成' : `/ ${items.length} 件`;
    const slogan = won ? '1128返鄉票！' : '東西還沒收好！';
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = won ? '#a7e6ec' : '#d8e4ed';
    ctx.fillRect(0,0,720,900);
    if (art.naturalWidth) {
      const source = Math.min(720/art.naturalWidth,490/art.naturalHeight);
      const w = art.naturalWidth * source;
      const h = art.naturalHeight * source;
      ctx.drawImage(art,(720-w)/2,220+(490-h)/2,w,h);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#17394e';
    ctx.font = 'bold 27px system-ui';
    ctx.fillText('時事遊樂場 · 投票前整理挑戰',360,55);
    ctx.font = '900 68px system-ui';
    ctx.fillText(slogan,360,145,670);
    ctx.font = 'bold 36px system-ui';
    ctx.fillText(`${score} ${unit}`,360,201);
    ctx.font = 'bold 26px system-ui';
    ctx.fillText('國民身分證 · 印章 · 投票通知單',360,775);
    ctx.font = '21px system-ui';
    ctx.fillText('11/28（六）08:00–16:00',360,818);
    ctx.fillText(location.host+'/games/vote-ready/',360,863);
    Arcade.results.open({canvas,title:'1128返鄉票',score,unit,slogan,gameId:'vote-ready',onReplay:start});
  }

  idCard.dataset.target = 'person';
  bindItem(idCard);
  for (const target of [person,get('bin'),get('phone')]) {
    target.addEventListener('click', () => place(target));
  }
  get('start').addEventListener('click', start);
  get('show').addEventListener('click', showResult);
  document.addEventListener('visibilitychange', updateTime);
})();
