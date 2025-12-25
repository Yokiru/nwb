// ================================
// NWB.CREATIVE - Main JavaScript (Framer Style)
// ================================

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initMobileNav();
    initSmoothScroll();
});

// Premium Scroll Reveal Animations (Intersection Observer)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Only animate once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // Observe elements with data-animate-children attribute
    document.querySelectorAll('[data-animate-children]').forEach(el => {
        observer.observe(el);
    });

    // Legacy: Also observe .reveal elements
    document.querySelectorAll('.reveal').forEach(el => {
        const legacyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    legacyObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        legacyObserver.observe(el);
    });
}

// Mobile Navigation Toggle
function initMobileNav() {
    const toggle = document.querySelector('.mobile-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');

            // Animate menu items
            if (menu.classList.contains('active')) {
                menu.querySelectorAll('.nav-link').forEach((link, index) => {
                    link.style.opacity = '0';
                    link.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        link.style.transition = 'all 0.3s ease';
                        link.style.opacity = '1';
                        link.style.transform = 'translateY(0)';
                    }, 100 + (index * 50));
                });
            }
        });
    }
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const toggle = document.querySelector('.mobile-toggle');
                const menu = document.querySelector('.nav-menu');
                if (menu && menu.classList.contains('active')) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                }
            }
        });
    });
}
