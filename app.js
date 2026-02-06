/**
 * Friendly Swarm — App Logic
 */
(function () {
  // State
  let linkedInConnected = false;
  const submissions = [
    { date: 'Feb 4, 2026', url: '#', likes: 12 },
    { date: 'Jan 28, 2026', url: '#', likes: 8 },
    { date: 'Jan 15, 2026', url: '#', likes: 23 }
  ];

  // Elements
  const pageLanding = document.getElementById('page-landing');
  const pageMain = document.getElementById('page-main');
  const btnGoogleSignin = document.getElementById('btn-google-signin');
  const btnLinkedinLogin = document.getElementById('btn-linkedin-login');
  const btnBoost = document.getElementById('btn-boost');
  const postUrlInput = document.getElementById('post-url-input');
  const swarmPreLogin = document.getElementById('swarm-pre-login');
  const swarmPostLogin = document.getElementById('swarm-post-login');
  const tabsContainer = document.getElementById('tabs-container');
  const submissionsList = document.getElementById('submissions-list');

  // Tab elements
  const tabContents = {
    swarm: document.getElementById('tab-swarm'),
    friends: document.getElementById('tab-friends')
  };

  // Google sign-in → switch to main page
  btnGoogleSignin.addEventListener('click', function () {
    pageLanding.classList.remove('active');
    setTimeout(function () {
      pageMain.classList.add('active');
    }, 200);
  });

  // Tab switching
  tabsContainer.addEventListener('click', function (e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    const tabName = tab.dataset.tab;
    switchTab(tabName);
  });

  function switchTab(tabName) {
    tabsContainer.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });

    Object.keys(tabContents).forEach(function (key) {
      if (tabContents[key]) {
        tabContents[key].classList.toggle('active', key === tabName);
      }
    });
  }

  // LinkedIn login
  btnLinkedinLogin.addEventListener('click', function () {
    linkedInConnected = true;

    // Hide pre-login, show post-login
    swarmPreLogin.classList.add('hidden');
    swarmPostLogin.classList.remove('hidden');

    // Render existing submissions
    renderSubmissions();
  });

  // Post URL input → enable/disable boost button
  postUrlInput.addEventListener('input', function () {
    btnBoost.disabled = postUrlInput.value.trim() === '';
  });

  // Boost button
  btnBoost.addEventListener('click', function () {
    var url = postUrlInput.value.trim();
    if (!url) return;

    var now = new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateStr = months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();

    submissions.unshift({
      date: dateStr,
      url: url,
      likes: 0
    });

    postUrlInput.value = '';
    btnBoost.disabled = true;

    renderSubmissions();
  });

  function renderSubmissions() {
    if (submissionsList) {
      submissionsList.innerHTML = renderSubmissionItems();
    }
  }

  function renderSubmissionItems() {
    if (submissions.length === 0) {
      return '<p class="empty-state">No posts submitted yet.</p>';
    }
    return submissions.map(function (s) {
      return '<div class="submission-item">' +
        '<a href="' + escapeHtml(s.url) + '" class="submission-date" target="_blank" rel="noopener">' + escapeHtml(s.date) + '</a>' +
        '<span class="submission-likes">' + s.likes + ' likes</span>' +
        '</div>';
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
