// banner.js - Robust Premium Slider
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slide");
    if (slides.length === 0) return;

    let index = 0;
    const intervalTime = 2000; // 2 seconds as requested

    function nextSlide() {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
    }

    // Auto play
    let slideInterval = setInterval(nextSlide, intervalTime);

    // Pause on hover
    const banner = document.querySelector(".banner");
    if (banner) {
        banner.addEventListener("mouseenter", () => clearInterval(slideInterval));
        banner.addEventListener("mouseleave", () => slideInterval = setInterval(nextSlide, intervalTime));
    }
});
