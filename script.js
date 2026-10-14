/* =========================================================
   CONFIG — edit these values to update the site
   ========================================================= */
const EVENT_DATE = new Date('2026-10-18T10:00:00+08:00'); // ✏️ update time here too
const HOST_EMAIL = 'marchille13@gmail.com'; // ✏️ contact + RSVP messages are emailed here
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/' + HOST_EMAIL;

// Milestone photos — MONTH IS DERIVED FROM FILENAME (single source of truth)
// Filenames live in /assets. Leading number = month (0 = newborn, 1..12).
// ✏️ To add/replace a photo, just drop the file in /assets and add its exact
// filename below — badge, sorting, navigator and counter update automatically.
// Order below does not matter: PHOTOS is always re-sorted 0 → 12 by filename number.
const PHOTO_FILES = [
  { file: '0newborn.JPEG',  title: 'Welcome to the World', note: 'The miracle day Eliara was welcomed into our arms with pure wonder and boundless love.' },
  { file: '1month.JPEG',    title: 'Little Bundled Dreamer', note: 'Little bundle of sleepy yawns, tiny fingers, and unconditional love.' },
  { file: '2 months.JPEG',  title: 'First Big Smiles', note: 'Bright eyes tracking mama and papa everywhere, flashing the sweetest gummy smiles.' },
  { file: '3 months.JPEG',  title: 'Giggle Machine', note: 'Began cooing musical tunes and finding her hands to nibble on.' },
  { file: '4 months.JPEG',  title: 'Curious Explorer', note: 'Reaching out with joyful determination for colorful toys and soft rattles.' },
  { file: '5 months.JPEG',  title: 'Toe Nibbler & Giggler', note: 'Discovered her cute little feet and couldn’t stop grabbing them.' },
  { file: '6 months.JPEG',  title: 'Halfway to One!', note: 'Sitting up like a little princess and trying her very first taste of purees.' },
  { file: '7 months.JPEG',  title: 'Wiggly Adventurer', note: 'Army crawling in circles and inspecting every little corner of the living room rug.' },
  { file: '8 months.JPEG',  title: 'Bouncing Baby Girl', note: 'Pulling up to stand on cushions and showing off two darling tiny front teeth.' },
  { file: '9months.JPEG',   title: 'Bye-Bye & Wave Hello', note: 'Mastered waving little hello and goodbye hands, babbling "mama" and "dada".' },
  { file: '10 months.JPEG', title: 'Cruising & Dancing', note: 'Cruising along furniture with confidence, dancing whenever music starts.' },
  { file: '11months.JPEG',  title: 'Almost ONE Year Old!', note: 'Standing proudly on her own two feet, counting down the days to her 1st Birthday celebration!' },
  { file: '12months.JPG',   title: 'Happy 1st Birthday!', note: 'One whole year of magic, wonder and love — our little fairy is officially ONE!' },
];

/* Filename → month helpers (handles "0newborn", "1month", "2 months", "10 months", etc.) */
function parseMonthFromFilename(file) {
  const m = String(file || '').match(/(\d+)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? Math.min(12, Math.max(0, n)) : 0;
}
function monthBadge(month) {
  if (month === 0) return '0 Month (Newborn)';
  if (month === 1) return '1 Month Old';
  if (month === 12) return '12 Months (1 Year!)';
  return month + ' Months Old';
}
function monthShort(month) {
  if (month === 0) return 'NB';
  return String(month);
}
function monthLong(month) {
  if (month === 0) return 'Newborn';
  if (month === 1) return '1 Month';
  return month + ' Months';
}

// Enrich + FORCE chronological order by filename number (0 → 12)
const PHOTOS = PHOTO_FILES.map(p => {
  const month = parseMonthFromFilename(p.file);
  return { ...p, month, badge: monthBadge(month), short: monthShort(month), long: monthLong(month) };
}).sort((a, b) => a.month - b.month);
const ASSET_PATH = 'assets/';

/* ===== Milestone Gallery — Netlify style: infinite marquee + carousel + lightbox ===== */
(function gallery() {
  const box = document.getElementById('gallery');
  const hint = document.getElementById('gallery-hint');
  const countEl = document.getElementById('milestone-count');
  const pauseBtn = document.getElementById('pause-btn');
  const carousel = document.getElementById('carousel');
  const lightbox = document.getElementById('lightbox');
  if (!box) return;

  const ranges = { all: [0, 12], '0-3': [0, 3], '4-7': [4, 7], '8-12': [8, 12] };
  const rangeNames = { all: 'All 13 Milestones (Newborn – 12 Months)', '0-3': '4 Milestones (Newborn – 3 Months)', '4-7': '4 Milestones (4 – 7 Months)', '8-12': '5 Milestones (8 – 12 Months)' };
  let currentFilter = 'all';
  let isPaused = false;
  let currentView = 'marquee';
  let carIndex = 0;
  let lbIndex = 0;

  const list = () => {
    const [a, b] = ranges[currentFilter];
    return PHOTOS.filter(p => p.month >= a && p.month <= b);
  };
  const src = (p) => ASSET_PATH + encodeURI(p.file);

  function cardHTML(p, i, hidden) {
    return `
      <figure class="photo" data-index="${i}"${hidden ? ' aria-hidden="true"' : ''} tabindex="${hidden ? '-1' : '0'}" role="button" aria-label="Enlarge ${p.badge} photo">
        <div class="photo__media">
          <img src="${src(p)}" alt="${p.badge} - ${p.title}" loading="lazy" draggable="false" onerror="this.style.opacity='0'" />
          <div class="photo__zoom" aria-hidden="true"><span>⤢</span></div>
          <div class="photo__badge">${p.badge}</div>
        </div>
        <h4>${p.title}</h4>
        <p>${p.note}</p>
        <span class="photo__tap">Tap to view photo</span>
      </figure>`;
  }

  function renderMarquee() {
    const items = list();
    const cards = (hidden) => items.map((p, i) => cardHTML(p, i, hidden)).join('');
    // Duplicate the set so the loop is seamless; speed scales with item count
    box.innerHTML = `<div class="gallery__track${isPaused ? ' is-paused' : ''}" style="--dur:${Math.max(20, items.length * 5)}s">${cards(false)}${cards(true)}</div>`;
    if (countEl) countEl.textContent = rangeNames[currentFilter];
  }

  function renderCarousel() {
    const items = list();
    if (!items.length) return;
    carIndex = Math.min(carIndex, items.length - 1);
    const p = items[carIndex];
    const carImg = document.getElementById('car-image');
    carImg.src = src(p);
    carImg.alt = `${p.badge} - ${p.title}`;
    document.getElementById('car-badge').textContent = p.badge;
    document.getElementById('car-title').textContent = p.title;
    document.getElementById('car-desc').textContent = p.note;
    document.getElementById('car-counter').textContent = `${carIndex + 1} / ${items.length}`;
    // Re-trigger pop animation on every slide so feedback is visible
    const card = document.getElementById('car-card');
    if (card) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
    // Preload neighbours for instant swipe
    [carIndex + 1, carIndex - 1].forEach(k => {
      const n = items[(k + items.length) % items.length];
      if (n) { const im = new Image(); im.src = src(n); }
    });
    const dots = document.getElementById('car-dots');
    if (dots) dots.innerHTML = items.map((_, i) => `<button data-dot="${i}" class="${i === carIndex ? 'is-active' : ''}" aria-label="Go to photo ${i + 1}"></button>`).join('');
    // Month navigator thumbs — always in filename-number order (NB, 1..12)
    const thumbs = document.getElementById('car-thumbs');
    if (thumbs) thumbs.innerHTML = items.map((t, i) => `<button data-thumb="${i}" role="tab" aria-selected="${i === carIndex ? 'true' : 'false'}" class="${i === carIndex ? 'is-active' : ''}" title="${t.badge} - ${t.title}">${t.short}</button>`).join('');
    if (countEl) countEl.textContent = rangeNames[currentFilter];
  }

  function render() {
    if (currentView === 'marquee') { box.hidden = false; if (hint) hint.hidden = false; carousel.hidden = true; renderMarquee(); }
    else { box.hidden = true; if (hint) hint.hidden = true; carousel.hidden = false; renderCarousel(); }
  }

  function setPaused(v) {
    isPaused = v;
    pauseBtn.setAttribute('aria-pressed', String(v));
    pauseBtn.textContent = v ? '▶ Resume Motion' : '⏸ Pause Motion';
    const track = box.querySelector('.gallery__track');
    if (track) track.classList.toggle('is-paused', v);
  }

  // Open lightbox at filtered-list index
  function openLightbox(i) {
    const items = list();
    lbIndex = (i + items.length) % items.length;
    const p = items[lbIndex];
    const img = document.getElementById('lightbox-img');
    img.src = src(p);
    img.alt = `${p.badge} - ${p.title}`;
    document.getElementById('lightbox-badge').textContent = p.badge;
    document.getElementById('lightbox-title').textContent = p.title;
    document.getElementById('lightbox-desc').textContent = p.note;
    document.getElementById('lightbox-counter').textContent = `${lbIndex + 1} / ${items.length}`;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lightbox-close').focus();
  }
  function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ''; }
  function stepLightbox(d) { openLightbox(lbIndex + d); }

  // Marquee card clicks (event delegation, includes duplicated set)
  box.addEventListener('click', e => {
    const fig = e.target.closest('.photo');
    if (!fig) return;
    openLightbox(parseInt(fig.dataset.index, 10));
  });
  box.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('photo')) {
      e.preventDefault();
      openLightbox(parseInt(e.target.dataset.index, 10));
    }
  });
  // Tap on track toggles pause briefly on touch devices (mirrors Netlify "tap to pause")
  box.addEventListener('pointerdown', () => {
    const track = box.querySelector('.gallery__track');
    if (track) track.style.animationPlayState = 'paused';
  });
  box.addEventListener('pointerup', () => {
    const track = box.querySelector('.gallery__track');
    if (track && !isPaused) track.style.animationPlayState = '';
  });

  document.getElementById('filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    document.querySelectorAll('.filter').forEach(f => f.classList.toggle('is-active', f === btn));
    currentFilter = btn.dataset.filter;
    carIndex = 0;
    render();
  });

  document.getElementById('view-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;
    document.querySelectorAll('.view-btn').forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    currentView = btn.dataset.view;
    if (pauseBtn) pauseBtn.style.display = currentView === 'marquee' ? '' : 'none';
    render();
  });

  if (pauseBtn) pauseBtn.addEventListener('click', () => setPaused(!isPaused));

  document.getElementById('car-prev').addEventListener('click', () => stepCar(-1));
  document.getElementById('car-next').addEventListener('click', () => stepCar(1));
  function stepCar(d) {
    const n = list().length;
    if (!n) return;
    carIndex = (carIndex + d + n) % n;
    renderCarousel();
  }
  document.getElementById('car-dots').addEventListener('click', e => {
    const d = e.target.closest('[data-dot]');
    if (!d) return;
    carIndex = parseInt(d.dataset.dot, 10);
    renderCarousel();
  });
  const thumbsEl = document.getElementById('car-thumbs');
  if (thumbsEl) thumbsEl.addEventListener('click', e => {
    const t = e.target.closest('[data-thumb]');
    if (!t) return;
    carIndex = parseInt(t.dataset.thumb, 10);
    renderCarousel();
  });
  // Swipe / drag support for mobile + desktop (carousel + lightbox)
  // Horizontal swipe navigates, vertical scroll stays native via touch-action: pan-y
  function addSwipe(el, onLeft, onRight, threshold = 45) {
    if (!el) return;
    let startX = 0, startY = 0, tracking = false;
    el.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', e => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        el.dataset.swiped = String(Date.now());
        if (dx < 0) onLeft();
        else onRight();
      }
    }, { passive: true });
    el.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
    // Mouse drag for desktop (fully functional on PC too)
    let mDown = false, mX = 0, mY = 0;
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      mDown = true; mX = e.clientX; mY = e.clientY;
    });
    el.addEventListener('mouseup', e => {
      if (!mDown) return;
      mDown = false;
      const dx = e.clientX - mX;
      const dy = e.clientY - mY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        el.dataset.swiped = String(Date.now());
        if (dx < 0) onLeft();
        else onRight();
      }
    });
    el.addEventListener('mouseleave', () => { mDown = false; });
  }
  function wasJustSwiped(el, ms = 350) {
    const t = parseInt(el.dataset.swiped || '0', 10);
    return Date.now() - t < ms;
  }
  const carCard = document.getElementById('car-card');
  addSwipe(carCard, () => stepCar(1), () => stepCar(-1));
  // Keyboard arrows for carousel when visible (desktop a11y)
  document.addEventListener('keydown', e => {
    if (currentView !== 'carousel') return;
    if (carousel.hidden) return;
    if (!lightbox.hidden) return; // lightbox has its own handler
    if (e.key === 'ArrowLeft') stepCar(-1);
    if (e.key === 'ArrowRight') stepCar(1);
  });
  // Clicking the carousel photo also enlarges it (suppressed right after a swipe)
  carCard.addEventListener('click', () => {
    if (wasJustSwiped(carCard)) return;
    openLightbox(carIndex);
  });
  // Swipe on lightbox image too
  addSwipe(document.getElementById('lightbox'),
    () => stepLightbox(1),
    () => stepLightbox(-1));

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(-1); });
  document.getElementById('lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(1); });
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });

  render();
})();

/* ===== Add to calendar (Google Calendar, .ics on Apple devices) ===== */
(function addToCalendar() {
  const link = document.getElementById('add-calendar');
  if (!link) return;
  const title = "Eliara Elouise's 1st Birthday (Fairy Theme)";
  const location = 'JBT Resort, Victoria, Tago, Surigao del Sur';
  const details = 'Fairy First Birthday \u2022 Games, souvenirs & photo op \u2022 Casual attire';
  const start = EVENT_DATE;
  const end = new Date(start.getTime() + 3 * 36e5); // assumed 3-hour party
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(title)
    + '&dates=' + fmt(start) + '/' + fmt(end)
    + '&details=' + encodeURIComponent(details)
    + '&location=' + encodeURIComponent(location);
  link.href = gcal;
  link.target = '_blank';
  link.rel = 'noopener';

  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  if (!isApple) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Eliara//Birthday//EN', 'BEGIN:VEVENT',
      'UID:eliara-1st-birthday-20261018@eliara', 'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start), 'DTEND:' + fmt(end),
      'SUMMARY:' + title, 'LOCATION:' + location.replace(/,/g, '\\,'), 'DESCRIPTION:' + details,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'eliara-1st-birthday.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
})();

/* ===== Fade-in sections on scroll ===== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ===== Active nav link + back-to-top ===== */
(function navSpy() {
  const links = [...document.querySelectorAll('.nav__links a')];
  const toTop = document.getElementById('to-top');
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 120;
    links.forEach(l => {
      const s = document.querySelector(l.getAttribute('href'));
      l.classList.toggle('active', s.offsetTop <= y && s.offsetTop + s.offsetHeight > y);
    });
    toTop.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
})();

/* ===== Countdown ===== */
(function countdown() {
  const els = ['days', 'hours', 'mins', 'secs'].map(k => document.getElementById('cd-' + k));
  function tick() {
    const diff = Math.max(0, EVENT_DATE - new Date());
    const vals = [
      Math.floor(diff / 864e5),
      Math.floor(diff / 36e5) % 24,
      Math.floor(diff / 6e4) % 60,
      Math.floor(diff / 1e3) % 60,
    ];
    els.forEach((el, i) => (el.textContent = String(vals[i]).padStart(2, '0')));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ===== RSVP form (emailed to HOST_EMAIL via FormSubmit, mailto fallback) ===== */
(function forms() {
  const rsvpForm = document.getElementById('rsvp-form');
  const success = document.getElementById('rsvp-success');
  const successMsg = document.getElementById('success-msg');
  const countInput = document.getElementById('guest-count');

  function showSuccess(form, msg) {
    successMsg.textContent = msg;
    form.hidden = true;
    success.hidden = false;
  }

  function setSending(btn, sending) {
    if (!btn) return null;
    if (sending) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending… ⏳';
      return () => { btn.disabled = false; btn.textContent = btn.dataset.label; };
    }
    return null;
  }

  async function sendToHost(payload) {
    const res = await fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...payload, _template: 'table', _captcha: 'false' }),
    });
    if (!res.ok) throw new Error('Send failed (' + res.status + ')');
    return res.json().catch(() => ({}));
  }

  function mailtoFallback(subject, body) {
    const url = 'mailto:' + HOST_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    return 'Could not send automatically. <a href="' + url + '">Click here to send via your email app →</a>';
  }

  rsvpForm.addEventListener('change', e => {
    if (e.target.name === 'attendance') countInput.disabled = e.target.value === 'not-coming';
  });

  rsvpForm.addEventListener('submit', async e => {
    e.preventDefault();
    const error = document.getElementById('form-error');
    const data = new FormData(rsvpForm);
    const name = (data.get('guestName') || '').trim();
    const attendance = data.get('attendance');
    const count = parseInt(countInput.value, 10);

    if (!attendance) return (error.textContent = 'Please let us know if you can come.');
    if (!name) return (error.textContent = 'Please enter your name.');
    if (attendance === 'coming' && (!count || count < 1))
      return (error.textContent = 'Please enter how many will attend.');
    error.textContent = '';

    const btn = document.getElementById('rsvp-submit');
    const done = setSending(btn, true);
    const subject = "Eliara's 1st Birthday RSVP — " + name;
    const payload = {
      _subject: subject,
      Form: 'RSVP',
      Attendance: attendance === 'coming' ? 'Coming 🎉' : 'Not coming 💌',
      'Guest name(s)': name,
      'Number attending': data.get('guestCount') || count,
      'Email / phone': data.get('contact') || '',
      'Kids attending': data.get('kids') || '0',
      'Message for Eliara': data.get('message') || '',
    };
    try {
      await sendToHost(payload);
      showSuccess(rsvpForm, attendance === 'coming'
        ? `Thank you, ${name}! Your RSVP was sent to ${HOST_EMAIL}. (${count} guest${count > 1 ? 's' : ''})`
        : `Thank you, ${name}! Your message was sent to ${HOST_EMAIL}. We'll miss you! 💕`);
    } catch (err) {
      console.warn('RSVP send failed:', err);
      const body = Object.entries(payload).map(([k, v]) => k + ': ' + v).join('\n');
      error.innerHTML = mailtoFallback(subject, body);
    } finally {
      if (done) done();
    }
  });
})();
