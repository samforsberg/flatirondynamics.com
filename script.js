const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');
const form = document.querySelector('#notifyForm');
const formMessage = document.querySelector('#formMessage');
const counters = document.querySelectorAll('[data-count]');
const revealItems = document.querySelectorAll('.section-reveal, .reveal-card');
const progress = document.querySelector('.scroll-progress span');
const parallaxItems = document.querySelectorAll('.parallax');
const scrollFloatItems = document.querySelectorAll('.sticky-copy, .product-panel, .spec-card, .engineering-grid article');
const canvas = document.querySelector('#particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: null, y: null };
let ticking = false;

year.textContent = new Date().getFullYear();

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', isOpen.toString());
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});



document.querySelectorAll('.product-panel, .engineering-grid article, .timeline-track article, .founder-card').forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--card-x', `${x}%`);
    card.style.setProperty('--card-y', `${y}%`);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  if (!email) return;
  formMessage.textContent = 'You are on the early access list.';
  form.reset();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });
revealItems.forEach((item) => revealObserver.observe(item));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = element.dataset.format === 'year' ? String(value) : value.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.7 });
counters.forEach((counter) => counterObserver.observe(counter));

function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progress.style.width = `${ratio * 100}%`;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const allowParallax = window.innerWidth > 860 && !reducedMotion;
  parallaxItems.forEach((item) => {
    if (!allowParallax) {
      item.style.transform = '';
      return;
    }
    const speed = Number(item.dataset.speed || 0);
    const rect = item.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight / 2) * speed;
    const limited = Math.max(-34, Math.min(34, offset));
    item.style.transform = `translate3d(0, ${limited}px, 0)`;
  });

  const allowFloat = window.innerWidth > 760 && !reducedMotion;
  scrollFloatItems.forEach((item, index) => {
    if (!allowFloat) {
      item.style.setProperty('--scroll-lift', '0px');
      item.style.removeProperty('transform');
      return;
    }

    const rect = item.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = (center - window.innerHeight / 2) / window.innerHeight;
    const strength = item.classList.contains('sticky-copy') ? 82 : item.classList.contains('product-panel') ? 46 : 22;
    const stagger = item.classList.contains('product-panel') ? (index % 3) * 5 : 0;
    const lift = Math.max(-62, Math.min(62, -distance * strength + stagger));
    item.style.setProperty('--scroll-lift', `${lift.toFixed(2)}px`);

    // The left platform card had competing CSS transforms from previous iterations.
    // Set the final transform directly so it visibly glides with scroll every time.
    if (item.classList.contains('sticky-copy')) {
      item.style.setProperty('transform', `translate3d(0, ${lift.toFixed(2)}px, 0)`, 'important');
    }
  });

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateScrollEffects);
    ticking = true;
  }
}, { passive: true });

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  updateScrollEffects();
  const count = window.innerWidth < 720 ? Math.min(28, Math.floor(window.innerWidth / 26)) : Math.min(64, Math.floor(window.innerWidth / 22));
  particles = Array.from({ length: count }, createParticle);
}

function createParticle() {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    size: Math.random() * 1.5 + 0.6
  };
}

function drawParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
    if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

    const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 4);
    glow.addColorStop(0, 'rgba(216, 225, 236, 0.7)');
    glow.addColorStop(1, 'rgba(216, 225, 236, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
    ctx.fill();

    for (let next = index + 1; next < particles.length; next++) {
      const other = particles[next];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 128) {
        ctx.strokeStyle = `rgba(127, 145, 168, ${0.2 * (1 - distance / 128)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    if (mouse.x && mouse.y) {
      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 165) {
        ctx.strokeStyle = `rgba(216, 225, 236, ${0.26 * (1 - distance / 165)})`;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  });
  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  document.documentElement.style.setProperty('--mx', `${event.clientX}px`);
  document.documentElement.style.setProperty('--my', `${event.clientY}px`);
});
window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

resizeCanvas();
updateScrollEffects();
drawParticles();
