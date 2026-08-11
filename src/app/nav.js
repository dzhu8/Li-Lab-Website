// Mobile menu toggle for the fixed header.
//
// Every page in src/layouts/ carries its own copy of the header markup (there is
// no build step to share it), but the behaviour attached to it lives here so the
// four pages cannot drift apart. Requires #mobile-menu-toggle and #header-nav in
// the page; does nothing if either is missing.
(function () {
     const toggle = document.getElementById("mobile-menu-toggle");
     const nav = document.getElementById("header-nav");
     if (!toggle || !nav) return;

     const close = () => {
          toggle.classList.remove("active");
          nav.classList.remove("active");
     };

     toggle.addEventListener("click", () => {
          toggle.classList.toggle("active");
          nav.classList.toggle("active");
     });

     // Tapping a link closes the menu behind it, including same-page anchors
     // where no navigation happens to close it for us.
     nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
})();
