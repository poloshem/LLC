(function () {
  'use strict';

  var config = window.LLC_CMS_CONFIG;
  if (!config) {
    console.error('CMS content could not load: configuration is missing.');
    return;
  }

  var galleryGrid = document.querySelector('.gallery-grid');
  var galleryStatus = document.getElementById('galleryStatus');
  var eventList = document.querySelector('.event-list');
  var newsStatus = document.getElementById('newsStatus');

  function fetchQuery(query) {
    var url = 'https://' + encodeURIComponent(config.projectId) +
      '.api.sanity.io/v' + encodeURIComponent(config.apiVersion) +
      '/data/query/' + encodeURIComponent(config.dataset) +
      '?query=' + encodeURIComponent(query);

    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error('Sanity returned HTTP ' + response.status + '.');
      }
      return response.json();
    }).then(function (data) {
      if (!data || data.result !== null && typeof data.result !== 'object') {
        throw new Error('Sanity returned an invalid content response.');
      }
      return data.result;
    });
  }

  function setStatus(element, message) {
    if (element) {
      element.textContent = message;
    }
  }

  function makeImage(url, alt, className) {
    if (typeof url !== 'string' || url.indexOf('https://') !== 0) {
      return null;
    }

    var image = document.createElement('img');
    image.src = url;
    image.alt = alt || '';
    if (className) {
      image.className = className;
    }
    return image;
  }

  function loadGallery() {
    if (!galleryGrid || !galleryStatus) {
      return Promise.resolve();
    }

    return fetchQuery(
      '*[_type == "siteSettings" && _id == "siteSettings"][0]{galleryEnabled}'
    ).then(function (settings) {
      if (!settings || settings.galleryEnabled !== true) {
        return;
      }

      return fetchQuery(
        '*[_type == "galleryImage" && !coalesce(archived, false)] | order(order asc, _createdAt asc) {alt, caption, "imageUrl": image.asset->url}'
      ).then(function (images) {
        var usableImages = images.filter(function (item) {
          return item && makeImage(item.imageUrl, item.alt);
        });

        if (!usableImages.length) {
          setStatus(galleryStatus, 'No published gallery photos are available; showing the saved gallery.');
          return;
        }

        var fragment = document.createDocumentFragment();
        usableImages.forEach(function (item) {
          var figure = document.createElement('figure');
          figure.className = 'gallery-item';
          figure.appendChild(makeImage(item.imageUrl, item.alt));

          if (item.caption) {
            var caption = document.createElement('figcaption');
            caption.textContent = item.caption;
            figure.appendChild(caption);
          }
          fragment.appendChild(figure);
        });

        galleryGrid.replaceChildren(fragment);
      });
    }).catch(function (error) {
      console.error('CMS gallery content could not be loaded.', error);
      setStatus(galleryStatus, 'Gallery updates could not be loaded; showing the saved gallery.');
    });
  }

  function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    return {
      day: value.slice(8, 10),
      month: new Date(value + 'T00:00:00').toLocaleString('en', {month: 'short'}).toUpperCase(),
      year: value.slice(0, 4)
    };
  }

  function localDate() {
    var date = new Date();
    return date.getFullYear() + '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2);
  }

  function setUpcomingEventIndicator(hasUpcomingEvent, targetSlug) {
    document.querySelectorAll('nav.primary li[data-page="news"]').forEach(function (item) {
      var link = item.querySelector('a.top-link');
      if (!link) {
        return;
      }

      link.href = targetSlug
        ? 'news.html#' + encodeURIComponent(targetSlug)
        : 'news.html';
      item.classList.toggle('has-upcoming-event', hasUpcomingEvent);
      var badge = link.querySelector('.upcoming-event-badge');
      if (hasUpcomingEvent && !badge) {
        badge = document.createElement('span');
        badge.className = 'upcoming-event-badge';
        badge.textContent = 'Upcoming';
        link.appendChild(badge);
      } else if (!hasUpcomingEvent && badge) {
        badge.remove();
      }
    });
  }

  function sortStaticEvents() {
    if (!eventList) {
      return;
    }

    var events = Array.prototype.slice.call(eventList.querySelectorAll(':scope > .event-card'));
    events.sort(function (a, b) {
      return (a.getAttribute('data-event-date') || '')
        .localeCompare(b.getAttribute('data-event-date') || '');
    });
    events.forEach(function (event) {
      eventList.appendChild(event);
    });
  }

  function loadNews() {
    var upcomingEvents = Array.isArray(config.upcomingEvents)
      ? config.upcomingEvents.slice()
      : [];
    Array.prototype.forEach.call(
      document.querySelectorAll('.event-list > .event-card[data-event-date][id]'),
      function (event) {
        upcomingEvents.push({
          date: event.getAttribute('data-event-date'),
          slug: event.id
        });
      }
    );

    function refreshUpcomingEventIndicator() {
      var currentDate = localDate();
      var upcomingEvent = upcomingEvents
        .filter(function (event) {
          return event && typeof event.date === 'string' &&
            typeof event.slug === 'string' && event.date >= currentDate;
        })
        .sort(function (a, b) {
          return a.date.localeCompare(b.date);
        })[0];
      var hasFutureEvent = upcomingEvents.some(function (event) {
        return event && typeof event.date === 'string' && event.date > currentDate;
      });

      setUpcomingEventIndicator(hasFutureEvent, upcomingEvent && upcomingEvent.slug);
    }

    function checkUpcomingEventAtMidnight() {
      var now = new Date();
      var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      window.setTimeout(function () {
        refreshUpcomingEventIndicator();
        checkUpcomingEventAtMidnight();
      }, midnight.getTime() - now.getTime() + 50);
    }

    sortStaticEvents();
    refreshUpcomingEventIndicator();
    checkUpcomingEventAtMidnight();

    return fetchQuery(
      '*[_type == "siteSettings" && _id == "siteSettings"][0]{newsEnabled}'
    ).then(function (settings) {
      if (!settings || settings.newsEnabled !== true) {
        return;
      }

      return fetchQuery(
        '*[_type == "newsEvent" && !coalesce(archived, false)] {contentType, title, slug, summary, eventStart, publishedAt, "imageUrl": image.asset->url}'
      ).then(function (items) {
        items = Array.isArray(items) ? items.filter(Boolean) : [];

        if (!items.length) {
          if (eventList && newsStatus) {
            setStatus(newsStatus, 'No published news or events are available; showing the saved updates.');
          }
          return;
        }

        upcomingEvents = items
          .filter(function (item) {
            return item.contentType === 'event' &&
              typeof item.eventStart === 'string' &&
              item.slug && typeof item.slug.current === 'string';
          })
          .map(function (item) {
            return {
              date: item.eventStart.slice(0, 10),
              slug: item.slug.current
            };
          });
        refreshUpcomingEventIndicator();

        if (!eventList || !newsStatus) {
          return;
        }

        items.sort(function (a, b) {
          var dateA = a.contentType === 'event' ? a.eventStart : a.publishedAt;
          var dateB = b.contentType === 'event' ? b.eventStart : b.publishedAt;
          return (dateA || '').localeCompare(dateB || '');
        });

        var fragment = document.createDocumentFragment();
        items.forEach(function (item) {
          if (!item.title || !item.summary) {
            return;
          }

          var article = document.createElement('article');
          article.className = 'event-card';
          var eventDate = item.contentType === 'event' ? item.eventStart : item.publishedAt;
          if (eventDate) {
            article.setAttribute('data-event-date', eventDate);
          }
          if (item.slug && item.slug.current) {
            article.id = item.slug.current;
          }

          var date = formatDate(eventDate);
          if (date) {
            var dateBlock = document.createElement('div');
            dateBlock.className = 'event-date';
            var day = document.createElement('span');
            day.className = 'd';
            day.textContent = date.day;
            var month = document.createElement('span');
            month.className = 'm';
            month.textContent = date.month;
            var year = document.createElement('span');
            year.className = 'y';
            year.textContent = date.year;
            dateBlock.appendChild(day);
            dateBlock.appendChild(month);
            dateBlock.appendChild(year);
            article.appendChild(dateBlock);
          }

          var content = document.createElement('div');
          var title = document.createElement('h3');
          title.textContent = item.title;
          var summary = document.createElement('p');
          summary.textContent = item.summary;
          content.appendChild(title);
          content.appendChild(summary);

          var image = makeImage(item.imageUrl, '', 'event-image');
          if (image) {
            content.appendChild(image);
          }
          article.appendChild(content);
          fragment.appendChild(article);
        });

        if (!fragment.childNodes.length) {
          setStatus(newsStatus, 'No complete news or events are available; showing the saved updates.');
          return;
        }

        eventList.replaceChildren(fragment);
      });
    }).catch(function (error) {
      console.error('CMS news and events could not be loaded.', error);
      setStatus(newsStatus, 'News updates could not be loaded; showing the saved updates.');
    });
  }

  loadGallery();
  loadNews();
}());
