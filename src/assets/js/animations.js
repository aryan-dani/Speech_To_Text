// Professional Animation Effects for HIScribe Medical Transcription Application
// This script adds subtle, professional visual enhancements without disrupting functionality

document.addEventListener('DOMContentLoaded', function() {
  // Initialize animations once DOM is fully loaded
  setTimeout(initializeProfessionalAnimations, 800);
  
  // Make AI response container visible after loading
  const showAIResponseContainer = () => {
    const containers = document.querySelectorAll('.ai-response-container');
    containers.forEach(container => {
      setTimeout(() => {
        container.classList.add('visible');
      }, 100);
    });
  };

  // Make summary sections visible when they appear
  const showSummarySection = () => {
    const sections = document.querySelectorAll('.summary-section');
    sections.forEach(section => {
      setTimeout(() => {
        section.classList.add('visible');
      }, 300);
    });
  };

  // Apply animation to medical cards
  const setupMedicalCards = () => {
    const cards = document.querySelectorAll('.medical-card');
    cards.forEach((card, index) => {
      card.style.setProperty('--card-index', index);
    });
  };

  // Apply animation to medical data items
  const setupMedicalDataItems = () => {
    const items = document.querySelectorAll('.medical-data-item');
    items.forEach((item, index) => {
      item.style.setProperty('--item-index', index);
    });
  };

  // Mutation observer to watch for new elements
  const observeDOM = () => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          // Check for AI container
          if (document.querySelector('.ai-response-container')) {
            showAIResponseContainer();
          }
          
          // Check for summary section
          if (document.querySelector('.summary-section')) {
            showSummarySection();
          }
          
          // Setup medical cards and data items if present
          setupMedicalCards();
          setupMedicalDataItems();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  // Smooth scroll to element
  window.smoothScrollTo = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
      
      // Add a highlight effect
      element.classList.add('focus-highlight');
      setTimeout(() => {
        element.classList.remove('focus-highlight');
      }, 2000);
    }
  };

  // Apply the "New" badge to Ask AI buttons for first-time users
  const showNewAIFeatureBadge = () => {
    // Check if user has seen the feature before
    if (!localStorage.getItem('seenAIFeature')) {
      document.body.classList.add('feature-new-ai');
      
      // After 5 days, remove the badge
      setTimeout(() => {
        localStorage.setItem('seenAIFeature', 'true');
        document.body.classList.remove('feature-new-ai');
      }, 5 * 24 * 60 * 60 * 1000);
    }
  };

  // Initialize everything
  showAIResponseContainer();
  showSummarySection();
  setupMedicalCards();
  setupMedicalDataItems();
  observeDOM();
  showNewAIFeatureBadge();
});

function initializeProfessionalAnimations() {
  // Add subtle button effects
  addSubtleButtonEffects();
  
  // Add gentle hover effects to cards
  addProfessionalCardEffects();
  
  // Create professional microphone animation for recording
  createProfessionalMicAnimation();
  
  // Enhance hamburger menu visibility
  enhanceProfessionalHamburgerMenu();
  
  // Add focus indicators for accessibility
  enhanceAccessibility();
  
  // Add new smooth page transitions
  addSmoothPageTransitions();
  
  // Add subtle text animations for important messages
  addTextAnimations();
  
  // Add refined form element interactions
  enhanceFormElements();
  
  // Add keyboard accessibility enhancements
  addKeyboardAccessibility();
  
  // Independent Ask AI button functionality
  enhanceAskAIButton();
}

// Add subtle button effects
function addSubtleButtonEffects() {
  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
      // Skip if button already has effects or is disabled
      if (button.classList.contains('has-effect') || button.disabled) return;
      
      // Add effect class
      button.classList.add('has-effect');
      
      // Create subtle ripple effect on click
      button.addEventListener('click', function(e) {
        if (button.disabled) return;
        
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
      
      // Add CSS for subtle ripple effect if not already present
      if (!document.getElementById('button-effect-styles')) {
        const style = document.createElement('style');
        style.id = 'button-effect-styles';
        style.textContent = `
          .ripple-effect {
            position: absolute;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            transform: scale(0);
            animation: subtle-ripple 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
            pointer-events: none;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
          }
          
          @keyframes subtle-ripple {
            to {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          
          button {
            overflow: hidden;
            position: relative;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          
          button:active {
            transform: translateY(1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.1s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.1s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
        `;
        document.head.appendChild(style);
      }
    });
    
    // Add improved button styles for better accessibility and visual feedback
    if (!document.getElementById('improved-button-styles')) {
      const style = document.createElement('style');
      style.id = 'improved-button-styles';
      style.textContent = `
        button:focus-visible {
          outline: 3px solid rgba(67, 97, 238, 0.5);
          outline-offset: 2px;
          position: relative;
          z-index: 1;
        }
        
        button:active {
          transform: translateY(1px);
        }
        
        /* Enhance button states */
        button.primary-action {
          background-image: linear-gradient(135deg, #4361ee, #3a0ca3);
          box-shadow: 0 4px 10px rgba(67, 97, 238, 0.3);
        }
        
        button.primary-action:hover {
          background-image: linear-gradient(135deg, #3a56e5, #3008a0);
          box-shadow: 0 6px 15px rgba(67, 97, 238, 0.4);
        }
        
        /* Button loading state */
        button.loading {
          position: relative;
          color: transparent !important;
          pointer-events: none;
        }
        
        button.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, 1000);
}

// Add gentle hover effects to cards for professional appearance
function addProfessionalCardEffects() {
  setTimeout(() => {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      // Skip if card already has effects
      if (card.classList.contains('has-pro-effect')) return;
      
      // Add effect class
      card.classList.add('has-pro-effect');
      
      // Add subtle shadow increase on hover
      if (!document.getElementById('card-effect-styles')) {
        const style = document.createElement('style');
        style.id = 'card-effect-styles';
        style.textContent = `
          .card.has-pro-effect {
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                        box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            will-change: transform, box-shadow;
          }
          
          .card.has-pro-effect:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          }
          
          .card.has-pro-effect::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: inherit;
            box-shadow: 0 0 0 2px rgba(67, 97, 238, 0);
            transition: box-shadow 0.4s ease;
            pointer-events: none;
          }
          
          .card.has-pro-effect:hover::after {
            box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
          }
        `;
        document.head.appendChild(style);
      }
    });
  }, 1000);
}

// Create professional microphone animation for medical recording
function createProfessionalMicAnimation() {
  setTimeout(() => {
    // Create audio visualizer bars
    const audioVisualizerElements = document.querySelectorAll('.audio-visualizer');
    
    audioVisualizerElements.forEach(visualizer => {
      // Skip if already has bars
      if (visualizer.querySelector('.audio-bar')) return;
      
      // Create bars
      const bars = 24; // Even number looks better
      for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.classList.add('audio-bar');
        visualizer.appendChild(bar);
      }
    });
    
    // Add animation styles if not present
    if (!document.getElementById('mic-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'mic-animation-styles';
      style.textContent = `
        .audio-visualizer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 60px;
          padding: 10px;
          overflow: hidden;
          background: linear-gradient(to right, rgba(67, 97, 238, 0.03), rgba(67, 97, 238, 0.07), rgba(67, 97, 238, 0.03));
          border-radius: 12px;
          transition: background 0.3s ease;
        }
        
        .audio-visualizer:hover {
          background: linear-gradient(to right, rgba(67, 97, 238, 0.05), rgba(67, 97, 238, 0.1), rgba(67, 97, 238, 0.05));
        }
        
        .audio-bar {
          width: 3px;
          height: 20%;
          background-color: var(--primary-color, #4361ee);
          border-radius: 6px;
          transition: height 0.2s ease, background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
          will-change: height, opacity;
          opacity: 0.5;
        }
        
        .audio-bar.active {
          height: var(--height, 70%);
          opacity: 0.9;
          background-color: var(--active-color, #4361ee);
          animation: gentle-pulse 1s infinite alternate ease-in-out;
        }
        
        @keyframes gentle-pulse {
          0% {
            transform: scaleY(0.95);
            opacity: 0.8;
          }
          100% {
            transform: scaleY(1);
            opacity: 0.4;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Enhance audio visualization with subtle effects
    setInterval(() => {
      const audioBars = document.querySelectorAll('.audio-bar');
      if (audioBars.length > 0 && document.querySelector('.record-button.recording')) {
        audioBars.forEach((bar, index) => {
          // Create realistic audio visualization pattern
          const isActive = Math.random() > 0.5;
          if (isActive) {
            const height = Math.max(20, Math.floor(Math.random() * 80));
            bar.style.setProperty('--height', `${height}%`);
            
            // Different hues for better visual experience
            const hueShift = index % 3 === 0 ? 10 : (index % 3 === 1 ? -10 : 0);
            bar.style.setProperty('--active-color', `hsl(${230 + hueShift}, 85%, 60%)`);
            
            bar.classList.add('active');
            // Add subtle shadow to active audio bars
            bar.style.boxShadow = '0 0 8px rgba(67, 97, 238, 0.3)';
          } else {
            bar.classList.remove('active');
            bar.style.boxShadow = 'none';
          }
        });
      }
    }, 150);
  }, 1000);
}

// Enhance hamburger menu for better visibility
function enhanceProfessionalHamburgerMenu() {
  setTimeout(() => {
    const hamburger = document.querySelector('.mobile-menu-toggle');
    if (!hamburger) return;
    
    // Add subtle animation to hamburger icon
    if (!document.getElementById('hamburger-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'hamburger-animation-styles';
      style.textContent = `
        .mobile-menu-toggle {
          position: fixed !important;
          display: flex !important;
          z-index: 1001 !important;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          overflow: hidden;
        }
        
        .mobile-menu-toggle:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
        }
        
        .mobile-menu-toggle::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .mobile-menu-toggle:hover::after {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Ensure hamburger is visible
    hamburger.style.display = 'flex';
    hamburger.style.opacity = '1';
    
    // Add subtle transform to menu icon on sidebar open/close
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'class') {
            if (sidebar.classList.contains('active')) {
              hamburger.style.transform = 'translateY(0) rotate(180deg)';
            } else {
              hamburger.style.transform = 'translateY(0) rotate(0deg)';
            }
          }
        });
      });
      
      observer.observe(sidebar, { attributes: true });
    }
  }, 1000);
}

// Add focus indicators to improve accessibility - important for healthcare applications
function enhanceAccessibility() {
  setTimeout(() => {
    if (!document.getElementById('accessibility-styles')) {
      const style = document.createElement('style');
      style.id = 'accessibility-styles';
      style.textContent = `
        button:focus, 
        input:focus, 
        textarea:focus, 
        select:focus,
        a:focus {
          outline: 3px solid rgba(67, 97, 238, 0.4);
          outline-offset: 2px;
          transition: outline-color 0.2s ease;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, 1000);
}

// Add subtle text animations for important elements
function addTextAnimations() {
  setTimeout(() => {
    // Apply to section headers, status messages, etc.
    const importantText = document.querySelectorAll('.section-title, .status-text, .ai-response-title');
    
    importantText.forEach(element => {
      if (element.classList.contains('has-text-animation')) return;
      element.classList.add('has-text-animation');
    });
    
    if (!document.getElementById('text-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'text-animation-styles';
      style.textContent = `
        .has-text-animation {
          animation: textFadeIn 0.7s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .section-title::after {
          animation: expandWidth 0.7s 0.3s ease forwards;
          transform-origin: left;
          transform: scaleX(0);
        }
        
        @keyframes expandWidth {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }, 1200);
}

// Add smooth page transitions
function addSmoothPageTransitions() {
  setTimeout(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !mainContent.classList.contains('has-transition')) {
      mainContent.classList.add('has-transition', 'fade-in');
      
      if (!document.getElementById('page-transition-styles')) {
        const style = document.createElement('style');
        style.id = 'page-transition-styles';
        style.textContent = `
          .main-content.has-transition {
            animation: fadeInContent 0.6s ease-out forwards;
          }
          
          @keyframes fadeInContent {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .card, .transcription-container, .medical-card {
            animation: staggerIn 0.6s ease-out backwards;
          }
          
          @keyframes staggerIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add staggered animations to cards and containers
      const elements = document.querySelectorAll('.card, .transcription-container, .medical-card');
      elements.forEach((el, index) => {
        el.style.animationDelay = `${0.1 + (index * 0.05)}s`;
      });
    }
  }, 200);
}

// Enhance form elements with subtle animations
function enhanceFormElements() {
  setTimeout(() => {
    const formInputs = document.querySelectorAll('input, textarea, select');
    
    formInputs.forEach(input => {
      if (input.classList.contains('has-input-effect')) return;
      input.classList.add('has-input-effect');
      
      // Add focus/blur event listeners
      input.addEventListener('focus', function() {
        this.parentElement?.classList.add('input-focused');
      });
      
      input.addEventListener('blur', function() {
        this.parentElement?.classList.remove('input-focused');
      });
    });
    
    if (!document.getElementById('form-element-styles')) {
      const style = document.createElement('style');
      style.id = 'form-element-styles';
      style.textContent = `
        .form-group {
          position: relative;
          overflow: hidden;
        }
        
        .input-focused::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary-color, #4361ee);
          transform: scaleX(1);
          transform-origin: left;
          animation: inputFocus 0.3s ease forwards;
        }
        
        @keyframes inputFocus {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        .has-input-effect {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .has-input-effect:focus {
          border-color: var(--primary-color, #4361ee);
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
        }
      `;
      document.head.appendChild(style);
    }
  }, 1000);
}

// Add keyboard accessibility for better user experience
function addKeyboardAccessibility() {
  setTimeout(() => {
    console.log('Setting up keyboard accessibility...');
    
    // Enhance all focusable elements
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableNodes = document.querySelectorAll(focusableElements);
    
    // Add a class for debugging
    focusableNodes.forEach(node => {
      node.classList.add('keyboard-accessible');
    });
    
    // Add Enter key support for clickable elements more aggressively
    document.querySelectorAll('button, .sidebar-nav li, .collapsible-header, .card, .sample-item, [role="button"]').forEach(element => {
      if (element.classList.contains('keyboard-enhanced')) return;
      element.classList.add('keyboard-enhanced');
      
      // Force tabindex if not already set
      if (!element.hasAttribute('tabindex') && element.tagName.toLowerCase() !== 'button') {
        element.setAttribute('tabindex', '0');
      }
      
      // Direct event listener for Enter key
      element.addEventListener('keydown', function(e) {
        // Log to debug
        console.log('Key pressed on element:', e.key, element);
        
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('Enter key pressed on:', element);
          
          // Explicit click for consistent handling
          element.click();
          
          // Also trigger a direct click event in case usual click is being prevented
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          element.dispatchEvent(clickEvent);
        }
      });
    });
    
    // Add global keyboard shortcut handler
    document.addEventListener('keydown', function(e) {
      console.log('Global keydown:', e.key);
      
      // Escape key to close menus and modals
      if (e.key === 'Escape') {
        console.log('Escape key detected globally');
        
        // Close sidebar on mobile
        const sidebar = document.querySelector('.sidebar.active');
        if (sidebar && window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          const overlay = document.querySelector('.sidebar-overlay.active');
          if (overlay) overlay.classList.remove('active');
        }
        
        // Close any active modal or overlay
        const activeModal = document.querySelector('.loading-overlay.active');
        if (activeModal) {
          activeModal.classList.remove('active');
        }
        
        // Close any visible toast manually
        const visibleToasts = document.querySelectorAll('.toast');
        visibleToasts.forEach(toast => {
          toast.style.opacity = '0';
          setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          }, 300);
        });
      }
    });
    
    // Add arrow key navigation to sidebar with stronger implementation
    const navItems = document.querySelectorAll('.sidebar-nav li');
    navItems.forEach((item, index) => {
      item.addEventListener('keydown', function(e) {
        // Arrow down - move to next item
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextItem = navItems[index + 1] || navItems[0];
          nextItem.focus();
        }
        
        // Arrow up - move to previous item
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevItem = navItems[index - 1] || navItems[navItems.length - 1];
          prevItem.focus();
        }
      });
    });
    
    // Add visual feedback for keyboard focus
    document.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
      el.addEventListener('focus', () => {
        el.classList.add('keyboard-focus-visible');
      });
      
      el.addEventListener('blur', () => {
        el.classList.remove('keyboard-focus-visible');
      });
    });
    
    console.log('Keyboard accessibility setup complete.');
  }, 1000); // Use shorter timeout for faster initialization
}

// Make Ask AI button work independently of the summary - with improved functionality
function enhanceAskAIButton() {
  setTimeout(() => {
    console.log('Enhancing Ask AI button...');
    const askAIButton = document.querySelector('.ask-ai-button');
    if (!askAIButton || askAIButton.classList.contains('enhanced-ai-button')) return;
    
    askAIButton.classList.add('enhanced-ai-button');
    
    // Remove any disabled attributes or listeners that might restrict usage
    askAIButton.removeAttribute('disabled');
    
    // Additional attributes for accessibility
    askAIButton.setAttribute('role', 'button');
    askAIButton.setAttribute('aria-label', 'Ask AI assistant for help');
    
    // Make sure it's focusable
    if (!askAIButton.hasAttribute('tabindex')) {
      askAIButton.setAttribute('tabindex', '0');
    }
    
    // Add even stronger click handler with capture
    const clickHandler = function(e) {
      // Visual feedback when clicked
      this.classList.add('ai-button-clicked');
      setTimeout(() => {
        this.classList.remove('ai-button-clicked');
      }, 300);
      
      console.log('Ask AI button clicked via enhanced handler');
    };
    
    askAIButton.addEventListener('click', clickHandler, true);
    
    // Also handle keyboard Enter 
    askAIButton.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.click();
        console.log('Ask AI button activated via keyboard');
      }
    }, true);
    
    // Add hover tooltip with improved styling
    if (!document.getElementById('ask-ai-tooltip-style')) {
      const tooltipStyle = document.createElement('style');
      tooltipStyle.id = 'ask-ai-tooltip-style';
      tooltipStyle.textContent = `
        .enhanced-ai-button {
          position: relative;
          z-index: 5;
        }
        
        .enhanced-ai-button::after {
          content: 'Ask AI for assistance';
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(33, 37, 41, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          pointer-events: none;
          z-index: 10;
        }
        
        .enhanced-ai-button:hover::after,
        .enhanced-ai-button:focus::after {
          opacity: 1;
          visibility: visible;
        }
        
        .ai-button-clicked {
          animation: ai-button-pulse 0.3s ease;
        }
        
        @keyframes ai-button-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(tooltipStyle);
    }
    
    console.log('Ask AI button enhancement complete.');
  }, 1000);
}