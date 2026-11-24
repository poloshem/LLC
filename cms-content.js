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
      if (!data || !Array.isArray(data.result) && data.result !== null) {
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
      month: new Date(value + 'T00:00:00').toLocaleString('en', {month: 'short'}).toUpperCase()
    };
  }

  function localDate() {
    var date = new Date();
    return date.getFullYear() + '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2);
  }

  function loadNews() {
    if (!eventList || !newsStatus) {
      return Promise.resolve();
    }

    return fetchQuery(
      '*[_type == "siteSettings" && _id == "siteSettings"][0]{newsEnabled}'
    ).then(function (settings) {
      if (!settings || settings.newsEnabled !== true) {
        return;
      }

      return fetchQuery(
        '*[_type == "newsEvent" && !coalesce(archived, false)] {contentType, title, slug, summary, eventStart, eventEnd, publishedAt, "imageUrl": image.asset->url}'
      ).then(function (items) {
        var today = localDate();
        var visibleItems = items.filter(function (item) {
          return item && (item.contentType !== 'event' || !item.eventEnd || item.eventEnd >= today);
        });

        if (!visibleItems.length) {
          setStatus(newsStatus, 'No published news or events are available; showing the saved updates.');
          return;
        }

        visibleItems.sort(function (a, b) {
          var dateA = a.contentType === 'event' ? a.eventStart : a.publishedAt;
          var dateB = b.contentType === 'event' ? b.eventStart : b.publishedAt;
          var todayDate = localDate();
          var upcomingA = dateA && dateA >= todayDate;
          var upcomingB = dateB && dateB >= todayDate;

          if (upcomingA !== upcomingB) {
            return upcomingA ? -1 : 1;
          }
          if (upcomingA) {
            return dateA.localeCompare(dateB);
          }
          return (dateB || '').localeCompare(dateA || '');
        });

        var fragment = document.createDocumentFragment();
        visibleItems.forEach(function (item) {
          if (!item.title || !item.summary) {
            return;
          }

          var article = document.createElement('article');
          article.className = 'event-card';
          if (item.slug && item.slug.current) {
            article.id = item.slug.current;
          }

          var date = formatDate(item.contentType === 'event' ? item.eventStart : item.publishedAt);
          if (date) {
            var dateBlock = document.createElement('div');
            dateBlock.className = 'event-date';
            var day = document.createElement('span');
            day.className = 'd';
            day.textContent = date.day;
            var month = document.createElement('span');
            month.className = 'm';
            month.textContent = date.month;
            dateBlock.appendChild(day);
            dateBlock.appendChild(month);
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
