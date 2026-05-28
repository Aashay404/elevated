// Header loader function
function loadHeader() {
  fetch('header.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('header-placeholder').innerHTML = data;
      // Wait a bit for DOM to update
      setTimeout(initMobileToggle, 100);
    })
    .catch(error => {
      console.error('Error loading header:', error);
    });
}

// Initialize mobile toggle functionality
function initMobileToggle() {
  const toggler = document.querySelector('.navbar-toggler');
  const navCollapse = document.querySelector('#mainNavigation');
  const closeMobileMenu = document.querySelector('.close-mobile-menu');
  
  console.log('Toggle elements found:', { toggler, navCollapse, closeMobileMenu });
  
  if (toggler && navCollapse) {
    toggler.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Toggle clicked');
      
      if (navCollapse.classList.contains('show')) {
        navCollapse.classList.remove('show');
        toggler.setAttribute('aria-expanded', 'false');
      } else {
        navCollapse.classList.add('show');
        toggler.setAttribute('aria-expanded', 'true');
      }
    });
  }
  
  if (closeMobileMenu) {
    closeMobileMenu.addEventListener('click', function() {
      navCollapse.classList.remove('show');
      toggler.setAttribute('aria-expanded', 'false');
    });
  }
}

// Load header when DOM is ready
document.addEventListener('DOMContentLoaded', loadHeader);