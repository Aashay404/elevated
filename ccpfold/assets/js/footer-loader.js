// Footer loader function
function loadFooter() {
  fetch('footer.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('footer-placeholder').innerHTML = data;
      setupEnquiryModal();
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
}

function setupEnquiryModal() {
  var modal = document.getElementById('enquiryModal');
  if (!modal || modal.dataset.enquiryBound === 'true') return;

  modal.dataset.enquiryBound = 'true';

  window.openEnquiryModal = function () {
    var m = document.getElementById('enquiryModal');
    if (m) m.style.display = 'block';
  };

  window.closeEnquiryModal = function () {
    var m = document.getElementById('enquiryModal');
    if (m) m.style.display = 'none';
  };

  modal.addEventListener('click', function (e) {
    if (e.target === modal) window.closeEnquiryModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeEnquiryModal();
  });
}

// Load footer when DOM is ready
document.addEventListener('DOMContentLoaded', loadFooter);
