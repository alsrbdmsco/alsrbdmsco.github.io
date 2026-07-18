// ========================================
// Global Settings
// ========================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasHoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const PARTICLE_CONFIG = {
  MAX_COUNT: 80,
  DENSITY_FACTOR: 20000,
  CONNECTION_DISTANCE: 120,
  MOUSE_DISTANCE: 150,
  VELOCITY_RANGE: 0.3,
  SIZE_MIN: 0.5,
  SIZE_RANGE: 1.5,
  OPACITY_MIN: 0.3,
  OPACITY_RANGE: 0.5,
  PRIMARY_COLOR_CHANCE: 0.7
};

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ========================================
// 파티클 네트워크 시스템
// ========================================

class ParticleNetwork {
  constructor() {
    this.enabled = false;
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;

    if (prefersReducedMotion) {
      this.canvas.style.display = 'none';
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.enabled = true;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const particleCount = Math.min(
      Math.floor((this.canvas.width * this.canvas.height) / PARTICLE_CONFIG.DENSITY_FACTOR),
      PARTICLE_CONFIG.MAX_COUNT
    );
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * PARTICLE_CONFIG.VELOCITY_RANGE,
        vy: (Math.random() - 0.5) * PARTICLE_CONFIG.VELOCITY_RANGE,
        size: Math.random() * PARTICLE_CONFIG.SIZE_RANGE + PARTICLE_CONFIG.SIZE_MIN,
        opacity: Math.random() * PARTICLE_CONFIG.OPACITY_RANGE + PARTICLE_CONFIG.OPACITY_MIN,
        color: Math.random() > PARTICLE_CONFIG.PRIMARY_COLOR_CHANCE ? '#34d399' : '#60a5fa'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
      this.ctx.fill();
    });

    this.drawConnections();
    this.handleMouseInteraction();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PARTICLE_CONFIG.CONNECTION_DISTANCE) {
          const opacity = (1 - distance / PARTICLE_CONFIG.CONNECTION_DISTANCE) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  handleMouseInteraction() {
    if (this.mouse.x === null || this.mouse.y === null) return;

    this.particles.forEach(particle => {
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < PARTICLE_CONFIG.MOUSE_DISTANCE) {
        const opacity = (1 - distance / PARTICLE_CONFIG.MOUSE_DISTANCE) * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });
  }

  bindEvents() {
    window.addEventListener('resize', debounce(() => {
      this.resizeCanvas();
      this.createParticles();
    }, 200));

    // 캔버스는 z-index: -1로 콘텐츠 뒤에 있으므로 window에서 마우스를 추적한다
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (this.enabled && !this.animationId) {
      this.animate();
    }
  }
}

// ========================================
// 네비게이션 관리
// ========================================

class NavigationManager {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.init();
  }

  init() {
    if (this.navbar) this.bindScrollEvents();
    if (this.navToggle && this.navMenu) this.bindNavigationEvents();
    this.bindSmoothScroll();
  }

  bindScrollEvents() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateNavbarOnScroll();
          this.updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  updateNavbarOnScroll() {
    if (window.scrollY > 100) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
  }

  updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    let currentSection = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 200;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  closeMenu() {
    this.navMenu.classList.remove('active');
    this.navToggle.classList.remove('active');
    this.navToggle.setAttribute('aria-expanded', 'false');
    this.navToggle.setAttribute('aria-label', '메뉴 열기');
    document.body.style.overflow = '';
  }

  bindNavigationEvents() {
    this.navToggle.addEventListener('click', () => {
      const isExpanded = this.navMenu.classList.toggle('active');
      this.navToggle.classList.toggle('active');
      this.navToggle.setAttribute('aria-expanded', isExpanded);
      this.navToggle.setAttribute('aria-label', isExpanded ? '메뉴 닫기' : '메뉴 열기');
      document.body.style.overflow = isExpanded ? 'hidden' : '';
    });

    this.navLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });

    document.addEventListener('click', (e) => {
      if (this.navMenu.classList.contains('active') &&
          !this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
        this.closeMenu();
      }
    });
  }

  bindSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      // 스킵 링크는 브라우저 기본 동작(포커스 이동)을 유지해야 한다
      if (anchor.classList.contains('skip-link')) return;

      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();

        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        // 키보드 사용자를 위해 포커스도 함께 이동
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }
}

// ========================================
// 스크롤 진행 바
// ========================================

class ScrollProgress {
  constructor() {
    this.bar = document.querySelector('.scroll-progress');
    if (!this.bar) return;

    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      this.bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }
}

// ========================================
// 히어로 플라이스루 (스크롤 시 카메라가 뚫고 지나가는 효과)
// ========================================

class HeroFlythrough {
  constructor() {
    this.el = document.querySelector('.hero-content');
    if (!this.el || prefersReducedMotion) return;

    let ticking = false;
    const update = () => {
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.85), 1);

      if (progress <= 0) {
        // 최상단에서는 인라인 스타일을 제거해 진입 애니메이션과 충돌하지 않게 한다
        this.el.style.transform = '';
        this.el.style.opacity = '';
        this.el.style.filter = '';
        this.el.style.transition = '';
      } else {
        this.el.style.transition = 'none';
        this.el.style.transform = `translateY(${progress * -40}px) scale(${1 + progress * 0.45})`;
        this.el.style.opacity = `${Math.max(1 - progress * 1.15, 0)}`;
        this.el.style.filter = `blur(${(progress * 6).toFixed(2)}px)`;
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }
}

// ========================================
// 터미널 타이핑 애니메이션
// ========================================

class TerminalTyper {
  constructor() {
    this.body = document.getElementById('terminal-body');
    if (!this.body) return;

    this.lines = [
      { cmd: 'whoami', out: ['mingyu — Infrastructure Engineer @ 1nfra'] },
      {
        cmd: 'kubectl get nodes',
        out: [
          'NAME        STATUS   ROLES           AGE',
          'prod-ctrl   Ready    control-plane   2y',
          'prod-node   Ready    worker          2y'
        ]
      },
      { cmd: 'ls ~/stack', out: ['aws/  azure/  ncp/  kubernetes/  linux/  network/'] }
    ];

    if (prefersReducedMotion) {
      this.renderStatic();
      return;
    }
    this.start();
  }

  makePromptLine() {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = '$ ';
    const cmd = document.createElement('span');
    cmd.className = 'cmd';
    line.appendChild(prompt);
    line.appendChild(cmd);
    return { line, cmd };
  }

  makeOutputLine(text) {
    const line = document.createElement('div');
    line.className = 'terminal-output';
    line.textContent = text;
    return line;
  }

  renderStatic() {
    this.lines.forEach(entry => {
      const { line, cmd } = this.makePromptLine();
      cmd.textContent = entry.cmd;
      this.body.appendChild(line);
      entry.out.forEach(text => this.body.appendChild(this.makeOutputLine(text)));
    });
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async typeCommand(entry) {
    const { line, cmd } = this.makePromptLine();
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    line.appendChild(cursor);
    this.body.appendChild(line);

    for (const char of entry.cmd) {
      cmd.textContent += char;
      await this.wait(40 + Math.random() * 40);
    }
    await this.wait(350);
    cursor.remove();

    for (const text of entry.out) {
      this.body.appendChild(this.makeOutputLine(text));
      await this.wait(110);
    }
    await this.wait(800);
  }

  async start() {
    // 페이지가 백그라운드로 가면 setTimeout이 지연될 뿐 로직은 안전하다
    for (;;) {
      this.body.textContent = '';
      for (const entry of this.lines) {
        await this.typeCommand(entry);
      }
      const idle = document.createElement('div');
      idle.className = 'terminal-line';
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = '$ ';
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      idle.appendChild(prompt);
      idle.appendChild(cursor);
      this.body.appendChild(idle);
      await this.wait(5000);
    }
  }
}

// ========================================
// 3D 틸트 카드
// ========================================

class TiltEffect {
  constructor() {
    if (prefersReducedMotion || !hasHoverPointer) return;

    const MAX_DEG = 7;
    document.querySelectorAll('.cert-card, .contact-card, .info-card, .stat-item').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(700px) rotateX(${(-py * MAX_DEG).toFixed(2)}deg) rotateY(${(px * MAX_DEG).toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
}

// ========================================
// 숫자 카운터 (통계)
// ========================================

class StatCounter {
  constructor() {
    this.counters = document.querySelectorAll('.stat-number[data-target]');
    if (!this.counters.length) return;

    if (prefersReducedMotion) {
      this.counters.forEach(el => this.setFinal(el));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    this.counters.forEach(el => observer.observe(el));
  }

  setFinal(el) {
    el.textContent = el.dataset.target + (el.dataset.suffix || '');
  }

  animate(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

// ========================================
// 스크롤 리빌 애니메이션 (스태거 지원)
// ========================================

class ScrollAnimationManager {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    this.init();
  }

  init() {
    this.applyStagger();
    this.setupIntersectionObserver();
  }

  applyStagger() {
    if (prefersReducedMotion) return;
    const grids = document.querySelectorAll('.certifications-grid, .about-info, .about-content, .contact-info, .stats-grid');
    grids.forEach(grid => {
      Array.from(grid.children).forEach((child, i) => {
        if (child.classList.contains('fade-in-up')) {
          child.style.transitionDelay = `${Math.min(i * 60, 480)}ms`;
        }
      });
    });
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
          // 리빌 완료 후 stagger 딜레이 제거 (호버 트랜지션 지연 방지)
          setTimeout(() => {
            entry.target.style.transitionDelay = '';
          }, 1400);
        }
      });
    }, this.observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
      observer.observe(el);
    });
  }
}

// ========================================
// 메인 애플리케이션 초기화
// ========================================

class App {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.particleNetwork = new ParticleNetwork();
      new NavigationManager();
      new ScrollAnimationManager();
      new ScrollProgress();
      new HeroFlythrough();
      new TerminalTyper();
      new TiltEffect();
      new StatCounter();

      this.setupVisibilityHandling();
    });
  }

  setupVisibilityHandling() {
    // 탭이 백그라운드로 가면 파티클 애니메이션을 멈추고, 돌아오면 재개
    document.addEventListener('visibilitychange', () => {
      if (!this.particleNetwork || !this.particleNetwork.enabled) return;
      if (document.hidden) {
        this.particleNetwork.pause();
      } else {
        this.particleNetwork.resume();
      }
    });
  }
}

new App();
