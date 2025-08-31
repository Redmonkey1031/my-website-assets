document.addEventListener('DOMContentLoaded', () => {
    // --- 所有全域變數和狀態管理 ---
    const galleryContainer = document.getElementById('gallery-container');
    const INITIAL_LOAD_SIZE = 30;
    const MAX_CONCURRENT_LOADS = 6;
    let allImages = [];
    let nextImageIndexToLoad = INITIAL_LOAD_SIZE;
    let msnry;
    let visibilityObserver;
    const lazyQueue = [];
    let activeLoads = 0;

    // --- Lightbox 相關的元素 ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    // --- 初始化流程 ---
    fetch('images.json')
        .then(response => response.json())
        .then(imagesData => {
            allImages = imagesData;
            msnry = new Masonry(galleryContainer, {
                itemSelector: '.gallery-item',
                columnWidth: '.gallery-item',
                percentPosition: true
            });
            initVisibilityAndLoadNextObserver();
            loadInitialBatch();
            setupLightboxListeners();
        });

    function loadInitialBatch() {
        const initialBatch = allImages.slice(0, INITIAL_LOAD_SIZE);
        const newItems = createAndPrepareItems(initialBatch);
        newItems.forEach(item => visibilityObserver.observe(item));
        processLazyQueue();
    }

    function loadNextImage() {
        if (nextImageIndexToLoad >= allImages.length) {
            return;
        }
        const nextImageBatch = allImages.slice(nextImageIndexToLoad, nextImageIndexToLoad + 1);
        if (nextImageBatch.length > 0) {
            console.log(`觸發載入第 ${nextImageIndexToLoad + 1} 張圖片...`);
            const newItems = createAndPrepareItems(nextImageBatch);
            visibilityObserver.observe(newItems[0]);
            processLazyQueue();
            nextImageIndexToLoad++;
        }
    }
    
    function createAndPrepareItems(imageBatch) {
        const fragment = document.createDocumentFragment();
        const newItems = [];
        imageBatch.forEach(image => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            img.dataset.src = image.src;
            img.alt = image.alt;
            itemDiv.appendChild(img);
            lazyQueue.push({ img, container: itemDiv });
            fragment.appendChild(itemDiv);
            newItems.push(itemDiv);
        });
        galleryContainer.appendChild(fragment);
        msnry.appended(newItems);
        imagesLoaded(newItems, () => msnry.layout());
        return newItems;
    }

    function processLazyQueue() {
        while (activeLoads < MAX_CONCURRENT_LOADS && lazyQueue.length > 0) {
            activeLoads++;
            const { img, container } = lazyQueue.shift();
            const tempImg = new Image();
            tempImg.src = img.dataset.src;
            tempImg.onload = () => {
                img.src = tempImg.src;
                img.removeAttribute('data-src');
                activeLoads--;
                processLazyQueue();
            };
            tempImg.onerror = () => {
                console.error(`圖片載入失敗: ${tempImg.src}`);
                activeLoads--;
                processLazyQueue();
            };
        }
    }

    function initVisibilityAndLoadNextObserver() {
        visibilityObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (!entry.target.dataset.loadTriggered) {
                        loadNextImage();
                        entry.target.dataset.loadTriggered = 'true';
                    }
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0.1 });
    }

    function setupLightboxListeners() {
        galleryContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                const showLightbox = () => {
                    lightbox.classList.add('show');
                    lightboxImg.onload = null;
                };
                lightboxImg.src = e.target.src;
                if (lightboxImg.complete) {
                    showLightbox();
                } else {
                    lightboxImg.onload = showLightbox;
                }
            }
        });

        const closeLightbox = () => {
            lightbox.classList.remove('show');
            lightboxImg.src = "";
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        lightboxImg.addEventListener('click', closeLightbox);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('show')) {
                closeLightbox();
            }
        });
    }

    // --- 返回頂部按鈕 ---
    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ▼▼▼ 在這裡初始化 Swiper Slider ▼▼▼
    let pricingSwiper;
    const swiperOptions = {
        loop: true,
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 20,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    };

    function initSwiper() {
        if (window.innerWidth <= 768 && pricingSwiper === undefined) {
            pricingSwiper = new Swiper('.pricing-slider', swiperOptions);
        } else if (window.innerWidth > 768 && pricingSwiper !== undefined) {
            pricingSwiper.destroy(true, true);
            pricingSwiper = undefined;
        }
    }

    initSwiper(); // 頁面載入時執行一次
    window.addEventListener('resize', initSwiper); // 當視窗大小改變時再次執行

}); // ▲▲▲ 唯一的 DOMContentLoaded 監聽器在此結束 ▲▲▲


// --- 以下的程式碼保持不變 ---
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});