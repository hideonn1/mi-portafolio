document.addEventListener('DOMContentLoaded', () => {
    // Simple intersection observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Hero Text Animation
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const wrapLetters = (element) => {
            const nodes = Array.from(element.childNodes);
            nodes.forEach(node => {
                if (node.nodeType === 3) { // Text node
                    const text = node.textContent;
                    if (!text.match(/\S/)) return; // Skip empty/whitespace functionality if needed, but here preserving structure

                    const fragment = document.createDocumentFragment();
                    text.split('').forEach(char => {
                        if (char.trim() === '') {
                            // Preserve spaces
                            const space = document.createElement('span');
                            space.innerHTML = '&nbsp;';
                            fragment.appendChild(space);
                        } else {
                            const span = document.createElement('span');
                            span.textContent = char;
                            span.className = 'letter-wrapper';
                            fragment.appendChild(span);
                        }
                    });
                    node.replaceWith(fragment);
                } else if (node.nodeType === 1 && node.tagName !== 'BR') {
                    wrapLetters(node);
                }
            });
        };

        wrapLetters(heroTitle);

        // Add staggered delays
        const letters = heroTitle.querySelectorAll('.letter-wrapper');
        letters.forEach((letter, index) => {
            letter.style.setProperty('--char-index', index);
        });

        // Sync Google Colors animation and the final period
        const googleAnimSpan = heroTitle.querySelector('.google-anim');
        if (googleAnimSpan) {
            const codigoLetters = googleAnimSpan.querySelectorAll('.letter-wrapper');
            if (codigoLetters.length > 0) {
                const lastCodigoLetter = codigoLetters[codigoLetters.length - 1];
                const allLettersArray = Array.from(letters);
                const lastIndex = allLettersArray.indexOf(lastCodigoLetter);

                // Calculate when the fade-in finishes for the last letter of "código"
                // Delay = index * 0.04s + duration 0.8s
                // We want the color animation to start immediately after
                const colorAnimationStartDelay = (lastIndex * 0.04) + 0.8;

                // keyframes delay for googleColors
                googleAnimSpan.style.setProperty('--color-anim-delay', `${colorAnimationStartDelay}s`);

                // Find the period (assuming it's the last character)
                const lastLetterOfTitle = letters[letters.length - 1];
                if (lastLetterOfTitle.textContent.trim() === '.') {
                    // Start the fade-in of the dot at the same time as the color animation
                    // We need to override the char-index delay
                    lastLetterOfTitle.style.animationDelay = `${colorAnimationStartDelay}s`;
                }
            }
        }
    }

    // Terminal Text Animation

    // Terminal Text Animation
    const terminalTexts = document.querySelectorAll('.terminal-text');

    if (terminalTexts.length > 0) {
        const terminalObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    // Check if already animated to prevent re-animation
                    if (element.classList.contains('typing-started')) return;
                    element.classList.add('typing-started');

                    const text = element.getAttribute('data-text') || element.textContent;
                    element.textContent = ''; // Clear content

                    // Ensure height
                    element.style.minHeight = '1.6em';

                    let i = 0;
                    const speed = 50;

                    const typeWriter = () => {
                        if (i < text.length) {
                            element.textContent += text.charAt(i);
                            i++;
                            setTimeout(typeWriter, speed);
                        } else {
                            // Animation finished
                            setTimeout(() => {
                                element.classList.add('cursor-hidden');
                            }, 3000); // Wait 3s before hiding cursor
                        }
                    };

                    typeWriter();
                    terminalObserver.unobserve(element);
                }
            });
        }, { threshold: 0.5 }); // Start when 50% visible

        terminalTexts.forEach(el => {
            // Store text in data attribute to preserve it
            el.setAttribute('data-text', el.textContent.trim());
            el.textContent = ''; // Clear initially
            terminalObserver.observe(el);
        });
    }

    // Contact Form AJAX
    const contactForm = document.querySelector('.contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // Email Validation
            const email = data.email.toLowerCase();
            const blockedUsernames = ['admin', 'test', 'user', 'usuario', 'root', 'info', 'contact', 'null', 'undefined'];
            const blockedDomains = ['example.com', 'test.com', 'admin.cl'];

            const [username, domain] = email.split('@');

            if (blockedUsernames.includes(username) || blockedDomains.includes(domain)) {
                formStatus.textContent = 'Por favor, introduce un correo electrónico válido.';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                setTimeout(() => {
                    formStatus.style.display = 'none';
                    formStatus.className = 'form-status';
                }, 5000);
                return;
            }

            // Disable button
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    formStatus.textContent = '¡Mensaje enviado con éxito! Te responderé pronto.';
                    formStatus.className = 'form-status success';
                    contactForm.reset();
                } else {
                    const errorData = await response.json();

                    if (Object.hasOwn(errorData, 'errors')) {
                        formStatus.textContent = errorData["errors"].map(error => error["message"]).join(", ");
                    } else if (Object.hasOwn(errorData, 'error')) {
                        formStatus.textContent = errorData.error;
                    } else {
                        formStatus.textContent = 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.';
                    }
                    formStatus.className = 'form-status error';
                }
            } catch (error) {
                formStatus.textContent = 'Hubo un error de conexión. Inténtalo de nuevo más tarde.';
                formStatus.className = 'form-status error';
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;

                // Hide status after 5 seconds
                setTimeout(() => {
                    formStatus.style.display = 'none';
                    formStatus.className = 'form-status';
                }, 5000);
            }
        });
    }

    // Smooth Scroll for Anchor Links (Custom Animation)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty links
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            // Temporarily disable scroll snap to prevent conflict
            document.documentElement.style.scrollSnapType = 'none';

            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const startPosition = window.scrollY;
            const distance = targetPosition - startPosition;
            const duration = 1000; // Duration in ms
            let start = null;

            function step(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                // Ease In Out Cubic
                const ease = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

                const currentScroll = startPosition + distance * ease(Math.min(progress / duration, 1));

                window.scrollTo(0, currentScroll);

                if (progress < duration) {
                    window.requestAnimationFrame(step);
                } else {
                    // Re-enable scroll snap after animation
                    // Small timeout to ensure browser doesn't snap back immediately
                    setTimeout(() => {
                        document.documentElement.style.scrollSnapType = '';
                    }, 50);
                }
            }

            window.requestAnimationFrame(step);
        });
    });
});
