document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("transitionOverlay");

    // 1. Instantly trigger the entry fade-out reveal when page mounts
    if (overlay) {
        overlay.classList.add("overlay-fade-out");
    }

    // 2. Select links carefully (fixed the broken logo selector)
    const links = document.querySelectorAll("nav a, .footer-links-list a, .logo-container a, a.logo-container, .cta-container a, header a");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetUrl = link.getAttribute("href");

            // Ignore empty links, hashes, or external sites
            if (!targetUrl || targetUrl === "#" || targetUrl.startsWith("http") || targetUrl.startsWith("//")) {
                return;
            }

            // Prevent the browser from instantly changing pages
            e.preventDefault();

            if (overlay) {
                // Remove the old entry fade class, and trigger the flight takeoff wrapper
                overlay.classList.remove("overlay-fade-out");
                overlay.classList.add("overlay-active");
            }

            // 3. The Safety Redirection Matrix
            // We enforce a hard browser window location swap after 450ms
            const navigateAway = () => {
                window.location.href = targetUrl;
            };

            setTimeout(navigateAway, 450);

            // Safety fallback: if the tab hangs or animation drops frames, force transition anyway
            setTimeout(navigateAway, 1000);
        });
    });
});