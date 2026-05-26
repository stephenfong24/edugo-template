(function ($) {
  "use strict";

  var courseCache = null;
  var demoUser = {
    fullName: "Guest Learner",
    email: "verylongemailaddress@exampledomain.com",
    initials: "GA",
    avatarUrl: "assets/sample-avatar.svg"
  };

  function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function loadSharedComponents() {
    var headerRequest = $("#site-header").load("partials/header.html?v=public-nav", function () {
      setActiveNav();
      initLanguageSwitcher();
      initMobileNavigation();
      initHeaderAuth();
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
      } else if (path.indexOf("my-learnings") === 0) {
        currentPage = "my-learnings";
      } else if (path.indexOf("my-certificates") === 0) {
        currentPage = "my-certificates";
      } else if (path.indexOf("purchase-history") === 0) {
        currentPage = "purchase-history";
      } else if (path.indexOf("profile") === 0 || path.indexOf("edit-profile") === 0) {
        currentPage = "profile";
      } else if (path.indexOf("change-password") === 0) {
        currentPage = "change-password";
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

  function getDemoSession() {
    try {
      return JSON.parse(window.localStorage.getItem("edugoDemoSession") || "null");
    } catch (error) {
      return null;
    }
  }

  function setDemoSession(user) {
    window.localStorage.setItem("edugoDemoSession", JSON.stringify(user || demoUser));
  }

  function clearDemoSession() {
    window.localStorage.removeItem("edugoDemoSession");
  }

  function isLoggedIn() {
    return Boolean(getDemoSession());
  }

  function initHeaderAuth() {
    var sessionUser = getDemoSession();
    var $authLinks = $(".header-auth-links, .header-auth-links-desktop");
    var $menus = $("[data-user-menu]");
    var $authNavItems = $("[data-auth-nav]");
    var $guestNavItems = $("[data-guest-nav]");

    if (!$menus.length) {
      return;
    }

    function closeMenus() {
      $menus.removeClass("is-open");
      $menus.find(".user-menu-trigger").attr("aria-expanded", "false");
      $menus.find(".user-menu-panel").attr("aria-hidden", "true");
    }

    function positionMobileUserMenu(isAuthenticated) {
      var $mobileNav = $(".edugo-mobile-nav");
      var $mobileMenu = $mobileNav.find(".user-menu.d-lg-none");
      var $navList = $mobileNav.find(".navbar-nav");
      var $actions = $mobileNav.find(".header-actions");

      if (!$mobileMenu.length || !$navList.length || !$actions.length) {
        return;
      }

      if (isAuthenticated) {
        $mobileMenu.insertBefore($navList);
      } else {
        $actions.append($mobileMenu);
      }
    }

    if (sessionUser) {
      $authLinks.attr("hidden", true).addClass("d-none");
      $authNavItems.removeAttr("hidden").removeClass("d-none");
      $guestNavItems.attr("hidden", true).addClass("d-none");
      $menus.each(function () {
        var $menu = $(this);
        $menu.prop("hidden", false).removeAttr("hidden");
        $menu.find(".user-avatar")
          .attr("src", sessionUser.avatarUrl || demoUser.avatarUrl)
          .attr("alt", sessionUser.fullName || demoUser.fullName);
        $menu.find(".user-menu-identity strong").text(sessionUser.fullName || demoUser.fullName);
        $menu.find(".user-menu-identity span").text(sessionUser.email || demoUser.email);
      });
      positionMobileUserMenu(true);
    } else {
      $(".header-auth-links").removeAttr("hidden").removeClass("d-none");
      $(".header-auth-links-desktop").removeAttr("hidden").addClass("d-none");
      $authNavItems.attr("hidden", true).addClass("d-none");
      $guestNavItems.removeAttr("hidden").removeClass("d-none");
      $menus.prop("hidden", true).attr("hidden", true).removeClass("is-open");
      positionMobileUserMenu(false);
    }

    $menus.find(".user-menu-trigger").off("click.userMenu").on("click.userMenu", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var $menu = $(this).closest("[data-user-menu]");
      var willOpen = !$menu.hasClass("is-open");
      closeMenus();
      $menu.toggleClass("is-open", willOpen);
      $(this).attr("aria-expanded", willOpen ? "true" : "false");
      $menu.find(".user-menu-panel").attr("aria-hidden", willOpen ? "false" : "true");
    });

    $menus.find("[data-logout]").off("click.userMenu").on("click.userMenu", function () {
      $("body").addClass("is-logging-out");
      clearDemoSession();
      closeMenus();
      initHeaderAuth();
      showInfoToast("You have been logged out.");
      window.setTimeout(function () {
        window.location.href = "login.html";
      }, 620);
    });

    $(document)
      .off("click.userMenu")
      .on("click.userMenu", function (event) {
        if (!$(event.target).closest("[data-user-menu]").length) {
          closeMenus();
        }
      })
      .off("keydown.userMenu")
      .on("keydown.userMenu", function (event) {
        if (event.key === "Escape") {
          closeMenus();
        }
      });
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
        showInfoToast("Language selected: " + getLanguageLabel(normalizedLanguage));
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

  var toastIconMap = {
    success: "check",
    error: "alert",
    warning: "warning",
    info: "info"
  };

  function escapeToastMessage(message) {
    return $("<div>").text(message || "").html();
  }

  function getToastMarkup(type, message) {
    var icon = toastIconMap[type] || toastIconMap.info;

    return (
      '<div class="edugo-toast__content">' +
        '<span class="edugo-toast__icon edugo-toast__icon--' + icon + '" aria-hidden="true"></span>' +
        '<span class="edugo-toast__message">' + escapeToastMessage(message) + "</span>" +
      "</div>"
    );
  }

  function showToast(type, message, options) {
    var normalizedType = type === "success" || type === "error" || type === "warning" || type === "info" ? type : "info";
    var toastOptions = $.extend({
      duration: normalizedType === "info" ? 2600 : 3400
    }, options || {});

    if (typeof window.Toastify === "function") {
      window.Toastify({
        text: getToastMarkup(normalizedType, message),
        duration: toastOptions.duration,
        gravity: "top",
        position: "right",
        close: true,
        stopOnFocus: true,
        escapeMarkup: false,
        className: "edugo-toast edugo-toast--" + normalizedType
      }).showToast();
      return;
    }

    showFallbackToast(normalizedType, message, toastOptions.duration);
  }

  function showFallbackToast(type, message, duration) {
    var $stack = $("#edugoToastFallback");

    if (!$stack.length) {
      $stack = $('<div id="edugoToastFallback" class="edugo-toast-fallback" aria-live="polite" aria-atomic="false"></div>');
      $("body").append($stack);
    }

    var $toast = $('<div class="edugo-toast edugo-toast--' + type + '"></div>').html(getToastMarkup(type, message));
    var $close = $('<button type="button" class="toast-close" aria-label="Close">&times;</button>');
    $toast.append($close);
    $stack.append($toast);

    window.setTimeout(function () {
      $toast.addClass("on");
    }, 20);

    function dismissToast() {
      $toast.removeClass("on").addClass("edugo-toast--leaving");
      window.setTimeout(function () {
        $toast.remove();
      }, 260);
    }

    $close.on("click", dismissToast);
    window.setTimeout(dismissToast, duration || 3200);
  }

  function showSuccessToast(message) {
    showToast("success", message);
  }

  function showErrorToast(message) {
    showToast("error", message);
  }

  function showWarningToast(message) {
    showToast("warning", message);
  }

  function showInfoToast(message) {
    showToast("info", message);
  }

  window.showSuccessToast = showSuccessToast;
  window.showErrorToast = showErrorToast;
  window.showWarningToast = showWarningToast;
  window.showInfoToast = showInfoToast;

  function renderToastFeedback(targetSelector, type, message) {
    $(targetSelector).empty();

    if (type === "success") {
      showSuccessToast(message);
    } else if (type === "danger" || type === "error") {
      showErrorToast(message);
    } else if (type === "warning") {
      showWarningToast(message);
    } else {
      showInfoToast(message);
    }
  }

  function getFieldLabel(field) {
    var $field = $(field);
    var fieldId = $field.attr("id");
    var labelText = fieldId ? $('label[for="' + fieldId + '"]').first().text() : "";

    return $.trim(labelText || $field.attr("name") || "this field");
  }

  function getInvalidFormMessage(form, fallbackMessage) {
    var invalidField = $(form).find(":input").filter(function () {
      return this.willValidate && !this.validity.valid;
    }).first()[0];

    if (!invalidField) {
      return fallbackMessage;
    }

    var label = getFieldLabel(invalidField).replace(/\s+/g, " ");
    var validity = invalidField.validity;
    var feedbackMessage = $(invalidField).siblings(".invalid-feedback").first().text();

    if (validity.valueMissing) {
      return invalidField.type === "checkbox" && feedbackMessage ? feedbackMessage : "Please enter your " + label.toLowerCase() + ".";
    }

    if (validity.typeMismatch && invalidField.type === "email") {
      return "Please enter a valid email address.";
    }

    if (validity.tooShort) {
      return label + " must be at least " + invalidField.minLength + " characters.";
    }

    if (validity.customError) {
      return invalidField.validationMessage || fallbackMessage;
    }

    return feedbackMessage || fallbackMessage;
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

  function applyReadonlyBarRating($rating, rating) {
    if (!$rating.length || !$.fn.barrating || $rating.data("ratingInitialized")) {
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
      .data("ratingInitialized", true)
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
  }

  function initCourseRatings(context) {
    var $context = context ? $(context) : $(document);
    var $ratings = $context.find(".course-rating-select").addBack(".course-rating-select");

    $ratings.each(function () {
      var $rating = $(this);
      var rating = formatCourseRating($rating.data("rating"));

      applyReadonlyBarRating($rating, rating);
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

    getCourses()
      .done(function (courses) {
        featuredTarget.html(courses.map(function (course) {
          return createCourseCard(course, "featured-slide");
        }).join(""));
        initCourseRatings(featuredTarget);
        initFeaturedCoursesSlider();
      })
      .fail(function () {
        showErrorToast("Unable to load featured courses. Please try again.");
      });
  }

  function initHomeAnnouncements() {
    if ($("body").data("page") !== "home" || typeof bootstrap === "undefined") {
      return;
    }

    var imageModalElement = document.getElementById("imageAnnouncementModal");
    var normalModalElement = document.getElementById("normalAnnouncementModal");

    if (!imageModalElement || !normalModalElement || imageModalElement.dataset.announcementInitialized) {
      return;
    }

    imageModalElement.dataset.announcementInitialized = "true";

    var imageModal = bootstrap.Modal.getOrCreateInstance(imageModalElement, {
      backdrop: true,
      keyboard: true,
      focus: true
    });
    var normalModal = bootstrap.Modal.getOrCreateInstance(normalModalElement, {
      backdrop: true,
      keyboard: true,
      focus: true
    });
    var shouldOpenNormalAnnouncement = false;

    function showNormalAnnouncement() {
      if (!$(normalModalElement).hasClass("show")) {
        normalModal.show();
      }
    }

    function updateAnnouncementLock() {
      var isAnnouncementOpen = $(imageModalElement).hasClass("show") || $(normalModalElement).hasClass("show");
      document.documentElement.classList.toggle("announcement-modal-open", isAnnouncementOpen);
      document.body.classList.toggle("announcement-modal-open", isAnnouncementOpen);
    }

    $(imageModalElement).on("shown.bs.modal", function () {
      shouldOpenNormalAnnouncement = true;
      updateAnnouncementLock();
    });

    $(imageModalElement).on("click", ".modal-content", function (event) {
      if ($(event.target).closest(".image-announcement-close").length) {
        return;
      }

      imageModal.hide();
    });

    $(imageModalElement).on("hidden.bs.modal", function () {
      updateAnnouncementLock();
      if (shouldOpenNormalAnnouncement) {
        shouldOpenNormalAnnouncement = false;
        window.setTimeout(showNormalAnnouncement, 120);
      }
    });

    $(normalModalElement).on("shown.bs.modal hidden.bs.modal", updateAnnouncementLock);

    $(normalModalElement).on("show.bs.modal", function () {
      if ($(imageModalElement).hasClass("show")) {
        shouldOpenNormalAnnouncement = false;
        imageModal.hide();
      }
    });

    window.setTimeout(function () {
      imageModal.show();
    }, 350);
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
      var rating = formatCourseRating($rating.data("rating"));
      var options = "";

      if ($rating.data("ratingInitialized")) {
        return;
      }

      for (var value = 0.5; value <= 5; value += 0.5) {
        var optionValue = value.toFixed(1);
        options += '<option value="' + optionValue + '"' + (optionValue === rating ? " selected" : "") + ">" + optionValue + "</option>";
      }

      $rating
        .addClass("course-rating-display testimonial-rating-display")
        .data("ratingInitialized", true)
        .attr("aria-label", "Rated " + rating + " out of 5")
        .html('<select class="testimonial-rating-select" data-rating="' + rating + '" tabindex="-1" aria-hidden="true">' + options + "</select>");

      applyReadonlyBarRating($rating.find(".testimonial-rating-select"), rating);
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
    }).fail(function () {
      showErrorToast("Unable to load courses. Please refresh and try again.");
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
                '<a class="btn btn-brand btn-lg w-100 mb-3" href="purchase.html?id=' + course.id + '" data-course-purchase-link>Enroll Now</a>' +
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
        showErrorToast("Course details could not be loaded.");
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
    var queuedPurchaseToast = window.sessionStorage.getItem("edugoPurchaseToast");

    if (queuedPurchaseToast) {
      window.sessionStorage.removeItem("edugoPurchaseToast");
      showInfoToast(queuedPurchaseToast);
    }

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
    }).fail(function () {
      showErrorToast("Unable to load the order summary. Please try again.");
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
      $("#purchaseCard")[0].setCustomValidity(cardDigits.length < 16 ? "Please enter a valid card number." : "");
      $("#purchaseExpiry")[0].setCustomValidity(/^\d{2}\/\d{2}$/.test(expiry) ? "" : "Please enter the card expiry.");
      $("#purchaseCvv")[0].setCustomValidity(cvv.length < 3 ? "Please enter the CVV." : "");

      if (!form.checkValidity()) {
        event.stopPropagation();
        $(form).addClass("was-validated");
        renderToastFeedback("#purchaseFeedback", "danger", getInvalidFormMessage(form, "Please review the highlighted billing fields before submitting."));
        return;
      }

      $(form).addClass("was-validated");
      renderToastFeedback("#purchaseFeedback", "info", "Processing your enrollment...");

      simulateApi({ success: true }, 1200).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderToastFeedback("#purchaseFeedback", "success", "Enrollment confirmed. Your course access is ready.");
      });
    });
  }

  function initLoginForm() {
    $("#loginForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;
      var $form = $(form);
      var $button = $form.find(".login-submit-button");
      var username = $.trim($("#loginUsername").val());
      var password = $("#loginPassword").val();

      if (!form.checkValidity()) {
        $form.addClass("was-validated");
        renderToastFeedback("#loginFeedback", "danger", getInvalidFormMessage(form, "Please enter your guest credentials to continue."));
        return;
      }

      if (username !== "guest" || password !== "guest") {
        $form.addClass("was-validated");
        renderToastFeedback("#loginFeedback", "danger", "Use username guest and password guest for this demo.");
        return;
      }

      $form.addClass("was-validated is-processing");
      $button.prop("disabled", true).addClass("is-loading");
      $form.find(":input").not($button).prop("disabled", true);
      renderToastFeedback("#loginFeedback", "info", "Signing you in...");

      simulateApi({ success: true }, 1050).done(function () {
        setDemoSession(demoUser);
        initHeaderAuth();
        $button.removeClass("is-loading").addClass("is-success");
        $form.removeClass("is-processing").addClass("is-success");
        $(".login-auth-card").addClass("login-success-state");
        renderToastFeedback("#loginFeedback", "success", "Login successful. Taking you to courses...");
        window.setTimeout(function () {
          window.location.href = "courses.html";
        }, 850);
      });
    });
  }

  function getLearningItems(courses) {
    return [
      {
        course: courses[1],
        progress: 72,
        nextLesson: "Dashboard design and KPI monitoring",
        pace: "3 lessons left this week"
      },
      {
        course: courses[0],
        progress: 46,
        nextLesson: "Experience mapping and service blueprints",
        pace: "Resume module 3"
      },
      {
        course: courses[4],
        progress: 28,
        nextLesson: "Feature scoping and validation",
        pace: "New project unlocked"
      }
    ].filter(function (item) {
      return item.course;
    });
  }

  function renderDashboardSkeleton(target, count) {
    var markup = "";
    for (var i = 0; i < count; i += 1) {
      markup +=
        '<div class="learning-skeleton-card">' +
          '<span class="skeleton-line skeleton-image"></span>' +
          '<span class="skeleton-line skeleton-title"></span>' +
          '<span class="skeleton-line skeleton-text"></span>' +
          '<span class="skeleton-line skeleton-button"></span>' +
        "</div>";
    }
    target.html(markup);
  }

  function initMyLearningsPage() {
    var $grid = $("#myLearningGrid");
    if (!$grid.length) {
      return;
    }

    renderDashboardSkeleton($grid, 3);

    getCourses().done(function (courses) {
      var items = getLearningItems(courses);

      window.setTimeout(function () {
        if (!items.length) {
          $("#myLearningEmpty").removeClass("d-none");
          $grid.empty();
          return;
        }

        $("#myLearningEmpty").addClass("d-none");
        $grid.html(items.map(function (item) {
          var course = item.course;
          return (
            '<article class="learning-card">' +
              '<div class="learning-card-media"><img src="' + course.image + '" alt="' + course.title + '"></div>' +
              '<div class="learning-card-body">' +
                '<div class="learning-card-topline">' +
                  '<span>' + course.category + '</span>' +
                  '<strong>' + item.progress + '%</strong>' +
                "</div>" +
                '<h2>' + course.title + "</h2>" +
                '<p>' + course.summary + "</p>" +
                '<div class="learning-progress" aria-label="' + item.progress + '% complete">' +
                  '<span style="width: ' + item.progress + '%"></span>' +
                "</div>" +
                '<div class="learning-card-meta">' +
                  '<span>' + item.nextLesson + "</span>" +
                  '<small>' + item.pace + "</small>" +
                "</div>" +
                '<a class="btn btn-brand w-100" href="course-details.html?id=' + course.id + '">Continue Learning</a>' +
              "</div>" +
            "</article>"
          );
        }).join(""));
      }, 520);
    }).fail(function () {
      showErrorToast("Unable to load your learning dashboard.");
    });
  }

  function initMyCertificatesPage() {
    var $grid = $("#certificateGrid");
    if (!$grid.length) {
      return;
    }

    renderDashboardSkeleton($grid, 2);

    getCourses().done(function (courses) {
      var completed = [courses[2], courses[5], courses[0], courses[1]].filter(Boolean);
      var issueDates = ["18 Apr 2026", "02 May 2026", "14 May 2026", "22 May 2026"];

      window.setTimeout(function () {
        if (!completed.length) {
          $("#certificateEmpty").removeClass("d-none");
          $grid.empty();
          return;
        }

        $("#certificateEmpty").addClass("d-none");
        $grid.html(completed.map(function (course, index) {
          var issueDate = issueDates[index];
          var certificateImage = getSampleCertificateImage(course, issueDate, index);
          return (
            '<article class="certificate-card">' +
              '<div class="certificate-card-pattern" aria-hidden="true"></div>' +
              '<div class="certificate-preview">' +
                '<img src="' + certificateImage + '" alt="Sample certificate for ' + course.title + '">' +
              "</div>" +
              '<div class="certificate-card-content">' +
                '<span class="certificate-label">Verified Certificate</span>' +
                '<h2>' + course.title + "</h2>" +
                '<p>Completed by Guest Learner</p>' +
                '<div class="certificate-meta">' +
                  '<span><strong>Course</strong>' + course.category + "</span>" +
                  '<span><strong>Issued</strong>' + issueDate + "</span>" +
                "</div>" +
                '<button class="btn btn-outline-dark w-100" type="button" data-certificate-download>Download Certificate</button>' +
              "</div>" +
            "</article>"
          );
        }).join(""));
      }, 520);
    }).fail(function () {
      showErrorToast("Unable to load certificates.");
    });

    $grid.on("click", "[data-certificate-download]", function () {
      showSuccessToast("Certificate download prepared for this demo.");
    });
  }

  function getSampleCertificateImage(course, issueDate, index) {
    var palette = index % 2 === 0
      ? { accent: "#059669", soft: "#ecfdf5", ink: "#0f172a" }
      : { accent: "#2563eb", soft: "#eff6ff", ink: "#111827" };
    var title = course.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var category = course.category.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">' +
        '<rect width="960" height="640" rx="42" fill="#ffffff"/>' +
        '<rect x="28" y="28" width="904" height="584" rx="32" fill="' + palette.soft + '" stroke="' + palette.accent + '" stroke-opacity="0.22" stroke-width="2"/>' +
        '<rect x="62" y="62" width="836" height="516" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>' +
        '<path d="M102 174H858M102 466H858" stroke="' + palette.accent + '" stroke-opacity="0.22" stroke-width="2"/>' +
        '<circle cx="480" cy="132" r="46" fill="' + palette.accent + '" fill-opacity="0.12"/>' +
        '<circle cx="480" cy="132" r="30" fill="' + palette.accent + '"/>' +
        '<path d="M468 132l9 9 17-20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="480" y="224" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="' + palette.accent + '" letter-spacing="4">CERTIFICATE OF COMPLETION</text>' +
        '<text x="480" y="286" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="54" font-weight="800" fill="' + palette.ink + '">Guest Learner</text>' +
        '<text x="480" y="335" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#64748b">has successfully completed</text>' +
        '<text x="480" y="392" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="38" font-weight="800" fill="' + palette.ink + '">' + title + '</text>' +
        '<text x="480" y="436" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="' + palette.accent + '">' + category + ' Program</text>' +
        '<text x="188" y="528" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="' + palette.ink + '">EduGo Academy</text>' +
        '<text x="188" y="554" font-family="Inter, Arial, sans-serif" font-size="15" fill="#64748b">Verified credential</text>' +
        '<text x="772" y="528" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="' + palette.ink + '">' + issueDate + '</text>' +
        '<text x="772" y="554" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" fill="#64748b">Issue date</text>' +
      "</svg>";

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function getProfileUser() {
    return $.extend({
      fullName: demoUser.fullName,
      email: demoUser.email,
      initials: demoUser.initials,
      avatarUrl: demoUser.avatarUrl,
      phone: "+1 (555) 018-2049",
      company: "EduGo Labs",
      occupation: "Learning Experience Manager",
      gender: "Prefer not to say",
      dob: "12 Aug 1994",
      country: "Malaysia",
      address: "Level 8, Menara Learning, Kuala Lumpur",
      status: "Active",
      joinedDate: "May 2026"
    }, getDemoSession() || {});
  }

  function getInitials(name) {
    return $.trim(name || "")
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("") || demoUser.initials;
  }

  function initProfilePage() {
    var $form = $("#profileForm");
    var hasProfileSurface = $("#profileDisplayName, #profileInfoName, #profileForm").length;
    if (!hasProfileSurface) {
      return;
    }

    var user = getProfileUser();
    $("#profileAvatarInitials, #profileMiniAvatar").attr("src", user.avatarUrl || demoUser.avatarUrl).attr("alt", user.fullName);
    $("#profileDisplayName").text(user.fullName);
    $("#profileDisplayEmail").text(user.email);
    $("#profileStatus").text(user.status);
    $("#profileJoined").text(user.joinedDate);
    $("#profileCompanyDisplay").text(user.company);
    $("#profileOccupationDisplay").text(user.occupation);
    $("#profileInfoName").text(user.fullName);
    $("#profileInfoEmail").text(user.email);
    $("#profileInfoPhone").text(user.phone);
    $("#profileInfoGender").text(user.gender);
    $("#profileInfoDob").text(user.dob);
    $("#profileInfoCountry").text(user.country);
    $("#profileInfoAddress").text(user.address);
    if ($form.length) {
      $("#profileFullName").val(user.fullName);
      $("#profileEmail").val(user.email);
      $("#profilePhone").val(user.phone);
      $("#profileCompany").val(user.company);
      $("#profileOccupation").val(user.occupation);
      $("#profileGender").val(user.gender);
      $("#profileDob").val(user.dob);
      $("#profileCountry").val(user.country);
      $("#profileAddress").val(user.address);
    }
    window.setTimeout(function () {
      $(".profile-shell").removeClass("is-loading");
    }, 420);

    $("#changeAvatarButton").on("click", function () {
      $("#profileAvatarInitials, #profileMiniAvatar").addClass("avatar-refresh");
      window.setTimeout(function () {
        $("#profileAvatarInitials, #profileMiniAvatar").removeClass("avatar-refresh");
      }, 520);
      showInfoToast("Avatar change simulated for this demo.");
    });

    if (!$form.length) {
      return;
    }

    $form.on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderToastFeedback("#profileFeedback", "danger", getInvalidFormMessage(form, "Please review your profile details."));
        return;
      }

      var updatedUser = $.extend({}, getProfileUser(), {
        fullName: $.trim($("#profileFullName").val()),
        email: $.trim($("#profileEmail").val()),
        phone: $.trim($("#profilePhone").val()),
        company: $.trim($("#profileCompany").val()),
        occupation: $.trim($("#profileOccupation").val()),
        gender: $("#profileGender").val(),
        dob: $.trim($("#profileDob").val()),
        country: $.trim($("#profileCountry").val()),
        address: $.trim($("#profileAddress").val())
      });
      updatedUser.initials = getInitials(updatedUser.fullName);
      updatedUser.avatarUrl = updatedUser.avatarUrl || demoUser.avatarUrl;
      setDemoSession(updatedUser);
      initHeaderAuth();
      $("#profileAvatarInitials, #profileMiniAvatar").attr("src", updatedUser.avatarUrl).attr("alt", updatedUser.fullName);
      $("#profileDisplayName").text(updatedUser.fullName);
      $("#profileDisplayEmail").text(updatedUser.email);
      $("#profileCompanyDisplay").text(updatedUser.company);
      $("#profileOccupationDisplay").text(updatedUser.occupation);
      $("#profileInfoName").text(updatedUser.fullName);
      $("#profileInfoEmail").text(updatedUser.email);
      $("#profileInfoPhone").text(updatedUser.phone);
      $("#profileInfoGender").text(updatedUser.gender);
      $("#profileInfoDob").text(updatedUser.dob);
      $("#profileInfoCountry").text(updatedUser.country);
      $("#profileInfoAddress").text(updatedUser.address);
      renderToastFeedback("#profileFeedback", "success", "Profile changes saved for this demo.");
      window.setTimeout(function () {
        window.location.href = "profile.html";
      }, 850);
    });
  }

  function getPasswordStrength(password) {
    var score = 0;
    if (password.length >= 8) {
      score += 1;
    }
    if (/[A-Z]/.test(password)) {
      score += 1;
    }
    if (/[0-9]/.test(password)) {
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }
    return score;
  }

  function initChangePasswordPage() {
    var $form = $("#changePasswordForm");
    if (!$form.length) {
      return;
    }

    var $newPassword = $("#newPassword");
    var $confirmPassword = $("#confirmNewPassword");
    var $strength = $("#passwordStrengthBar");
    var $strengthLabel = $("#passwordStrengthLabel");

    function updateStrength() {
      var password = $newPassword.val();
      var score = getPasswordStrength(password);
      var labels = ["Too weak", "Weak", "Good", "Strong", "Excellent"];
      var classes = ["is-empty", "is-weak", "is-fair", "is-good", "is-strong"];
      var percent = password ? Math.max(score, 1) * 25 : 0;

      $strength
        .removeClass(classes.join(" "))
        .addClass(classes[password ? score : 0])
        .css("width", percent + "%");
      $strengthLabel.text(password ? labels[score] : "Enter a new password");

      $("[data-password-rule]").each(function () {
        var rule = $(this).data("passwordRule");
        var passes = false;
        if (rule === "length") {
          passes = password.length >= 8;
        } else if (rule === "uppercase") {
          passes = /[A-Z]/.test(password);
        } else if (rule === "number") {
          passes = /[0-9]/.test(password);
        } else if (rule === "symbol") {
          passes = /[^A-Za-z0-9]/.test(password);
        }
        $(this).toggleClass("is-met", passes);
      });
    }

    $newPassword.on("input", updateStrength);
    updateStrength();

    $form.on("submit", function (event) {
      event.preventDefault();
      var form = this;
      var currentPassword = $("#currentPassword").val();
      var newPassword = $newPassword.val();
      var confirmPassword = $confirmPassword.val();

      $("#currentPassword")[0].setCustomValidity(currentPassword === "guest" ? "" : "Use guest as the current password in this demo.");
      $newPassword[0].setCustomValidity(getPasswordStrength(newPassword) < 3 ? "Choose a stronger password." : "");
      $confirmPassword[0].setCustomValidity(newPassword === confirmPassword ? "" : "Passwords must match.");

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderToastFeedback("#changePasswordFeedback", "danger", getInvalidFormMessage(form, "Please fix the highlighted password fields."));
        return;
      }

      $(form).addClass("was-validated is-processing");
      renderToastFeedback("#changePasswordFeedback", "info", "Updating your password...");
      simulateApi({ success: true }, 850).done(function () {
        form.reset();
        $(form).removeClass("was-validated is-processing");
        updateStrength();
        renderToastFeedback("#changePasswordFeedback", "success", "Password updated successfully for this demo.");
      });
    });
  }

  function initCourseActionToasts() {
    $(document).on("click", 'a[href*="purchase.html"][data-course-purchase-link], .course-card-actions a[href*="purchase.html"]', function () {
      window.sessionStorage.setItem("edugoPurchaseToast", "Course added to cart.");
    });
  }

  function initPasswordToggles() {
    var passwordVisibleIcon =
      '<svg class="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z"></path>' +
      '<circle cx="12" cy="12" r="2.75"></circle>' +
      "</svg>";
    var passwordHiddenIcon =
      '<svg class="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M3 3l18 18"></path>' +
      '<path d="M10.58 10.58a2.75 2.75 0 0 0 3.89 3.89"></path>' +
      '<path d="M9.18 5.98A9.72 9.72 0 0 1 12 5.75c6.25 0 9.75 6.25 9.75 6.25a17.02 17.02 0 0 1-3.22 3.72"></path>' +
      '<path d="M6.5 7.5A16.77 16.77 0 0 0 2.25 12S5.75 18.25 12 18.25c1.03 0 2-.17 2.9-.46"></path>' +
      "</svg>";

    $("[data-password-toggle]").each(function () {
      var button = $(this);
      var input = $("#" + button.data("password-toggle"));
      if (!button.html()) {
        button.html(passwordVisibleIcon);
      }
      button.attr("aria-label", "Show " + input.siblings("label").text().toLowerCase());
    });

    $("[data-password-toggle]").on("click", function () {
      var button = $(this);
      var input = $("#" + button.data("password-toggle"));
      var isPassword = input.attr("type") === "password";

      input.attr("type", isPassword ? "text" : "password");
      button.html(isPassword ? passwordHiddenIcon : passwordVisibleIcon);
      button.attr("aria-pressed", isPassword ? "true" : "false");
      button.attr("aria-label", (isPassword ? "Hide " : "Show ") + input.siblings("label").text().toLowerCase());
    });
  }

  function initRegisterForm() {
    var otpTimerId = null;
    var otpSecondsRemaining = 0;
    var otpButton = $("#requestOtpButton");

    function updateOtpButton() {
      if (otpSecondsRemaining > 0) {
        otpButton.prop("disabled", true).text(otpSecondsRemaining + "s");
        return;
      }

      otpButton.prop("disabled", false).text("Request");
    }

    otpButton.on("click", function () {
      if (otpSecondsRemaining > 0) {
        return;
      }

      otpSecondsRemaining = 60;
      updateOtpButton();

      otpTimerId = window.setInterval(function () {
        otpSecondsRemaining -= 1;

        if (otpSecondsRemaining <= 0) {
          window.clearInterval(otpTimerId);
          otpTimerId = null;
          otpSecondsRemaining = 0;
        }

        updateOtpButton();
      }, 1000);

      renderToastFeedback("#registerFeedback", "info", "OTP request sent. Please check your email.");
    });

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
        renderToastFeedback("#registerFeedback", "danger", getInvalidFormMessage(form, "Please fix the highlighted fields before creating your account."));
        return;
      }

      $(form).addClass("was-validated");
      renderToastFeedback("#registerFeedback", "info", "Creating your account...");

      simulateApi({ success: true }, 1100).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderToastFeedback("#registerFeedback", "success", "Account created successfully. Your learner profile is ready.");
      });
    });
  }

  function initForgotPasswordForm() {
    var otpTimerId = null;
    var otpSecondsRemaining = 0;
    var otpButton = $("#forgotRequestOtpButton");

    function updateOtpButton() {
      if (otpSecondsRemaining > 0) {
        otpButton.prop("disabled", true).text(otpSecondsRemaining + "s");
        return;
      }

      otpButton.prop("disabled", false).text("Request");
    }

    otpButton.on("click", function () {
      if (otpSecondsRemaining > 0) {
        return;
      }

      otpSecondsRemaining = 60;
      updateOtpButton();

      otpTimerId = window.setInterval(function () {
        otpSecondsRemaining -= 1;

        if (otpSecondsRemaining <= 0) {
          window.clearInterval(otpTimerId);
          otpTimerId = null;
          otpSecondsRemaining = 0;
        }

        updateOtpButton();
      }, 1000);

      renderToastFeedback("#forgotPasswordFeedback", "info", "OTP request sent. Please check your email.");
    });

    $("#forgotPasswordForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderToastFeedback("#forgotPasswordFeedback", "danger", getInvalidFormMessage(form, "Please provide your email address and OTP."));
        return;
      }

      $(form).addClass("was-validated");
      renderToastFeedback("#forgotPasswordFeedback", "info", "Sending your reset link...");

      simulateApi({ success: true }, 800).done(function () {
        renderToastFeedback("#forgotPasswordFeedback", "success", "Password reset instructions have been sent to your inbox in this demo flow.");
      });
    });
  }

  function initContactForm() {
    $("#contactForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      if (!form.checkValidity()) {
        $(form).addClass("was-validated");
        renderToastFeedback("#contactFeedback", "danger", getInvalidFormMessage(form, "Please complete the contact form before submitting."));
        return;
      }

      $(form).addClass("was-validated");
      renderToastFeedback("#contactFeedback", "info", "Sending your message...");

      simulateApi({ success: true }, 1000).done(function () {
        form.reset();
        $(form).removeClass("was-validated");
        renderToastFeedback("#contactFeedback", "success", "Thanks for reaching out. Our team will respond shortly.");
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
    initHomeAnnouncements();
    initHomeCourses();
    initCoursesPage();
    initCourseDetailsPage();
    initMyLearningsPage();
    initMyCertificatesPage();
    initProfilePage();
    initChangePasswordPage();
    initPurchasePage();
    initLoginForm();
    initPasswordToggles();
    initRegisterForm();
    initForgotPasswordForm();
    initContactForm();
    initCourseActionToasts();
    initStatCounters();
    renderTestimonialStars();
    initTitleAnimations();
    initContactSupportCards();
    initScrollToTop();
  });
})(jQuery);
