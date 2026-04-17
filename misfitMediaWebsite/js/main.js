/* ==========================================================================
   MISFIT MEDIA INTERACTIVE — Main JS
   Handles: sticky nav, mobile menu, smooth scroll, scroll animations
   No dependencies. Runs after DOMContentLoaded.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------------------
  // 1. STICKY NAV — add .scrolled class on scroll > 50px
  // -------------------------------------------------------------------------
  const nav = document.querySelector('.nav');

  const handleNavScroll = () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // run once on load


  // -------------------------------------------------------------------------
  // 2. ACTIVE NAV LINK — highlight section currently in view
  // -------------------------------------------------------------------------
  const navLinks = document.querySelectorAll('.nav__link[data-section]');
  const sections = document.querySelectorAll('section[id]');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(section => sectionObserver.observe(section));


  // -------------------------------------------------------------------------
  // 3. MOBILE MENU — hamburger toggle
  // -------------------------------------------------------------------------
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');
  const mobileLinks = document.querySelectorAll('.nav__mobile-link');

  const openMenu = () => {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close when a link is clicked
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });


  // -------------------------------------------------------------------------
  // 4. SMOOTH SCROLL — intercept all anchor href="#..." clicks
  // -------------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  // -------------------------------------------------------------------------
  // 5. SCROLL REVEAL — .reveal and .stagger elements fade in on entry
  // -------------------------------------------------------------------------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal, .stagger').forEach(el => {
    revealObserver.observe(el);
  });


  // -------------------------------------------------------------------------
  // 6. CONTACT FORM — basic client-side validation + submission feedback
  //    Form uses Formspree by default. Replace action URL in index.html.
  // -------------------------------------------------------------------------
  const form = document.querySelector('.contact__form');
  const formStatus = document.querySelector('.form-status');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const action = form.getAttribute('action');

    // If no real Formspree action set, show a placeholder message
    if (!action || action === '#') {
      if (formStatus) {
        formStatus.textContent = "Form not yet connected — email bedell.taylor@gmail.com directly.";
        formStatus.className = 'form-status form-status--info';
      }
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        form.reset();
        if (formStatus) {
          formStatus.textContent = "Message received. We'll be in touch.";
          formStatus.className = 'form-status form-status--success';
        }
      } else {
        throw new Error('Server error');
      }
    } catch {
      if (formStatus) {
        formStatus.textContent = "Something went wrong. Email bedell.taylor@gmail.com directly.";
        formStatus.className = 'form-status form-status--error';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send It';
    }
  });

});
