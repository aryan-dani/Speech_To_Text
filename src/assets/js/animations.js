// Professional Animation Effects for HIScribe Medical Transcription Application
// This script adds subtle, professional visual enhancements without disrupting functionality

document.addEventListener('DOMContentLoaded', function() {
  // Initialize animations once DOM is fully loaded
  setTimeout(initializeProfessionalAnimations, 800);
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
            animation: subtle-ripple 0.6s linear;
            pointer-events: none;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
          }
          
          @keyframes subtle-ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
          
          button {
            overflow: hidden;
            position: relative;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
        `;
        document.head.appendChild(style);
      }
    });
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
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .card.has-pro-effect:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
    const recordButton = document.querySelector('.record-button');
    if (!recordButton) return;
    
    // Create professional pulse animation for record button
    if (!document.getElementById('microphone-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'microphone-animation-styles';
      style.textContent = `
        .record-button.recording::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          animation: professional-pulse 2s infinite;
          z-index: -1;
          background: rgba(239, 71, 111, 0.6);
          opacity: 0.4;
        }
        
        @keyframes professional-pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
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
        audioBars.forEach(bar => {
          if (bar.classList.contains('active')) {
            // Add subtle shadow to active audio bars
            bar.style.boxShadow = '0 0 5px rgba(67, 97, 238, 0.3)';
          }
        });
      }
    }, 500);
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
          transition: all 0.3s ease;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15) !important;
        }
        
        .mobile-menu-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
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
        select:focus {
          outline: 3px solid rgba(67, 97, 238, 0.3);
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }, 1000);
}