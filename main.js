/* =========================================================
   Casa Hagge — Gedeelde JavaScript
   ========================================================= */

// ── Nav: scrolled class ──────────────────────────────────
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Hamburger menu ───────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileNav  = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── Active nav link ──────────────────────────────────────
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href !== '#' && window.location.pathname.endsWith(href)) {
    link.classList.add('active');
  }
});

// ── Lightbox ─────────────────────────────────────────────
(function() {
  const lightbox     = document.querySelector('.lightbox');
  if (!lightbox) return;

  const lbImg        = lightbox.querySelector('img');
  const lbClose      = lightbox.querySelector('.lightbox-close');
  const lbPrev       = lightbox.querySelector('.lightbox-prev');
  const lbNext       = lightbox.querySelector('.lightbox-next');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const imgs         = galleryItems.map(el => el.querySelector('img').src);
  let currentIdx     = 0;

  function open(idx) {
    currentIdx = idx;
    lbImg.src  = imgs[currentIdx];
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function prev() { currentIdx = (currentIdx - 1 + imgs.length) % imgs.length; lbImg.src = imgs[currentIdx]; }
  function next() { currentIdx = (currentIdx + 1) % imgs.length;               lbImg.src = imgs[currentIdx]; }

  galleryItems.forEach((item, i) => item.addEventListener('click', () => open(i)));
  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  if (lbPrev) lbPrev.addEventListener('click', prev);
  if (lbNext) lbNext.addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });
})();

// ── Booking Calendar ─────────────────────────────────────
(function() {
  const calGrid     = document.getElementById('calGrid');
  if (!calGrid) return;

  const monthLabel  = document.getElementById('calMonth');
  const prevBtn     = document.getElementById('calPrev');
  const nextBtn     = document.getElementById('calNext');
  const datesEl     = document.querySelector('.booking-dates');
  const contactForm = document.getElementById('contactForm');
  const submitBtn   = document.getElementById('submitBooking');

  const today = new Date();
  today.setHours(0,0,0,0);

  let viewDate   = new Date(today.getFullYear(), today.getMonth(), 1);
  let startDate  = null;
  let endDate    = null;
  let hoverDate  = null;

  const MONTHS = ['Januari','Februari','Maart','April','Mei','Juni',
                  'Juli','Augustus','September','Oktober','November','December'];

  function renderCalendar() {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${MONTHS[month]} ${year}`;

    // Day 1 offset (Mon = 0)
    const firstDay = new Date(year, month, 1).getDay();
    const offset   = firstDay === 0 ? 6 : firstDay - 1;
    const days     = new Date(year, month + 1, 0).getDate();

    calGrid.innerHTML = '';

    for (let i = 0; i < offset; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      calGrid.appendChild(el);
    }

    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const el   = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;

      if (date < today) {
        el.classList.add('disabled');
      } else {
        if (date.toDateString() === today.toDateString()) el.classList.add('today');
        if (startDate && sameDay(date, startDate)) el.classList.add('selected-start');
        if (endDate   && sameDay(date, endDate))   el.classList.add('selected-end');

        const compareEnd = endDate || hoverDate;
        if (startDate && compareEnd && date > startDate && date < compareEnd) el.classList.add('in-range');
        if (startDate && compareEnd && sameDay(date, compareEnd) && !endDate) el.classList.add('selected-end');

        el.dataset.ts = date.getTime();
      }
      calGrid.appendChild(el);
    }
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth()    === b.getMonth()
        && a.getDate()     === b.getDate();
  }

  calGrid.addEventListener('click', e => {
    const el = e.target.closest('.cal-day');
    if (!el || el.classList.contains('disabled') || el.classList.contains('empty')) return;
    const date = new Date(+el.dataset.ts);

    if (!startDate || (startDate && endDate)) {
      startDate = date; endDate = null;
    } else {
      if (date <= startDate) { endDate = startDate; startDate = date; }
      else                   { endDate = date; }
    }
    renderCalendar();
    updateSummary();
  });

  calGrid.addEventListener('mouseover', e => {
    const el = e.target.closest('.cal-day');
    if (!el || el.classList.contains('disabled') || !startDate || endDate) { hoverDate = null; return; }
    hoverDate = new Date(+el.dataset.ts);
    renderCalendar();
  });
  calGrid.addEventListener('mouseleave', () => { hoverDate = null; renderCalendar(); });

  prevBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); });
  nextBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); });

  function updateSummary() {
    if (!datesEl) return;
    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    if (startDate && endDate) {
      const nights = Math.round((endDate - startDate) / 86400000);
      datesEl.textContent = `${startDate.toLocaleDateString('nl-NL', opts)} → ${endDate.toLocaleDateString('nl-NL', opts)}  (${nights} nacht${nights !== 1 ? 'en' : ''})`;
      datesEl.classList.add('set');
      if (contactForm) contactForm.style.display = 'block';
    } else if (startDate) {
      datesEl.textContent = 'Kies nu een vertrekdatum…';
      datesEl.classList.remove('set');
    }
  }

  // Form submit
  if (submitBtn) {
    submitBtn.addEventListener('click', e => {
      e.preventDefault();
      const form = document.getElementById('guestForm');
      const fields = form.querySelectorAll('input[required]');
      let valid = true;
      fields.forEach(f => { if (!f.value.trim()) { f.style.borderColor = '#C0392B'; valid = false; } else { f.style.borderColor = ''; } });
      if (!startDate || !endDate) { alert('Selecteer eerst een aankomst- en vertrekdatum.'); return; }
      if (!valid)                 { return; }
      alert('Bedankt! Uw boeking is ontvangen. U krijgt binnenkort een bevestigingsmail.');
    });
  }

  renderCalendar();
})();
