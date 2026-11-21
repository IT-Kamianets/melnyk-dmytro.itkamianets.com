// Progressive motion, navigation state, local time, and email copy feedback.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const navLinks = [...document.querySelectorAll('.primary-nav a')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((section) => navObserver.observe(section));
  }

  // Scroll velocity gently modulates the emblem's CSS rotation rate.
  const emblem = document.querySelector('.emblem');
  let previousY = window.scrollY;
  let previousTime = performance.now();
  let velocity = 0;
  let rotation = 0;
  function animateEmblem(now) {
    const elapsed = Math.min((now - previousTime) / 1000, 0.05);
    const currentY = window.scrollY;
    const instantVelocity = elapsed > 0 ? Math.abs(currentY - previousY) / elapsed : 0;
    velocity += (Math.min(instantVelocity / 1800, 1) - velocity) * 0.045;
    rotation += elapsed * (5 + velocity * 75);
    if (emblem && !reducedMotion) emblem.style.transform = `rotate(${rotation % 360}deg)`;
    previousY = currentY;
    previousTime = now;
    requestAnimationFrame(animateEmblem);
  }
  if (emblem && !reducedMotion) requestAnimationFrame(animateEmblem);

  const timeElement = document.getElementById('local-time');
  const updateTime = () => {
    if (!timeElement) return;
    timeElement.textContent = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).format(new Date());
  };
  updateTime();
  window.setInterval(updateTime, 1000);

  const emailButton = document.querySelector('.email-link');
  const toast = document.querySelector('.toast');
  let toastTimer;
  emailButton?.addEventListener('click', async () => {
    const email = emailButton.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      if (toast) {
        toast.textContent = 'СКОПІЙОВАНО';
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
      }
    } catch {
      // Clipboard access may be blocked on non-secure origins; expose the address in the status.
      if (toast) {
        toast.textContent = email;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
      }
    }
  });
})();
