// 파티클 네트워크 시스템
class ParticleNetwork {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
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
    const particleCount = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 20000), 80);
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        color: Math.random() > 0.7 ? '#00ff88' : '#0088ff'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 파티클 업데이트 및 렌더링
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 경계 처리
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      // 파티클 그리기
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
      this.ctx.fill();
    });

    // 연결선 그리기
    this.drawConnections();
    
    // 마우스 상호작용
    this.handleMouseInteraction();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = (1 - distance / 120) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  handleMouseInteraction() {
    if (this.mouse.x && this.mouse.y) {
      this.particles.forEach(particle => {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(0, 136, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.createParticles();
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// 네비게이션 관리
class NavigationManager {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.navToggle = document.getElementById('nav-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.init();
  }

  init() {
    this.bindScrollEvents();
    this.bindNavigationEvents();
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
    });
  }

  updateNavbarOnScroll() {
    if (window.scrollY > 100) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
  }

  updateActiveSection() {
    const sections = document.querySelectorAll('section');
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

  bindNavigationEvents() {
    this.navToggle.addEventListener('click', () => {
      this.navMenu.classList.toggle('active');
      this.navToggle.classList.toggle('active');
      document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : 'auto';
    });

    // 메뉴 링크 클릭 시 모바일 메뉴 닫기
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.navMenu.classList.remove('active');
        this.navToggle.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
        this.navMenu.classList.remove('active');
        this.navToggle.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  bindSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

// 스크롤 애니메이션 관리
class ScrollAnimationManager {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, this.observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
      observer.observe(el);
    });
  }
}

// 폼 관리
class FormManager {
  constructor() {
    this.form = document.querySelector('.form');
    // EmailJS 설정 - 실제 값으로 교체 필요
    this.emailjsConfig = {
      publicKey: 'YOUR_PUBLIC_KEY',      // EmailJS Public Key
      serviceId: 'YOUR_SERVICE_ID',      // EmailJS Service ID
      templateId: 'YOUR_TEMPLATE_ID'     // EmailJS Template ID
    };
    this.init();
  }

  init() {
    if (this.form) {
      // EmailJS 초기화
      if (typeof emailjs !== 'undefined' && this.emailjsConfig.publicKey !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(this.emailjsConfig.publicKey);
      }

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  }

  async handleFormSubmit() {
    const button = this.form.querySelector('.btn');
    const originalText = button.innerHTML;

    // 버튼 비활성화 및 로딩 상태
    button.innerHTML = '<span>전송 중...</span>';
    button.disabled = true;
    button.style.opacity = '0.7';

    try {
      // EmailJS가 설정되어 있는지 확인
      if (typeof emailjs === 'undefined' || this.emailjsConfig.publicKey === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS가 설정되지 않았습니다. Console을 확인하세요.');
      }

      // EmailJS로 이메일 전송
      const response = await emailjs.sendForm(
        this.emailjsConfig.serviceId,
        this.emailjsConfig.templateId,
        this.form
      );

      console.log('Email sent successfully:', response);
      this.showSuccessMessage();
      this.form.reset();

    } catch (error) {
      console.error('Email send failed:', error);
      this.showErrorMessage(error);
    } finally {
      // 버튼 복원
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
      }, 3000);
    }
  }

  showSuccessMessage() {
    const button = this.form.querySelector('.btn');
    button.innerHTML = '<span>✓ 전송 완료!</span>';
    button.style.background = '#00ff88';
  }

  showErrorMessage(error) {
    const button = this.form.querySelector('.btn');
    button.innerHTML = '<span>✗ 전송 실패</span>';
    button.style.background = '#ff0066';

    // 에러 상세 정보 표시
    if (error.message.includes('설정되지 않았습니다')) {
      console.warn('⚠️ EmailJS 설정 필요:');
      console.warn('1. https://www.emailjs.com 에서 가입');
      console.warn('2. Email Service 연결 (Gmail 등)');
      console.warn('3. Email Template 생성');
      console.warn('4. script.js의 emailjsConfig 값 입력');
      console.warn('   - Public Key');
      console.warn('   - Service ID');
      console.warn('   - Template ID');
    }
  }
}

// 성능 최적화
class PerformanceManager {
  constructor() {
    this.init();
  }

  init() {
    // 향후 성능 최적화 기능 추가 가능
    // 현재는 이미지 lazy loading 등의 기능이 필요할 때 추가
  }
}

// 메인 애플리케이션 초기화
class App {
  constructor() {
    this.particleNetwork = null;
    this.navigationManager = null;
    this.scrollAnimationManager = null;
    this.formManager = null;
    this.performanceManager = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeComponents();
      this.setupEventListeners();
    });
  }

  initializeComponents() {
    // 파티클 네트워크 초기화
    this.particleNetwork = new ParticleNetwork();
    
    // 네비게이션 관리자 초기화
    this.navigationManager = new NavigationManager();
    
    // 스크롤 애니메이션 관리자 초기화
    this.scrollAnimationManager = new ScrollAnimationManager();
    
    // 폼 관리자 초기화
    this.formManager = new FormManager();
    
    // 성능 관리자 초기화
    this.performanceManager = new PerformanceManager();
  }

  setupEventListeners() {
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', () => {
      if (this.particleNetwork) {
        this.particleNetwork.destroy();
      }
    });

    // 비활성화 시 파티클 애니메이션 일시정지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.particleNetwork) {
        this.particleNetwork.destroy();
      } else if (!document.hidden && !this.particleNetwork.animationId) {
        this.particleNetwork.animate();
      }
    });

    // 터치 이벤트 최적화
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }
}

// 유틸리티 함수들
const utils = {
  // 디바운스 함수
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 스로틀 함수
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 랜덤 숫자 생성
  random: (min, max) => Math.random() * (max - min) + min,

  // 요소가 뷰포트에 있는지 확인
  isInViewport: (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// 전역 변수로 유틸리티 함수 사용 가능하게 함
window.utils = utils;

// 애플리케이션 시작
new App();
