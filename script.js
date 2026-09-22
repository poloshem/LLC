(function () {
  'use strict';

  var year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');
  var scrim = document.getElementById('navScrim');

  function closeMenu() {
    if (!nav || !scrim || !menuToggle) {
      return;
    }
    nav.classList.remove('open');
    scrim.classList.remove('show');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('li.has-dropdown.open').forEach(function (li) {
      li.classList.remove('open');
    });
  }

  if (menuToggle && nav && scrim) {
    menuToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      scrim.classList.toggle('show', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    scrim.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    document.querySelectorAll('li.has-dropdown > a.top-link').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (window.innerWidth <= 760) {
          event.preventDefault();
          var li = link.parentElement;
          var wasOpen = li.classList.contains('open');
          document.querySelectorAll('li.has-dropdown.open').forEach(function (item) {
            item.classList.remove('open');
          });
          if (!wasOpen) {
            li.classList.add('open');
          }
        }
      });
    });

    document.querySelectorAll('#primaryNav a').forEach(function (link) {
      link.addEventListener('click', function () {
        var isDropdownToggle = link.parentElement.classList.contains('has-dropdown');
        if (window.innerWidth <= 760 && !isDropdownToggle) {
          closeMenu();
        }
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) {
        closeMenu();
      }
    });
  }

  var searchToggle = document.getElementById('searchToggle');
  var searchPanel = document.getElementById('searchPanel');
  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', function () {
      var isOpen = searchPanel.classList.toggle('open');
      searchToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        searchPanel.querySelector('input').focus();
      }
    });

    var searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var query = this.querySelector('input').value.trim();
        if (query) {
          window.alert('Searching for: "' + query + '" — connect a search index to power live results.');
        }
      });
    }
  }

  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.textContent = 'Thank you! Your message has been received — we will respond soon.';
      status.classList.add('show', 'ok');
      form.reset();
    });
  }

  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 500);
    });
    toTop.addEventListener('click', function () {
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  function setActiveNavigation() {
    var currentPage = document.body.getAttribute('data-page');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav.primary > ul > li'));

    navLinks.forEach(function (li) {
      li.classList.remove('active');
      li.removeAttribute('aria-current');
    });

    if (currentPage && currentPage !== 'home') {
      navLinks.forEach(function (li) {
        if (li.getAttribute('data-page') === currentPage) {
          li.classList.add('active');
          li.setAttribute('aria-current', 'page');
        }
      });
      return;
    }

    var sections = ['home', 'about', 'beliefs', 'ministries', 'news', 'contact']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!sections.length) {
      return;
    }

    var position = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.offsetTop <= position) {
        current = section;
      }
    });

    navLinks.forEach(function (li) {
      var link = li.querySelector('a.top-link');
      if (link && link.getAttribute('href') === '#' + current.id) {
        li.classList.add('active');
        li.setAttribute('aria-current', 'page');
      }
    });
  }

  window.addEventListener('scroll', setActiveNavigation);
  setActiveNavigation();
}());
