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

  function ensureFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"][rel="stylesheet"]')) {
      return;
    }

    var fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
    document.head.appendChild(fontAwesome);
  }

  function loadSharedComponents() {
    ensureFontAwesome();

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
    var $mobileLogout = $("[data-mobile-logout]");

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
      $mobileLogout.prop("hidden", false).removeAttr("hidden");
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
      $mobileLogout.prop("hidden", true).attr("hidden", true);
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

    $("[data-logout]").off("click.userMenu").on("click.userMenu", function () {
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
    var lockedScrollY = 0;
    var pendingLockScrollY = 0;
    var lastKnownScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    var toggler = document.querySelector(".site-header .navbar-toggler");

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
      if (isOpen) {
        lockedScrollY = pendingLockScrollY || lastKnownScrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        pendingLockScrollY = 0;
        document.documentElement.classList.add("edugo-mobile-nav-lock");
        document.body.classList.add("edugo-mobile-nav-lock");
        document.body.style.top = "-" + lockedScrollY + "px";
      } else {
        document.documentElement.classList.remove("edugo-mobile-nav-lock");
        document.body.classList.remove("edugo-mobile-nav-lock");
        document.body.style.top = "";
        window.scrollTo(0, lockedScrollY);
      }

      document.body.classList.toggle("edugo-mobile-nav-open", isOpen);
    }

    function preventBackgroundScroll(event) {
      if (!document.body.classList.contains("edugo-mobile-nav-lock")) {
        return;
      }

      if (event.target && event.target.closest && event.target.closest(".edugo-mobile-nav")) {
        return;
      }

      event.preventDefault();
    }

    nav.addEventListener("show.bs.collapse", function () {
      moveNavToBody();
      setNavState(true);
    });

    if (toggler) {
      ["touchstart", "pointerdown", "mousedown"].forEach(function (eventName) {
        toggler.addEventListener(eventName, function () {
          pendingLockScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        }, { passive: true });
      });
    }

    window.addEventListener("scroll", function () {
      if (!document.body.classList.contains("edugo-mobile-nav-lock")) {
        lastKnownScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      }
    }, { passive: true });

    nav.addEventListener("hide.bs.collapse", function () {
      document.body.classList.remove("edugo-mobile-nav-open");
    });

    nav.addEventListener("hidden.bs.collapse", function () {
      setNavState(false);
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

    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
      var appliedFilters = {
        category: "",
        minPrice: "",
        maxPrice: ""
      };
      var draftFilters = $.extend({}, appliedFilters);
      var $filterToggle = $("#courseFilterToggle");
      var $filterCount = $("#courseFilterCount");
      var $categoryOptions = $("#courseCategoryOptions");
      var $minPrice = $("#courseMinPrice");
      var $maxPrice = $("#courseMaxPrice");
      var courseFilterModal = document.getElementById("courseFilterModal");
      var bootstrapFilterModal = courseFilterModal && window.bootstrap ? bootstrap.Modal.getOrCreateInstance(courseFilterModal) : null;
      var prices = courses.map(function (course) {
        return Number(course.price) || 0;
      });
      var minAvailablePrice = prices.length ? Math.min.apply(null, prices) : 0;
      var maxAvailablePrice = prices.length ? Math.max.apply(null, prices) : 0;

      function getCourseCategories() {
        return courses.reduce(function (categories, course) {
          if (course.category && categories.indexOf(course.category) === -1) {
            categories.push(course.category);
          }
          return categories;
        }, []).sort();
      }

      function normalizePrice(value) {
        if (value === "" || value === null || typeof value === "undefined") {
          return "";
        }
        var parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : "";
      }

      function renderCategoryOptions() {
        if (!$categoryOptions.length) {
          return;
        }

        var options = ["All"].concat(getCourseCategories());
        $categoryOptions.html(options.map(function (category) {
          var value = category === "All" ? "" : category;
          var optionId = "course-filter-category-" + (value || "all").toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            '<input class="filter-option-input" type="radio" name="courseFilterCategory" id="' + optionId + '" value="' + value + '"' + (value === draftFilters.category ? " checked" : "") + ">" +
            '<label class="filter-option-pill" for="' + optionId + '">' + category + "</label>"
          );
        }).join(""));
      }

      function syncDraftControls() {
        draftFilters = $.extend({}, appliedFilters);
        renderCategoryOptions();
        $minPrice.val(draftFilters.minPrice);
        $maxPrice.val(draftFilters.maxPrice);
      }

      function getActiveFilterCount() {
        var count = 0;
        if (appliedFilters.category) {
          count += 1;
        }
        if (appliedFilters.minPrice !== "" || appliedFilters.maxPrice !== "") {
          count += 1;
        }
        return count;
      }

      function updateFilterButtonState() {
        var count = getActiveFilterCount();
        $filterToggle.toggleClass("is-active", count > 0);
        $filterCount.toggleClass("d-none", count === 0).text(count);
      }

      function getFilteredCourses() {
        var keyword = ($("#courseSearch").val() || "").toLowerCase().trim();
        var category = appliedFilters.category;
        var minPrice = normalizePrice(appliedFilters.minPrice);
        var maxPrice = normalizePrice(appliedFilters.maxPrice);

        if (minPrice !== "" && maxPrice !== "" && minPrice > maxPrice) {
          var swapPrice = minPrice;
          minPrice = maxPrice;
          maxPrice = swapPrice;
        }

        return courses.filter(function (course) {
          var coursePrice = Number(course.price) || 0;
          var haystack = [course.title, course.category, course.summary, course.skills.join(" ")].join(" ").toLowerCase();
          var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
          var categoryMatch = !category || course.category === category;
          var minPriceMatch = minPrice === "" || coursePrice >= minPrice;
          var maxPriceMatch = maxPrice === "" || coursePrice <= maxPrice;
          return keywordMatch && categoryMatch && minPriceMatch && maxPriceMatch;
        });
      }

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
        var filtered = getFilteredCourses();

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
        $(".course-filter-meta").toggleClass("d-none", filtered.length < 1);
        buildPagination(totalPages);
        updateFilterButtonState();
      }

      $minPrice.attr("placeholder", "RM " + minAvailablePrice);
      $maxPrice.attr("placeholder", "RM " + maxAvailablePrice);
      renderCategoryOptions();
      renderList();
      $("#courseSearch").on("input", function () {
        currentPage = 1;
        renderList();
      });
      if (courseFilterModal) {
        courseFilterModal.addEventListener("show.bs.modal", syncDraftControls);
      }
      $categoryOptions.on("change", 'input[name="courseFilterCategory"]', function () {
        draftFilters.category = $(this).val();
      });
      $minPrice.add($maxPrice).on("input", function () {
        draftFilters.minPrice = $minPrice.val();
        draftFilters.maxPrice = $maxPrice.val();
      });
      $("#courseFilterReset").on("click", function () {
        appliedFilters = {
          category: "",
          minPrice: "",
          maxPrice: ""
        };
        syncDraftControls();
        currentPage = 1;
        renderList();
        if (bootstrapFilterModal) {
          bootstrapFilterModal.hide();
        }
      });
      $("#courseFilterApply").on("click", function () {
        appliedFilters = {
          category: $categoryOptions.find('input[name="courseFilterCategory"]:checked').val() || "",
          minPrice: normalizePrice($minPrice.val()),
          maxPrice: normalizePrice($maxPrice.val())
        };
        if (appliedFilters.minPrice !== "" && appliedFilters.maxPrice !== "" && appliedFilters.minPrice > appliedFilters.maxPrice) {
          var swapPrice = appliedFilters.minPrice;
          appliedFilters.minPrice = appliedFilters.maxPrice;
          appliedFilters.maxPrice = swapPrice;
        }
        syncDraftControls();
        currentPage = 1;
        renderList();
        if (bootstrapFilterModal) {
          bootstrapFilterModal.hide();
        }
      });
      paginationTarget.on("click", ".page-link", function () {
        var pageNumber = $(this).data("pageNumber");
        var action = $(this).data("pageAction");
        var totalPages = Math.ceil(getFilteredCourses().length / pageSize);

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

        var learnItems = course.outcomes.concat(course.skills).slice(0, 8);
        var learnColumnBreak = Math.ceil(learnItems.length / 2);

        $("#courseDetailContent").html(
          '<div id="course-content" class="course-detail-layout">' +
            '<div class="course-detail-main">' +
              '<section class="course-detail-section course-overview-card">' +
                '<div class="course-learn-wrapper">' +
                  '<span class="eyebrow text-brand">Course Overview</span>' +
                  '<h3>What you will learn</h3>' +
                  '<div>' +
                    '<ul>' +
                      learnItems.slice(0, learnColumnBreak).map(function (item) {
                        return "<li>" + item + "</li>";
                      }).join("") +
                    "</ul>" +
                    '<ul>' +
                      learnItems.slice(learnColumnBreak).map(function (item) {
                        return "<li>" + item + "</li>";
                      }).join("") +
                    "</ul>" +
                  "</div>" +
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
              '<section class="course-detail-section course-audience-card">' +
                '<div class="course-audience-wrapper">' +
                  '<span class="eyebrow text-brand">Learners</span>' +
                  '<h3>Who this course is for</h3>' +
                  '<ul>' +
                    detailMeta.audience.map(function (item) {
                      return "<li>" + item + "</li>";
                    }).join("") +
                  "</ul>" +
                "</div>" +
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
    var selectedCourse = null;
    var appliedCoupon = null;

    if (queuedPurchaseToast) {
      window.sessionStorage.removeItem("edugoPurchaseToast");
      showInfoToast(queuedPurchaseToast);
    }

    function formatEnrollmentPrice(amount) {
      var numericAmount = Number(amount) || 0;
      return "RM " + numericAmount.toLocaleString("en-MY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function getDiscountAmount(course) {
      if (!course || !appliedCoupon) {
        return 0;
      }

      return Math.round((Number(course.price) || 0) * appliedCoupon.percent) / 100;
    }

    function renderAccountDetails() {
      var signedIn = isLoggedIn();
      var user = signedIn ? getProfileUser() : {};

      $("#purchaseName").val(signedIn ? $.trim(user.fullName || "") : "");
      $("#purchaseEmail").val(signedIn ? $.trim(user.email || "") : "");
      $("#purchasePhone").val(signedIn ? $.trim(user.phone || "") : "");
      $("#purchaseNameDisplay").text(signedIn && user.fullName ? user.fullName : "Sign in required");
      $("#purchaseEmailDisplay").text(signedIn && user.email ? user.email : "Sign in required");
      $("#purchasePhoneDisplay").text(signedIn && user.phone ? user.phone : "Sign in required");
      $(".account-details-card").toggleClass("is-missing-account", !signedIn);
    }

    function renderCouponMessage(course) {
      var $message = $("#couponMessage");

      if (!appliedCoupon || !course) {
        $message.attr("hidden", true).empty();
        return;
      }

      var discountAmount = getDiscountAmount(course);
      $message
        .removeAttr("hidden")
        .html(
          '<span class="coupon-code-pill">' + appliedCoupon.code + "</span>" +
          '<span><strong>' + appliedCoupon.label + " applied</strong><small>You saved " + formatEnrollmentPrice(discountAmount) + " (" + appliedCoupon.label + ")</small></span>" +
          '<button type="button" class="coupon-remove" id="removeCouponButton">Remove</button>'
        );
    }

    function renderSummary(course) {
      var price = Number(course.price) || 0;
      var discountAmount = getDiscountAmount(course);
      var total = Math.max(price - discountAmount, 0);
      var discountLabel = appliedCoupon ? "Discount (" + appliedCoupon.label + ")" : "Discount Amount";

      summaryTarget.html(
        "<h2>Order summary</h2>" +
        '<div class="summary-course">' +
          '<img src="' + course.image + '" alt="' + course.title + '">' +
          '<div class="summary-course-copy">' +
            "<h3>" + course.title + "</h3>" +
            "<p>" + course.summary + "</p>" +
            '<div class="summary-course-meta">' +
              '<span><i class="fa fa-briefcase" aria-hidden="true"></i><strong>Category:</strong> ' + course.category + "</span>" +
              '<span><i class="fa fa-clock-o" aria-hidden="true"></i><strong>Duration:</strong> ' + course.duration + "</span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="summary-divider"></div>' +
        '<div class="price-lines">' +
          '<div><span>Original Price</span><strong>' + formatEnrollmentPrice(price) + "</strong></div>" +
          '<div class="discount-line"><span>' + discountLabel + '</span><strong>- ' + formatEnrollmentPrice(discountAmount) + "</strong></div>" +
          '<div class="summary-total"><span>Total After Discount</span><strong>' + formatEnrollmentPrice(total) + "</strong></div>" +
        "</div>" +
        (appliedCoupon ?
          '<div class="summary-coupon-applied">' +
            '<span class="summary-coupon-icon" aria-hidden="true"><i class="fa fa-tags"></i></span>' +
            '<span><strong>Coupon Applied <em>' + appliedCoupon.code + "</em></strong><small>You saved " + formatEnrollmentPrice(discountAmount) + " (" + appliedCoupon.label + " off)</small></span>" +
          "</div>" :
          '<div class="summary-coupon-applied muted">' +
            '<span class="summary-coupon-icon" aria-hidden="true"><i class="fa fa-shield"></i></span>' +
            "<span><strong>Enrollment protected</strong><small>Confirm access from your registered account.</small></span>" +
          "</div>"
        )
      );

      renderCouponMessage(course);
    }

    getCourses().done(function (courses) {
      var course = courses.find(function (item) {
        return item.id === courseId;
      }) || courses[0];

      selectedCourse = course;
      renderAccountDetails();
      renderSummary(course);
    }).fail(function () {
      showErrorToast("Unable to load the order summary. Please try again.");
    });

    $("#applyCouponButton").on("click", function () {
      var code = $.trim($("#couponCode").val()).toUpperCase();

      if (!selectedCourse) {
        showWarningToast("Please wait for the course summary to load.");
        return;
      }

      if (code === "100%") {
        appliedCoupon = {
          code: code,
          percent: 100,
          label: "100%"
        };
      } else if (code === "50%") {
        appliedCoupon = {
          code: code,
          percent: 50,
          label: "50%"
        };
      } else {
        appliedCoupon = null;
        renderSummary(selectedCourse);
        showErrorToast("Use demo coupon 100% or 50%.");
        return;
      }

      $("#couponCode").val("");
      renderSummary(selectedCourse);
      showSuccessToast("Coupon applied successfully.");
    });

    $(document).on("click", "#removeCouponButton", function () {
      appliedCoupon = null;
      if (selectedCourse) {
        renderSummary(selectedCourse);
      }
      showInfoToast("Coupon removed.");
    });

    $("#purchaseForm").on("submit", function (event) {
      event.preventDefault();
      var form = this;

      renderAccountDetails();
      $("#purchaseName")[0].setCustomValidity($.trim($("#purchaseName").val()) ? "" : "Full name is required from your registered account.");
      $("#purchaseEmail")[0].setCustomValidity($.trim($("#purchaseEmail").val()) ? "" : "Email address is required from your registered account.");
      $("#purchasePhone")[0].setCustomValidity($.trim($("#purchasePhone").val()) ? "" : "Phone number is required from your registered account.");
      var hasAccountDetails = $.trim($("#purchaseName").val()) && $.trim($("#purchaseEmail").val()) && $.trim($("#purchasePhone").val());

      if (!isLoggedIn()) {
        $(form).addClass("was-validated");
        renderToastFeedback("#purchaseFeedback", "danger", "Please sign in with a registered account before confirming enrollment.");
        return;
      }

      if (!hasAccountDetails) {
        $(form).addClass("was-validated");
        renderToastFeedback("#purchaseFeedback", "danger", "Your registered account must include full name, email address, and phone number before enrollment.");
        return;
      }

      if (!form.checkValidity()) {
        event.stopPropagation();
        $(form).addClass("was-validated");
        renderToastFeedback("#purchaseFeedback", "danger", getInvalidFormMessage(form, "Please review your registered account details before confirming."));
        return;
      }

      $(form).addClass("was-validated");
      renderToastFeedback("#purchaseFeedback", "info", "Processing your enrollment...");

      simulateApi({ success: true }, 1200).done(function () {
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

    var currentYear = new Date().getFullYear();
    var selectedYear = currentYear;
    var certificateList = [];
    var reviewModal = null;
    var reviewModalElement = document.getElementById("certificateReviewModal");
    var $yearFilter = $("#certificateYearFilter");
    var $reviewForm = $("#certificateReviewForm");
    var $reviewRating = $("#certificateReviewRating");
    var $reviewText = $("#certificateReviewText");
    var $reviewFeedback = $("#certificateReviewFeedback");
    var $reviewSubmit = $("#certificateReviewSubmit");

    renderCertificateYearFilter();
    renderDashboardSkeleton($grid, 2);

    getCourses().done(function (courses) {
      var completed = courses.slice(0, 8).filter(Boolean);
      var issueDates = [
        "18 Apr 2026",
        "02 May 2026",
        "14 May 2026",
        "22 May 2026",
        "08 Jun 2026",
        "19 Jun 2026",
        "12 Sep 2025",
        "28 Nov 2025"
      ];

      window.setTimeout(function () {
        if (!completed.length) {
          showCertificateEmptyState("No certificates yet", "Complete an enrolled course to unlock your first certificate.", true);
          $grid.empty();
          return;
        }

        $("#certificateEmpty").addClass("d-none");
        certificateList = completed.map(function (course, index) {
          var issueDate = issueDates[index];
          var issuedYear = getIssuedYear(issueDate);
          var certificateNo = "EDG-" + issuedYear + "-" + String(index + 1).padStart(4, "0");

          return {
            id: "certificate-" + course.id,
            course: course,
            issueDate: issueDate,
            issuedYear: issuedYear,
            certificateNo: certificateNo,
            certificateThumbnailUrl: getSampleCertificateImage(course, issueDate, index, certificateNo),
            placeholderThumbnailUrl: getCertificatePlaceholderImage(course, certificateNo),
            hasReview: index !== 0,
            isSubmittingReview: false
          };
        });
        renderCertificateCards();
      }, 520);
    }).fail(function () {
      showErrorToast("Unable to load certificates.");
    });

    $yearFilter.on("change", function () {
      selectedYear = parseInt($(this).val(), 10) || currentYear;
      renderCertificateCards();
    });

    $grid.on("click", "[data-certificate-download]", function () {
      showSuccessToast("Certificate download prepared for this demo.");
    });

    $grid.on("click", "[data-certificate-review]", function () {
      var certificate = getCertificateById($(this).data("certificateReview"));

      if (!certificate || certificate.hasReview || certificate.isSubmittingReview) {
        return;
      }

      openCertificateReviewModal(certificate);
    });

    if (reviewModalElement) {
      reviewModalElement.addEventListener("hidden.bs.modal", function () {
        resetCertificateReviewForm();
      });
    }

    $reviewForm.on("submit", function (event) {
      event.preventDefault();

      var form = this;
      var certificate = getCertificateById($("#certificateReviewId").val());

      if (!certificate || certificate.hasReview || certificate.isSubmittingReview) {
        return;
      }

      if (!form.checkValidity() || !$reviewRating.val()) {
        $(form).addClass("was-validated");
        $reviewFeedback
          .removeClass("d-none certificate-review-feedback-success")
          .addClass("certificate-review-feedback-error")
          .text(getInvalidFormMessage(form, "Please add your rating and review before submitting."));
        return;
      }

      certificate.isSubmittingReview = true;
      $reviewSubmit.prop("disabled", true).text("Submitting...");

      simulateApi({ success: true }, 650).done(function () {
        certificate.hasReview = true;
        certificate.review = $.trim($reviewText.val());
        certificate.rating = $reviewRating.val();
        certificate.isSubmittingReview = false;

        renderCertificateCards();
        $reviewFeedback
          .removeClass("d-none certificate-review-feedback-error")
          .addClass("certificate-review-feedback-success")
          .text("Review submitted successfully. Your certificate is now available.");
        showSuccessToast("Review submitted. Certificate unlocked.");

        window.setTimeout(function () {
          if (reviewModal) {
            reviewModal.hide();
          }
        }, 520);
      }).fail(function () {
        certificate.isSubmittingReview = false;
        $reviewSubmit.prop("disabled", false).text("Submit Review");
        $reviewFeedback
          .removeClass("d-none certificate-review-feedback-success")
          .addClass("certificate-review-feedback-error")
          .text("We could not submit your review. Please try again.");
      });
    });

    function renderCertificateCards() {
      var filteredCertificates = certificateList.filter(function (certificate) {
        return certificate.issuedYear === selectedYear;
      });

      if (!filteredCertificates.length) {
        $grid.empty();
        if (certificateList.length) {
          showCertificateEmptyState("No certificates found", "No certificates found for this year.", false);
        } else {
          showCertificateEmptyState("No certificates yet", "Complete an enrolled course to unlock your first certificate.", true);
        }
        return;
      }

      $("#certificateEmpty").addClass("d-none");
      $grid.html(filteredCertificates.map(createCertificateCard).join(""));
    }

    function createCertificateCard(certificate) {
      var course = certificate.course;
      var thumbnailUrl = certificate.hasReview ? certificate.certificateThumbnailUrl : certificate.placeholderThumbnailUrl;
      var thumbnailAlt = certificate.hasReview
        ? "Certificate for " + course.title
        : "Certificate preview locked until review is submitted";
      var cardStateClass = certificate.hasReview ? "is-reviewed" : "requires-review";
      var certificateNoDisplay = certificate.hasReview ? certificate.certificateNo : "-";
      var issueDateDisplay = certificate.hasReview ? certificate.issueDate : "-";
      var actionButton = certificate.hasReview
        ? '<button class="btn btn-outline-dark w-100 certificate-action-button" type="button" data-certificate-download>Download Certificate</button>'
        : '<button class="btn btn-brand w-100 certificate-action-button" type="button" data-certificate-review="' + escapeHtml(certificate.id) + '">Review</button>';

      return (
        '<article class="certificate-card ' + cardStateClass + '" data-certificate-id="' + escapeHtml(certificate.id) + '">' +
          '<div class="certificate-card-pattern" aria-hidden="true"></div>' +
          '<div class="certificate-preview">' +
            '<img class="certificate-thumbnail" src="' + thumbnailUrl + '" alt="' + escapeHtml(thumbnailAlt) + '">' +
          "</div>" +
          '<div class="certificate-card-content">' +
            '<span class="certificate-label">Verified Certificate</span>' +
            '<h2>' + escapeHtml(course.title) + "</h2>" +
            '<div class="certificate-meta">' +
              '<span><strong>Cert No.</strong><em class="certificate-no">' + escapeHtml(certificateNoDisplay) + "</em></span>" +
              '<span><strong>Issued</strong>' + escapeHtml(issueDateDisplay) + "</span>" +
            "</div>" +
            '<div class="certificate-action">' + actionButton + "</div>" +
          "</div>" +
        "</article>"
      );
    }

    function getCertificateById(id) {
      return certificateList.find(function (certificate) {
        return certificate.id === id;
      });
    }

    function renderCertificateYearFilter() {
      if (!$yearFilter.length) {
        return;
      }

      var options = "";
      for (var year = currentYear; year >= currentYear - 10; year -= 1) {
        options += '<option value="' + year + '"' + (year === selectedYear ? " selected" : "") + ">" + year + "</option>";
      }

      $yearFilter.html(options);
    }

    function getIssuedYear(issuedDate) {
      var parsedYear = new Date(issuedDate).getFullYear();

      if (Number.isFinite(parsedYear)) {
        return parsedYear;
      }

      var yearMatch = String(issuedDate || "").match(/\b(19|20)\d{2}\b/);
      return yearMatch ? parseInt(yearMatch[0], 10) : currentYear;
    }

    function showCertificateEmptyState(title, message, showAction) {
      $("#certificateEmpty")
        .removeClass("d-none")
        .find("h3")
        .text(title)
        .end()
        .find("p")
        .text(message)
        .end()
        .find(".btn")
        .toggleClass("d-none", !showAction);
    }

    function openCertificateReviewModal(certificate) {
      resetCertificateReviewForm();
      $("#certificateReviewId").val(certificate.id);
      $("#certificateReviewCourseName").text(certificate.course.title);

      if ($reviewRating.length && $.fn.barrating && !$reviewRating.data("ratingInitialized")) {
        $reviewRating.barrating({
          theme: "fontawesome-stars",
          initialRating: null,
          showSelectedRating: false
        });
        $reviewRating.data("ratingInitialized", true);
      }

      if (reviewModalElement && window.bootstrap) {
        reviewModal = reviewModal || new bootstrap.Modal(reviewModalElement);
        reviewModal.show();
      }
    }

    function resetCertificateReviewForm() {
      if (!$reviewForm.length) {
        return;
      }

      $reviewForm[0].reset();
      $reviewForm.removeClass("was-validated");
      $reviewSubmit.prop("disabled", false).text("Submit Review");
      $reviewFeedback
        .addClass("d-none")
        .removeClass("certificate-review-feedback-success certificate-review-feedback-error")
        .text("");

      if ($reviewRating.length && $.fn.barrating && $reviewRating.data("ratingInitialized")) {
        $reviewRating.barrating("clear");
      }
    }
  }

  function getSampleCertificateImage(course, issueDate, index, certificateNo) {
    var palette = index % 2 === 0
      ? { accent: "#059669", soft: "#ecfdf5", ink: "#0f172a" }
      : { accent: "#2563eb", soft: "#eff6ff", ink: "#111827" };
    var title = escapeHtml(course.title);
    var category = escapeHtml(course.category);
    var certNo = escapeHtml(certificateNo || "");

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
        '<text x="480" y="584" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#475569">Cert No. ' + certNo + '</text>' +
      "</svg>";

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function getCertificatePlaceholderImage(course, certificateNo) {
    var title = escapeHtml(course.title);
    var certNo = escapeHtml(certificateNo);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">' +
        '<rect width="960" height="640" rx="42" fill="#f8fafc"/>' +
        '<rect x="36" y="36" width="888" height="568" rx="30" fill="#ffffff" stroke="#dbe4ee" stroke-width="2"/>' +
        '<rect x="78" y="84" width="804" height="472" rx="24" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="16 14"/>' +
        '<circle cx="480" cy="216" r="58" fill="#dbeafe"/>' +
        '<path d="M456 216l17 17 34-44" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="480" y="324" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="38" font-weight="800" fill="#0f172a">Review required</text>' +
        '<text x="480" y="376" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#64748b">Submit your course review to unlock this certificate.</text>' +
        '<text x="480" y="434" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#2563eb">' + title + '</text>' +
        '<text x="480" y="492" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="#475569">Cert No. ' + certNo + '</text>' +
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
