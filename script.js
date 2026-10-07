(function () {
  'use strict';

  var year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primaryNav');
  var scrim = document.getElementById('navScrim');
  var mobileNavQuery = window.matchMedia ? window.matchMedia('(max-width: 1285px)') : null;

  function isMobileNavigation() {
    return !mobileNavQuery || mobileNavQuery.matches;
  }

  function closeDropdowns(except) {
    document.querySelectorAll('li.has-dropdown.open').forEach(function (li) {
      if (li === except) {
        return;
      }
      li.classList.remove('open');
      var link = li.querySelector(':scope > a.top-link');
      if (link) {
        link.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function syncNavigationState() {
    if (!nav) {
      return;
    }
    var isHidden = isMobileNavigation() && !nav.classList.contains('open');
    nav.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
  }

  function closeMenu(restoreFocus) {
    if (!nav || !scrim || !menuToggle) {
      return;
    }

    var wasOpen = nav.classList.contains('open');
    nav.classList.remove('open');
    nav.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('show');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    closeDropdowns();
    syncNavigationState();

    if (restoreFocus && wasOpen) {
      menuToggle.focus();
    }
  }

  function openMenu() {
    if (!nav || !scrim || !menuToggle) {
      return;
    }

    nav.classList.add('open');
    nav.setAttribute('aria-hidden', 'false');
    scrim.classList.add('show');
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    syncNavigationState();

    var firstLink = nav.querySelector('a[href], button');
    if (firstLink) {
      firstLink.focus();
    }
  }

  if (menuToggle && nav && scrim) {
    menuToggle.setAttribute('aria-label', 'Open menu');
    syncNavigationState();
    nav.setAttribute('aria-hidden', isMobileNavigation() ? 'true' : 'false');

    menuToggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    scrim.addEventListener('click', function () {
      closeMenu(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu(true);
      }
    });

    document.addEventListener('click', function (event) {
      if (!isMobileNavigation() || !nav.classList.contains('open')) {
        return;
      }
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMenu(false);
      }
    });

    document.querySelectorAll('li.has-dropdown > a.top-link').forEach(function (link) {
      link.setAttribute('aria-expanded', isMobileNavigation() ? 'true' : 'false');
    });

    document.querySelectorAll('#primaryNav a').forEach(function (link) {
      link.addEventListener('click', function () {
        var isDropdownToggle = link.parentElement.classList.contains('has-dropdown');
        if (isMobileNavigation() && !isDropdownToggle) {
          closeMenu(false);
        }
      });
    });

    var handleNavigationResize = function () {
      if (!isMobileNavigation()) {
        closeMenu(false);
      }
      document.querySelectorAll('li.has-dropdown > a.top-link').forEach(function (link) {
        link.setAttribute('aria-expanded', isMobileNavigation() ? 'true' : 'false');
      });
      syncNavigationState();
    };
    if (mobileNavQuery && mobileNavQuery.addEventListener) {
      mobileNavQuery.addEventListener('change', handleNavigationResize);
    } else {
      window.addEventListener('resize', handleNavigationResize);
    }
  }

  var searchToggle = document.getElementById('searchToggle');
  var searchPanel = document.getElementById('searchPanel');
  var searchForm = document.getElementById('searchForm');
  var searchInput = document.getElementById('siteSearch');
  var searchResults = document.getElementById('searchResults');
  var searchStatus = document.getElementById('searchStatus');
  var searchPages = [
    { url: 'index.html', fallbackTitle: 'Home' },
    { url: 'about.html', fallbackTitle: 'About Us' },
    { url: 'history.html', fallbackTitle: 'Our History' },
    { url: 'beliefs.html', fallbackTitle: 'Our Beliefs' },
    { url: 'ministries.html', fallbackTitle: 'Ministries' },
    { url: 'news.html', fallbackTitle: 'News & Events' },
    { url: 'gallery.html', fallbackTitle: 'Gallery' },
    { url: 'contact.html', fallbackTitle: 'Contact Us' },
    { url: 'privacy.html', fallbackTitle: 'Privacy Policy' }
  ];
  var searchIndexPromise = null;
  var searchRequest = 0;
  var searchTimer = null;

  function cleanSearchText(value) {
    return String(value || '').replace(/[\u00A0\s]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizeSearchText(value) {
    return cleanSearchText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseSearchPage(page, html) {
    var documentNode = new DOMParser().parseFromString(html, 'text/html');
    var titleNode = documentNode.querySelector('title');
    var descriptionNode = documentNode.querySelector('meta[name="description"]');
    var main = documentNode.querySelector('main');
    var title = titleNode ? cleanSearchText(titleNode.textContent) : page.fallbackTitle;
    var description = descriptionNode ? cleanSearchText(descriptionNode.getAttribute('content')) : '';
    var blocks = [];

    title = title.replace(/\s*(?:—|-)\s*Lord's Last Call Church\s*$/i, '').trim() || page.fallbackTitle;

    if (main) {
      Array.prototype.forEach.call(main.querySelectorAll('h1,h2,h3,h4,p,li,figcaption'), function (node) {
        var text = cleanSearchText(node.textContent);
        var anchor = '';
        var anchorNode = node;

        if (!text) {
          return;
        }

        while (anchorNode && anchorNode !== main) {
          if (anchorNode.id) {
            anchor = anchorNode.id;
            break;
          }
          anchorNode = anchorNode.parentElement;
        }

        blocks.push({ text: text, anchor: anchor });
      });
    }

    if (!blocks.length && description) {
      blocks.push({ text: description, anchor: '' });
    }

    return {
      url: page.url,
      title: title,
      description: description,
      blocks: blocks
    };
  }

  function loadSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = Promise.all(searchPages.map(function (page) {
        return fetch(page.url, { credentials: 'same-origin' })
          .then(function (response) {
            if (!response.ok) {
              throw new Error('Unable to load ' + page.url);
            }
            return response.text();
          })
          .then(function (html) {
            return parseSearchPage(page, html);
          })
          .catch(function () {
            return {
              url: page.url,
              title: page.fallbackTitle,
              description: '',
              blocks: [{ text: page.fallbackTitle, anchor: '' }]
            };
          });
      }));
    }

    return searchIndexPromise;
  }

  function makeSearchSnippet(text, query) {
    var lowerText = text.toLowerCase();
    var lowerQuery = query.toLowerCase();
    var index = lowerText.indexOf(lowerQuery);
    var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

    if (index < 0) {
      tokens.some(function (token) {
        index = lowerText.indexOf(token);
        return index >= 0;
      });
    }

    if (index < 0) {
      return cleanSearchText(text.slice(0, 140)) + (text.length > 140 ? '…' : '');
    }

    var start = Math.max(0, index - 55);
    var end = Math.min(text.length, index + lowerQuery.length + 95);
    return (start > 0 ? '…' : '') + cleanSearchText(text.slice(start, end)) + (end < text.length ? '…' : '');
  }

  function findSearchMatches(index, query) {
    var normalizedQuery = normalizeSearchText(query);
    var queryTokens = normalizedQuery.split(' ').filter(Boolean);

    if (!normalizedQuery) {
      return [];
    }

    return index.map(function (entry) {
      var normalizedTitle = normalizeSearchText(entry.title);
      var normalizedDescription = normalizeSearchText(entry.description);
      var score = 0;
      var bestBlock = null;
      var bestBlockScore = 0;

      if (normalizedTitle === normalizedQuery) {
        score += 60;
      } else if (normalizedTitle.indexOf(normalizedQuery) >= 0) {
        score += 30;
      }

      if (normalizedDescription.indexOf(normalizedQuery) >= 0) {
        score += 15;
      }

      entry.blocks.forEach(function (block) {
        var normalizedBlock = normalizeSearchText(block.text);
        var blockScore = 0;

        if (normalizedBlock.indexOf(normalizedQuery) >= 0) {
          blockScore += 20;
        }

        queryTokens.forEach(function (token) {
          if (normalizedBlock.indexOf(token) >= 0) {
            blockScore += 5;
          }
          if (normalizedBlock.indexOf(token) === 0) {
            blockScore += 2;
          }
        });

        if (blockScore > bestBlockScore) {
          bestBlockScore = blockScore;
          bestBlock = block;
        }

        score += blockScore;
      });

      if (score <= 0) {
        return null;
      }

      return {
        entry: entry,
        score: score,
        block: bestBlock || { text: entry.description || entry.title, anchor: '' }
      };
    }).filter(Boolean).sort(function (first, second) {
      return second.score - first.score;
    }).slice(0, 6);
  }

  function renderSearchResults(query, matches) {
    var fragment = document.createDocumentFragment();

    searchResults.textContent = '';

    if (!matches.length) {
      searchStatus.textContent = 'No pages found for "' + query + '".';
      return;
    }

    matches.forEach(function (match) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      var title = document.createElement('span');
      var snippet = document.createElement('span');
      var href = match.entry.url;

      item.className = 'search-result';
      link.className = 'search-result-link';
      title.className = 'search-result-title';
      snippet.className = 'search-result-snippet';

      if (match.block.anchor) {
        href += '#' + match.block.anchor;
      }

      link.href = href;
      title.textContent = match.entry.title;
      snippet.textContent = makeSearchSnippet(match.block.text, query);

      link.appendChild(title);
      link.appendChild(snippet);
      item.appendChild(link);
      fragment.appendChild(item);
    });

    searchResults.appendChild(fragment);
    searchStatus.textContent = matches.length + (matches.length === 1 ? ' result' : ' results') + ' for "' + query + '".';
  }

  function clearSearch() {
    searchRequest += 1;
    window.clearTimeout(searchTimer);
    searchTimer = null;

    if (searchStatus) {
      searchStatus.textContent = '';
    }
    if (searchResults) {
      searchResults.textContent = '';
    }
  }

  function runSearch(query) {
    var requestId = searchRequest + 1;
    searchRequest = requestId;

    if (!searchStatus || !searchResults) {
      return;
    }

    searchStatus.textContent = 'Searching the site…';
    searchResults.textContent = '';

    loadSearchIndex().then(function (index) {
      if (requestId !== searchRequest) {
        return;
      }
      renderSearchResults(query, findSearchMatches(index, query));
    }).catch(function () {
      if (requestId === searchRequest) {
        searchStatus.textContent = 'Search is unavailable right now.';
      }
    });
  }

  function openSearch() {
    if (!searchPanel || !searchToggle) {
      return;
    }

    if (nav && nav.classList.contains('open')) {
      closeMenu();
    }

    searchPanel.classList.add('open');
    searchPanel.setAttribute('aria-hidden', 'false');
    searchToggle.setAttribute('aria-expanded', 'true');

    if (searchInput) {
      window.setTimeout(function () {
        searchInput.focus();
      }, 0);
    }

    loadSearchIndex();
  }

  function closeSearch() {
    if (!searchPanel || !searchToggle) {
      return;
    }

    searchPanel.classList.remove('open');
    searchPanel.setAttribute('aria-hidden', 'true');
    searchToggle.setAttribute('aria-expanded', 'false');
    clearSearch();
  }

  if (searchToggle && searchPanel) {
    searchToggle.setAttribute('aria-controls', 'searchPanel');
    searchPanel.setAttribute('aria-hidden', 'true');

    searchToggle.addEventListener('click', function () {
      if (searchPanel.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = searchInput.value.trim();

        if (!query) {
          clearSearch();
          return;
        }

        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
          runSearch(query);
        }, 180);
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', function (event) {
        var query = searchInput ? searchInput.value.trim() : '';

        event.preventDefault();
        window.clearTimeout(searchTimer);

        if (query) {
          runSearch(query);
        } else if (searchInput) {
          searchInput.focus();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && searchPanel.classList.contains('open')) {
        closeSearch();
      }
    });

    document.addEventListener('click', function (event) {
      var clickedInsidePanel = searchPanel.contains(event.target);
      var clickedToggle = searchToggle.contains(event.target);

      if (searchPanel.classList.contains('open') && !clickedInsidePanel && !clickedToggle) {
        closeSearch();
      }
    });
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
