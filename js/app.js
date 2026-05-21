(function ($) {
  "use strict";

  var courseCache = null;

  function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function loadSharedComponents() {
    var headerRequest = $("#site-header").load("partials/header.html", function () {
      setActiveNav();
      initLanguageSwitcher();
      initMobileNavigation();
    });
    var footerRequest = $("#site-footer").load("partials/footer.html", function () {
      initTitleAnimations();
    });
    return $.when(headerRequest, footerRequest);
  }

  function setActiveNav() {
    var currentPage = $("body").data("page");
    var path = window.location.pathname.split("/").pop().toLowerCase();

    if (!currentPage) {
      if (!path || path === "index.html" || path === "") {
        currentPage = "home";
      } else if (path.indexOf("about") === 0) {
        currentPage = "about";
      } else if (path.indexOf("courses") === 0 || path.indexOf("course-details") === 0 || path.indexOf("purchase") === 0) {
        currentPage = "courses";
      } else if (path.indexOf("contact") === 0) {
        currentPage = "contact";
      } else if (path.indexOf("login") === 0) {
        currentPage = "login";
      } else if (path.indexOf("register") === 0) {
        currentPage = "register";
      }
    }

    $("[data-page-link]").removeClass("active");
    $('[data-page-link="' + currentPage + '"]').addClass("active");
  }

  function initMobileNavigation() {
    var nav = document.querySelector(".site-header .edugo-mobile-nav");
    var backdrop = document.querySelector(".site-header .edugo-mobile-nav-backdrop");
    var closeTargets = document.querySelectorAll("[data-edugo-nav-close]");

    if (!nav || nav.dataset.mobileNavInitialized) {
      return;
    }

    nav.dataset.mobileNavInitialized = "true";

    var navHome = nav.parentElement;
    var navNextSibling = nav.nextSibling;

    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
    }

    function moveNavToBody() {
      if (nav.parentElement !== document.body) {
        document.body.appendChild(nav);
      }
    }

    function restoreNavHome() {
      if (navHome && nav.parentElement !== navHome) {
        navHome.insertBefore(nav, navNextSibling);
      }
    }

    function setNavState(isOpen) {
      document.body.classList.toggle("edugo-mobile-nav-open", isOpen);
      document.body.classList.toggle("edugo-mobile-nav-lock", isOpen);
    }

    nav.addEventListener("show.bs.collapse", function () {
      moveNavToBody();
      setNavState(true);
    });

    nav.addEventListener("hide.bs.collapse", function () {
      document.body.classList.remove("edugo-mobile-nav-open");
    });

    nav.addEventListener("hidden.bs.collapse", function () {
      document.body.classList.remove("edugo-mobile-nav-lock");
      restoreNavHome();
    });

    closeTargets.forEach(function (target) {
      target.addEventListener("click", function () {
        var collapse = bootstrap.Collapse.getOrCreateInstance(nav, {
          toggle: false
        });
        collapse.hide();
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992 && nav.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(nav, {
          toggle: false
        }).hide();
      }
    });
  }

  function initLanguageSwitcher() {
    var $picker = $(".language-picker");
    if (!$picker.length) {
      return;
    }

    if ($picker.data("languagePickerInitialized")) {
      return;
    }

    $picker.data("languagePickerInitialized", true);

    var $trigger = $picker.find(".language-picker-trigger");
    var $panel = $picker.find(".language-picker-panel");
    var $backdrop = $picker.find(".language-picker-backdrop");
    var $options = $picker.find(".language-picker-option");
    var savedLanguage = window.localStorage.getItem("siteLanguage") || "en";
    var closeTimer = null;

    function getLanguageLabel(language) {
      return language === "bm" ? "Bahasa Malaysia" : "English";
    }

    function applyLanguage(language, shouldPrompt) {
      var normalizedLanguage = language === "bm" ? "bm" : "en";
      var languageLabel = normalizedLanguage === "bm" ? "BM" : "EN";

      $options.each(function () {
        var $option = $(this);
        var isActive = $option.data("language") === normalizedLanguage;
        $option.toggleClass("active", isActive);
        $option.attr("aria-selected", isActive ? "true" : "false");
      });

      $trigger.find(".language-picker-trigger-label").text(languageLabel);
      $("html").attr("lang", normalizedLanguage === "bm" ? "ms" : "en");
      $("body").attr("data-language", normalizedLanguage);
      window.localStorage.setItem("siteLanguage", normalizedLanguage);

      if (shouldPrompt) {
        window.alert("Language selected: " + getLanguageLabel(normalizedLanguage));
      }
    }

    function openPicker() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      $picker.addClass("is-open");
      $trigger.attr("aria-expanded", "true");
      $panel.attr("aria-hidden", "false");
      $backdrop.prop("hidden", false);

      window.setTimeout(function () {
        var $activeOption = $options.filter(".active");
        ($activeOption.length ? $activeOption : $options.first()).trigger("focus");
      }, 20);
    }

    function closePicker(restoreFocus) {
      $picker.removeClass("is-open");
      $trigger.attr("aria-expanded", "false");
      $panel.attr("aria-hidden", "true");

      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }

      closeTimer = window.setTimeout(function () {
        $backdrop.prop("hidden", true);
        closeTimer = null;
      }, 220);

      if (restoreFocus) {
        $trigger.trigger("focus");
      }
    }

    applyLanguage(savedLanguage, false);
    $backdrop.prop("hidden", true);

    $trigger.off("click.languagePicker").on("click.languagePicker", function (event) {
      event.preventDefault();
      if ($picker.hasClass("is-open")) {
        closePicker(false);
      } else {
        openPicker();
      }
    });

    $options.off("click.languagePicker").on("click.languagePicker", function () {
      var selectedLanguage = $(this).data("language");
      applyLanguage(selectedLanguage, true);
      closePicker(true);
    });

    $(document)
      .off("click.languagePicker")
      .on("click.languagePicker", function (event) {
        if (!$(event.target).closest(".language-picker").length) {
          closePicker(false);
        }
      })
      .off("keydown.languagePicker")
      .on("keydown.languagePicker", function (event) {
        if (event.key === "Escape") {
          closePicker(true);
        }
      });
  }

  function getCourses() {
    if (courseCache) {
      return $.Deferred().resolve(courseCache).promise();
    }

    return $.ajax({
      url: "data/courses.json",
      method: "GET",
      dataType: "json"
    }).then(function (courses) {
      courseCache = courses;
      return courses;
    });
  }

  function simulateApi(response, delay) {
    var deferred = $.Deferred();
    window.setTimeout(function () {
      deferred.resolve(response);
    }, delay || 900);
    return deferred.promise();
  }

  function renderAlert(targetSelector, type, message) {
    $(targetSelector).html('<div class="alert alert-' + type + '" role="alert">' + message + "</div>");
  }

  function formatRMPrice(amount) {
    var numericAmount = Number(String(amount).replace(/[^\d.-]/g, ""));

    if (Number.isFinite(numericAmount)) {
      return "RM " + numericAmount.toLocaleString("en-MY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    return "RM " + amount;
  }

  function normalizeCourseRating(rating) {
    var numericRating = parseFloat(rating);

    if (!Number.isFinite(numericRating)) {
      numericRating = 0.5;
    }

    return Math.min(5, Math.max(0.5, Math.round(numericRating * 2) / 2));
  }

  function formatCourseRating(rating) {
    return normalizeCourseRating(rating).toFixed(1);
  }

  function createCourseRating(course, extraClass) {
    var rating = formatCourseRating(course.rating);
    var options = "";

    for (var value = 0.5; value <= 5; value += 0.5) {
      var optionValue = value.toFixed(1);
      options += '<option value="' + optionValue + '"' + (optionValue === rating ? " selected" : "") + ">" + optionValue + "</option>";
    }

    return (
      '<div class="course-rating-display ' + (extraClass || "") + '" aria-label="Rated ' + rating + ' out of 5">' +
        '<select class="course-rating-select" data-rating="' + rating + '" tabindex="-1" aria-hidden="true">' +
          options +
        "</select>" +
        '<span class="course-rating-value">' + rating + "</span>" +
      "</div>"
    );
  }

  function initCourseRatings(context) {
    var $context = context ? $(context) : $(document);
    var $ratings = $context.find(".course-rating-select").addBack(".course-rating-select");

    if (!$ratings.length || !$.fn.barrating) {
      return;
    }

    $ratings.each(function () {
      var $rating = $(this);
      var rating = formatCourseRating($rating.data("rating"));

      if ($rating.data("courseRatingInitialized")) {
        return;
      }

      $rating.barrating({
        theme: "fontawesome-stars",
        initialRating: rating,
        readonly: true,
        fastClicks: false
      });

      $rating.barrating("set", rating);

      $rating
        .data("courseRatingInitialized", true)
        .closest(".course-rating-display")
        .find(".br-widget a")
        .each(function () {
          var $star = $(this);
          var starRating = parseFloat($star.data("ratingValue"));

          $star
            .toggleClass("br-selected br-active", Number.isFinite(starRating) && starRating <= parseFloat(rating))
            .toggleClass("br-current", $star.data("ratingValue") === rating);
        })
        .attr({
          "aria-hidden": "true",
          tabindex: "-1"
        });
    });
  }

  function createCourseCard(course, wrapperClass) {
    var slideClass = wrapperClass || "col-md-6 col-xl-3";

    return (
      '<div class="' + slideClass + '">' +
      '<article class="course-card">' +
      '<div class="course-card-media">' +
        '<img src="' + course.image + '" alt="' + course.title + '">' +
      "</div>" +
      '<div class="course-card-body">' +
      '<div class="course-card-content">' +
      '<div class="course-meta">' +
      '<span>' + course.category + "</span>" +
      '<span>' + course.duration + "</span>" +
      "</div>" +
      '<h3 class="course-card-title">' + course.title + "</h3>" +
      '<div class="course-card-stats d-flex justify-content-between align-items-center gap-3">' +
      '<div><div class="course-price">' + formatRMPrice(course.price) + '</div>' + "</div>" +
      createCourseRating(course, "course-card-rating") +
      "</div>" +
      "</div>" +
      '<div class="course-card-spacer" aria-hidden="true"></div>' +
      '<div class="course-card-actions">' +
      '<a class="btn btn-brand" href="course-details.html?id=' + course.id + '">View Details</a>' +
      '<a class="btn btn-outline-dark" href="purchase.html?id=' + course.id + '">Purchase</a>' +
      "</div>" +
      "</div>" +
      "</article>" +
      "</div>"
    );
  }

  function initHomeCourses() {
    var featuredTarget = $("#featuredCourses");
    if (!featuredTarget.length) {
      return;
    }

    getCourses().done(function (courses) {
      featuredTarget.html(courses.map(function (course) {
        return createCourseCard(course, "featured-slide");
      }).join(""));
      initCourseRatings(featuredTarget);
      initFeaturedCoursesSlider();
    });
  }

  function initFeaturedCoursesSlider() {
    var track = document.getElementById("featuredCourses");
    if (!track) {
      return;
    }

    var slider = track.closest(".featured-slider-shell");
    var prevButton = slider ? slider.querySelector("[data-featured-prev]") : null;
    var nextButton = slider ? slider.querySelector("[data-featured-next]") : null;
    var autoplayTimer = null;
    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var rafId = null;

    if (!slider || !prevButton || !nextButton) {
      return;
    }

    function getStep() {
      var slide = track.querySelector(".featured-slide");
      if (!slide) {
        return track.clientWidth;
      }

      var slideWidth = slide.getBoundingClientRect().width;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || 0) || 0;
      return slideWidth + gap;
    }

    function hasOverflow() {
      return track.scrollWidth > track.clientWidth + 4;
    }

    function updateControls() {
      var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
      var isScrollable = hasOverflow();

      slider.classList.toggle("is-scrollable", isScrollable);
      prevButton.disabled = !isScrollable || track.scrollLeft <= 2;
      nextButton.disabled = !isScrollable || track.scrollLeft >= maxScroll - 2;
    }

    function scrollByDirection(direction) {
      track.scrollBy({
        left: direction * getStep(),
        behavior: "smooth"
      });
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (prefersReducedMotion || !hasOverflow()) {
        return;
      }

      autoplayTimer = window.setInterval(function () {
        var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
        if (track.scrollLeft >= maxScroll - 4) {
          track.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollByDirection(1);
        }
      }, 4200);
    }

    function scheduleUpdate() {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        updateControls();
      });
    }

    prevButton.addEventListener("click", function () {
      scrollByDirection(-1);
    });

    nextButton.addEventListener("click", function () {
      scrollByDirection(1);
    });

    track.addEventListener("scroll", scheduleUpdate);
    track.addEventListener("mouseenter", stopAutoplay);
    track.addEventListener("mouseleave", startAutoplay);
    track.addEventListener("focusin", stopAutoplay);
    track.addEventListener("focusout", startAutoplay);
    window.addEventListener("resize", function () {
      scheduleUpdate();
      startAutoplay();
    });

    updateControls();
    startAutoplay();
  }

  function animateStatNumber(element) {
    var $element = $(element);

    if ($element.data("animated")) {
      return;
    }

    var target = parseFloat($element.data("target")) || 0;
    var suffix = $element.data("suffix") || "";
    var decimals = parseInt($element.data("decimals"), 10);
    decimals = Number.isNaN(decimals) ? (target % 1 !== 0 ? 1 : 0) : decimals;
    var duration = 1400;
    var startTime = null;

    $element.data("animated", true);

    function formatValue(value) {
      return value.toFixed(decimals) + suffix;
    }

    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var currentValue = target * eased;

      $element.text(formatValue(currentValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        $element.text(formatValue(target));
      }
    }

    window.requestAnimationFrame(step);
  }

  function initStatCounters() {
    var statNumbers = document.querySelectorAll(".stat-number");

    if (!statNumbers.length || !("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(function (entries, statObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStatNumber(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.45
    });

    statNumbers.forEach(function (statNumber) {
      observer.observe(statNumber);
    });
  }

  function renderTestimonialStars() {
    $(".testimonial-rating").each(function () {
      var $rating = $(this);
      var rating = parseFloat($rating.data("rating")) || 0;
      var starsMarkup = "";

      for (var i = 1; i <= 5; i += 1) {
        var fill = Math.max(0, Math.min(1, rating - (i - 1)));
        starsMarkup +=
          '<span class="rating-star" aria-hidden="true">' +
            '<span class="rating-star-fill" style="width:' + (fill * 100) + '%"></span>' +
          "</span>";
      }

      $rating.html(starsMarkup);
    });
  }

  function initTitleAnimations() {
    var titleGroups = [
      { selector: ".page-hero h1, .carousel-copy h1, .carousel-copy h2, .contact-hero-copy h1, .course-detail-hero h1, .auth-aside h1", variant: "title-reveal--hero" },
      { selector: ".auth-form-wrap h1, .auth-form-wrap h2, .contact-info-panel h2, .contact-form-panel h2, .course-detail-section h2, .course-detail-section h3, .site-footer h3", variant: "title-reveal--section" }
    ];

    var $targets = $();

    titleGroups.forEach(function (group) {
      $(group.selector).each(function () {
        var $title = $(this);
        if ($title.data("titleAnimated")) {
          return;
        }

        $title.addClass("title-reveal " + group.variant);
        $title.data("titleAnimated", true);
        $targets = $targets.add(this);
      });
    });

    if (!$targets.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $targets.addClass("is-visible");
      return;
    }

    var observer = new IntersectionObserver(function (entries, titleObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          titleObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.25
    });

    $targets.each(function (index, element) {
      element.style.transitionDelay = (index * 70) + "ms";
      observer.observe(element);
    });
  }

  function initContactSupportCards() {
    var cards = document.querySelectorAll(".contact-option-card");
    if (!cards.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      cards.forEach(function (card) {
        card.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, supportObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          supportObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.25
    });

    cards.forEach(function (card, index) {
      card.style.transitionDelay = (index * 90) + "ms";
      observer.observe(card);
    });
  }

  function initCoursesPage() {
    var listTarget = $("#courseListing");
    var paginationTarget = $("#coursePagination");
    if (!listTarget.length) {
      return;
    }

    getCourses().done(function (courses) {
      var currentPage = 1;
      var pageSize = 4;

      function buildPagination(totalPages) {
        if (!paginationTarget.length) {
          return;
        }

        if (totalPages <= 1) {
          paginationTarget.empty();
          return;
        }

        var markup = "";

        markup +=
          '<li class="page-item ' + (currentPage === 1 ? "disabled" : "") + '">' +
            '<button class="page-link" type="button" data-page-action="prev" ' + (currentPage === 1 ? "disabled" : "") + '>Prev</button>' +
          "</li>";

        for (var i = 1; i <= totalPages; i += 1) {
          markup +=
            '<li class="page-item ' + (i === currentPage ? "active" : "") + '">' +
              '<button class="page-link" type="button" data-page-number="' + i + '" ' + (i === currentPage ? 'aria-current="page"' : "") + ">" + i + "</button>" +
            "</li>";
        }

        markup +=
          '<li class="page-item ' + (currentPage === totalPages ? "disabled" : "") + '">' +
            '<button class="page-link" type="button" data-page-action="next" ' + (currentPage === totalPages ? "disabled" : "") + '>Next</button>' +
          "</li>";

        paginationTarget.html(markup);
      }

      function clampPage(totalPages) {
        currentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
      }

      function renderList() {
        var keyword = ($("#courseSearch").val() || "").toLowerCase().trim();
        var category = $(".filter-chip.active").data("categoryButton") || "";
        var filtered = courses.filter(function (course) {
          var haystack = [course.title, course.category, course.summary, course.skills.join(" ")].join(" ").toLowerCase();
          var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
          var categoryMatch = !category || course.category === category;
          return keywordMatch && categoryMatch;
        });

        var totalPages = Math.ceil(filtered.length / pageSize);
        clampPage(totalPages);

        var startIndex = (currentPage - 1) * pageSize;
        var pageItems = filtered.slice(startIndex, startIndex + pageSize);

        listTarget.html(pageItems.map(function (course) {
          return createCourseCard(course);
        }).join(""));
        initCourseRatings(listTarget);
        $("#courseEmptyState").toggleClass("d-none", filtered.length > 0);
        $("#courseCount").text(filtered.length);
        buildPagination(totalPages);
      }

      renderList();
      $("#courseSearch").on("input", function () {
        currentPage = 1;
        renderList();
      });
      $(".filter-chip").on("click", function () {
        $(".filter-chip").removeClass("active");
        $(this).addClass("active");
        currentPage = 1;
        renderList();
      });
      paginationTarget.on("click", ".page-link", function () {
        var pageNumber = $(this).data("pageNumber");
        var action = $(this).data("pageAction");
        var totalPages = Math.ceil(courses.filter(function (course) {
          var keyword = ($("#courseSearch").val() || "").toLowerCase().trim();
          var category = $(".filter-chip.active").data("categoryButton") || "";
          var haystack = [course.title, course.category, course.summary, course.skills.join(" ")].join(" ").toLowerCase();
          var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
          var categoryMatch = !category || course.category === category;
          return keywordMatch && categoryMatch;
        }).length / pageSize);

        if (typeof pageNumber === "number") {
          currentPage = pageNumber;
        } else if (action === "prev") {
          currentPage -= 1;
        } else if (action === "next") {
          currentPage += 1;
        }

        currentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
        renderList();
      });
    });
  }

  function initCourseDetailsPage() {
    var detailHero = $("#courseDetailHero");
    if (!detailHero.length) {
      return;
    }

    var courseId = getQueryParam("id");

    getCourses()
      .done(function (courses) {
        var course = courses.find(function (item) {
          return item.id === courseId;
        }) || courses[0];
        var detailMeta = null;

        if (!course) {
          $("#courseDetailFallback").removeClass("d-none");
          return;
        }

        detailMeta = getCourseDetailMeta(course);

        var relatedCourses = courses.filter(function (item) {
          return item.id !== course.id;
        }).slice(0, 3);

        var curriculumId = "courseCurriculumAccordion";

        detailHero.html(
          '<div class="course-detail-hero-shell">' +
            '<div class="course-detail-hero-copy">' +
              '<div class="course-detail-breadcrumbs">' +
                '<span>Courses</span>' +
                '<span>' + course.category + "</span>" +
                '<span>' + detailMeta.subtopic + "</span>" +
              "</div>" +
              "<h1>" + course.title + "</h1>" +
              '<p class="course-detail-subtitle">' + course.description + "</p>" +
              '<div class="course-detail-hero-media">' +
                '<img src="' + course.image + '" alt="' + course.title + '">' +
              "</div>" +
            "</div>" +
            '<div class="course-detail-hero-card course-purchase-card premium-purchase-card">' +
              '<div class="course-purchase-body">' +
                '<div class="course-purchase-trust">' +
                  '<span class="course-flag">Bestseller</span>' +
                  '<div class="course-purchase-rating">' +
                    createCourseRating(course, "course-inline-rating") +
                  "</div>" +
                "</div>" +
                '<div class="course-price-line">' +
                  '<span class="course-price-note">Enrollment fee</span>' +
                  '<div class="summary-price mb-0">' + formatRMPrice(course.price) + "</div>" +
                "</div>" +
                '<a class="btn btn-brand btn-lg w-100 mb-3" href="purchase.html?id=' + course.id + '">Enroll Now</a>' +
                '<div class="course-includes">' +
                  "<h3>This course includes:</h3>" +
                  '<ul class="course-sidebar-list">' +
                    '<li><span class="course-include-label"><span class="course-include-icon" aria-hidden="true">D</span>Duration</span><strong>' + detailMeta.totalHours + "</strong></li>" +
                    '<li><span class="course-include-label"><span class="course-include-icon" aria-hidden="true">N</span>Lessons</span><strong>' + detailMeta.lectures + " Lessons</strong></li>" +
                    '<li><span class="course-include-label"><span class="course-include-icon" aria-hidden="true">C</span>Certificate</span><strong>Included</strong></li>' +
                    '<li><span class="course-include-label"><span class="course-include-icon" aria-hidden="true">A</span>Access</span><strong>Lifetime</strong></li>' +
                    '<li><span class="course-include-label"><span class="course-include-icon" aria-hidden="true">W</span>Devices</span><strong>Mobile & Web</strong></li>' +
                  "</ul>" +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>"
        );

        $("#courseDetailContent").html(
          '<div id="course-content" class="course-detail-layout">' +
            '<div class="course-detail-main">' +
              '<section class="course-detail-section course-overview-card card-surface">' +
                '<div class="course-section-heading">' +
                  '<span class="eyebrow text-brand">Course Overview</span>' +
                  '<h2>What you will learn</h2>' +
                "</div>" +
                '<div class="course-learn-grid">' +
                  course.outcomes.concat(course.skills).slice(0, 8).map(function (item) {
                    return '<div class="learn-item">' + item + "</div>";
                  }).join("") +
                "</div>" +
              "</section>" +
              '<section class="course-detail-section card-surface">' +
                '<div class="course-section-heading">' +
                  '<span class="eyebrow text-brand">About This Course</span>' +
                  "<h2>Description</h2>" +
                "</div>" +
                "<p>" + course.description + "</p>" +
                "<p>" + detailMeta.descriptionExtended + "</p>" +
                '<div class="course-tag-row">' +
                  course.skills.map(function (skill) {
                    return '<span class="course-tag">' + skill + "</span>";
                  }).join("") +
                "</div>" +
              "</section>" +
              '<section id="course-curriculum" class="course-detail-section card-surface">' +
                '<div class="course-section-heading course-section-heading-inline">' +
                  '<div><span class="eyebrow text-brand">Curriculum</span><h2>Course content</h2></div>' +
                  '<span class="course-content-meta">' + detailMeta.sections + " sections | " + detailMeta.lectures + " lessons | " + detailMeta.totalHours + "</span>" +
                "</div>" +
                '<div class="accordion course-curriculum-accordion" id="' + curriculumId + '">' +
                  course.modules.map(function (module, index) {
                    var headingId = "curriculumHeading" + index;
                    var collapseId = "curriculumCollapse" + index;
                    var isFirst = index === 0;
                    return (
                      '<div class="accordion-item curriculum-item">' +
                        '<h3 class="accordion-header" id="' + headingId + '">' +
                          '<button class="accordion-button ' + (isFirst ? "" : "collapsed") + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" aria-expanded="' + (isFirst ? "true" : "false") + '" aria-controls="' + collapseId + '">' +
                            '<span>Section ' + (index + 1) + ": " + module + "</span>" +
                            '<small>' + detailMeta.moduleDurations[index % detailMeta.moduleDurations.length] + "</small>" +
                          "</button>" +
                        "</h3>" +
                        '<div id="' + collapseId + '" class="accordion-collapse collapse ' + (isFirst ? "show" : "") + '" aria-labelledby="' + headingId + '" data-bs-parent="#' + curriculumId + '">' +
                          '<div class="accordion-body">' +
                            '<ul class="course-lesson-list">' +
                              '<li><span>Lesson 1</span><strong>Concept walkthrough</strong></li>' +
                              '<li><span>Lesson 2</span><strong>Applied demo</strong></li>' +
                              '<li><span>Lesson 3</span><strong>Guided practice</strong></li>' +
                              '<li><span>Project</span><strong>Portfolio-ready exercise</strong></li>' +
                            "</ul>" +
                          "</div>" +
                        "</div>" +
                      "</div>"
                    );
                  }).join("") +
                "</div>" +
              "</section>" +
              '<section class="course-detail-section card-surface">' +
                '<div class="course-section-heading"><span class="eyebrow text-brand">Learners</span><h2>Who this course is for</h2></div>' +
                '<ul class="detail-list">' +
                  detailMeta.audience.map(function (item) {
                    return "<li>" + item + "</li>";
                  }).join("") +
                "</ul>" +
              "</section>" +
              '<section class="course-detail-section card-surface">' +
                '<div class="course-section-heading"><span class="eyebrow text-brand">Keep Learning</span><h2>Related courses</h2></div>' +
                '<div class="related-course-grid">' +
                  relatedCourses.map(function (relatedCourse) {
                    return (
                      '<a class="related-course-card" href="course-details.html?id=' + relatedCourse.id + '">' +
                        '<img src="' + relatedCourse.image + '" alt="' + relatedCourse.title + '">' +
                        '<span>' + relatedCourse.category + "</span>" +
                        '<strong>' + relatedCourse.title + "</strong>" +
                      "</a>"
                    );
                  }).join("") +
                "</div>" +
              "</section>" +
            "</div>" +
          "</div>"
        );

        detailHero.find(".course-detail-hero-copy").append($("#courseDetailContent .course-detail-main"));
        $("#courseDetailContent").empty();
        $(".course-detail-body").addClass("course-detail-body-empty");

        initCourseRatings(detailHero);
      })
      .fail(function () {
        $("#courseDetailFallback").removeClass("d-none");
      });
  }

  function getCourseDetailMeta(course) {
    var presets = {
      Design: {
        topic: "Design",
        subtopic: "UX Strategy",
        instructor: "Maya Torres",
        instructorRole: "Founder, Design Strategist, and Learning Director",
        instructorBio: "Maya has led experience strategy and digital product education across startups, agencies, and global teams. Her teaching style focuses on turning fuzzy creative thinking into confident, real-world execution.",
        instructorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
      },
      Data: {
        topic: "Data",
        subtopic: "Analytics",
        instructor: "Rafael Singh",
        instructorRole: "Data Curriculum Lead and Analytics Mentor",
        instructorBio: "Rafael specializes in helping learners translate metrics into business decisions. His programs combine dashboards, storytelling, and tactical workflow design for modern analytics teams.",
        instructorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
      },
      Marketing: {
        topic: "Marketing",
        subtopic: "Growth Strategy",
        instructor: "Leah Morgan",
        instructorRole: "Growth Advisor and Campaign Strategist",
        instructorBio: "Leah teaches marketers how to design stronger experimentation loops, clearer reporting systems, and more resilient growth plans across channels.",
        instructorImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80"
      },
      Product: {
        topic: "Product",
        subtopic: "Roadmapping",
        instructor: "Daniel Brooks",
        instructorRole: "Product Coach and Strategy Mentor",
        instructorBio: "Daniel has supported product teams through discovery, prioritization, launches, and stakeholder alignment. He is known for making complex product tradeoffs easier to communicate.",
        instructorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
      }
    };
    var preset = presets[course.category] || presets.Design;

    return {
      topic: preset.topic,
      subtopic: preset.subtopic,
      instructor: preset.instructor,
      instructorRole: preset.instructorRole,
      instructorBio: preset.instructorBio,
      instructorImage: preset.instructorImage,
      updated: "04/2026",
      language: "English",
      captionLanguages: "English captions",
      ratingCount: Math.round(course.students * 0.72).toLocaleString(),
      sections: course.modules.length,
      lectures: course.modules.length * 4 + 5,
      totalHours: course.duration,
      downloadables: Math.max(6, course.modules.length * 2),
      projects: Math.max(2, Math.round(course.modules.length / 2)),
      moduleDurations: ["58min", "1hr 12min", "44min", "1hr 05min"],
      requirements: [
        "No prior experience is required, only curiosity and commitment to practice.",
        "A laptop or desktop computer with internet access.",
        "Willingness to complete guided exercises and short project work."
      ],
      audience: [
        "Learners who want a structured path into " + course.category.toLowerCase() + " skills.",
        "Professionals looking to sharpen execution, communication, and portfolio-ready output.",
        "Beginners and intermediate learners who want practical guidance instead of theory alone."
      ],
      descriptionExtended: "This course is designed to help you move from passive understanding to active application. Across concise lessons, practical demonstrations, and structured exercises, you will build a repeatable workflow you can use in real projects and career conversations."
    };
  }

  function initPurchasePage() {
    var summaryTarget = $("#purchaseSummary");
    if (!summaryTarget.length) {
      return;
    }

    var courseId = getQueryParam("id");

    getCourses().done(function (courses) {
      var course = courses.find(function (item) {
        return item.id === courseId;
      }) || courses[0];

      summaryTarget.html(
        "<h2 class='mb-4'>Order summary</h2>" +
        '<img class="img-fluid rounded-4 mb-4" src="' + course.image + '" alt="' + course.title + '">' +
        "<h3>" + course.title + "</h3>" +
        "<p class='text-muted'>" + course.summary + "</p>" +
        '<ul class="summary-list mt-4">' +
        "<li><strong>Category:</strong> " + course.category + "</li>" +
        "<li><strong>Duration:</strong> " + course.duration + "</li>" +
        "<li><strong>Level:</strong> " + course.level + "</li>" +
        "<li><strong>Enrollment fee:</strong> " + formatRMPrice(course.price) + "</li>" +
        "<li><strong>Platform access:</strong> Included</li>" +
        "</ul>" +
        "<div class='summary-price mt-4'>" + formatRMPrice(course.price) + "</div>" +
        "<p class='text-muted mb-0'>This is a demo checkout. No real transaction will occur.</p>"
      );
    });

    $("#purchaseCard").on("input", function () {
      var digits = $(this).val().replace(/\D/g, "").slice(0, 16);
      $(this).val(digits.replace(/(.{4})/g, "$1 ").trim());
    });

    $("#purchaseExpiry").on("input", function () {
      var digits = $(this).val().replace(/\D/g, "").slice(0, 4);
      var formatted = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
      $(this).val(formatted);
    });

    $("#purchaseCvv").on("input", function () {
      $(this).val($(this).val().replace(/\D/g, "").slice(0, 4));
    });

    $("#purchaseForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;
      var cardDigits = $("#purchaseCard").val().replace(/\s/g, "");
      var expiry = $("#purchaseExpiry").val();
      var cvv = $("#purchaseCvv").val();

      if (!form.checkValidity() || cardDigits.length < 16 || !/^\d{2}\/\d{2}$/.test(expiry) || cvv.length < 3) {
        event.stopPropagation();
        $(form).addClass("was-validated");
        renderAlert("#purchaseFeedback", "danger", "Please review the highlighted billing fields before submitting.");
        return;
      }

      $(form).addClass("was-validated");
      renderAlert("#purchaseFeedback", "info", "Processing your enrollment...");

      simulateApi({ success: true }, 1200).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderAlert("#purchaseFeedback", "success", "Enrollment confirmed. A demo confirmation email has been queued successfully.");
      });
    });
  }

  function initLoginForm() {
    $("#loginForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderAlert("#loginFeedback", "danger", "Please enter a valid email and password to continue.");
        return;
      }

      $(form).addClass("was-validated");
      renderAlert("#loginFeedback", "info", "Signing you in...");

      simulateApi({ success: true }, 900).done(function () {
        renderAlert("#loginFeedback", "success", "Login successful. In a real app, you would now be redirected to your dashboard.");
      });
    });
  }

  function initPasswordToggles() {
    $("[data-password-toggle]").on("click", function () {
      var button = $(this);
      var input = $("#" + button.data("password-toggle"));
      var isPassword = input.attr("type") === "password";

      input.attr("type", isPassword ? "text" : "password");
      button.text(isPassword ? "Hide" : "Show");
      button.attr("aria-pressed", isPassword ? "true" : "false");
      button.attr("aria-label", (isPassword ? "Hide " : "Show ") + input.prev("label").text().toLowerCase());
    });
  }

  function initRegisterForm() {
    $("#registerForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;
      var password = $("#registerPassword").val();
      var confirmPassword = $("#registerConfirmPassword").val();

      if (password !== confirmPassword) {
        $("#registerConfirmPassword")[0].setCustomValidity("Passwords must match");
      } else {
        $("#registerConfirmPassword")[0].setCustomValidity("");
      }

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderAlert("#registerFeedback", "danger", "Please fix the highlighted fields before creating your account.");
        return;
      }

      $(form).addClass("was-validated");
      renderAlert("#registerFeedback", "info", "Creating your account...");

      simulateApi({ success: true }, 1100).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderAlert("#registerFeedback", "success", "Account created successfully. Your learner profile is ready.");
      });
    });
  }

  function initForgotPasswordForm() {
    $("#forgotPasswordForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderAlert("#forgotPasswordFeedback", "danger", "Please provide the email address for your account.");
        return;
      }

      $(form).addClass("was-validated");
      renderAlert("#forgotPasswordFeedback", "info", "Sending your reset link...");

      simulateApi({ success: true }, 800).done(function () {
        renderAlert("#forgotPasswordFeedback", "success", "Password reset instructions have been sent to your inbox in this demo flow.");
      });
    });
  }

  function initContactForm() {
    $("#contactForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderAlert("#contactFeedback", "danger", "Please complete the contact form before submitting.");
        return;
      }

      $(form).addClass("was-validated");
      renderAlert("#contactFeedback", "info", "Sending your message...");

      simulateApi({ success: true }, 1000).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderAlert("#contactFeedback", "success", "Thanks for reaching out. Our team will respond shortly.");
      });
    });
  }

  function initScrollToTop() {
    if (document.querySelector(".scroll-to-top")) {
      return;
    }

    var button = document.createElement("button");
    button.type = "button";
    button.className = "scroll-to-top";
    button.setAttribute("aria-label", "Scroll to top");
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 19V5"></path>' +
      '<path d="M5 12l7-7 7 7"></path>' +
      "</svg>";

    document.body.appendChild(button);

    function updateButton() {
      button.classList.toggle("is-visible", window.scrollY > 360);
    }

    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    window.addEventListener("scroll", updateButton, { passive: true });
    updateButton();
  }

  $(function () {
    loadSharedComponents();
    initHomeCourses();
    initCoursesPage();
    initCourseDetailsPage();
    initPurchasePage();
    initLoginForm();
    initPasswordToggles();
    initRegisterForm();
    initForgotPasswordForm();
    initContactForm();
    initStatCounters();
    renderTestimonialStars();
    initTitleAnimations();
    initContactSupportCards();
    initScrollToTop();
  });
})(jQuery);
