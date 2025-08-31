document.addEventListener('DOMContentLoaded', () => {
    // --- 所有全域變數和狀態管理都保持不變 ---
    const galleryContainer = document.getElementById('gallery-container');
    const INITIAL_LOAD_SIZE = 30;
    const MAX_CONCURRENT_LOADS = 6;
    let allImages = [];
    let nextImageIndexToLoad = INITIAL_LOAD_SIZE;
    let msnry;
    let visibilityObserver;
    const lazyQueue = [];
    let activeLoads = 0;

    // --- 【新增】Lightbox 相關的元素 ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');


    // --- 初始化流程和大部分函式都保持不變 ---
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

            // --- 【新增】設定 Lightbox 的事件監聽器 ---
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

    // --- 【優化】設定 Lightbox 監聽事件的函式 ---
    function setupLightboxListeners() {
        // 使用事件委派 (Event Delegation) 的方式來處理圖片點擊
        galleryContainer.addEventListener('click', (e) => {
            // 檢查點擊的目標是否為圖片
            if (e.target.tagName === 'IMG') {
                
                // 顯示 Lightbox 的函式
                const showLightbox = () => {
                    lightbox.classList.add('show');
                    // 當 Lightbox 顯示後，移除 onload 事件，避免重複觸發
                    lightboxImg.onload = null;
                };

                // 1. 先將被點擊圖片的 src 設定給 Lightbox 的圖片
                //    此時 Lightbox 仍然是隱藏的 (opacity: 0)
                lightboxImg.src = e.target.src;

                // 2. 判斷圖片是否已經在快取中並載入完成
                //    如果 .complete 為 true，表示圖片無需等待，可直接顯示
                if (lightboxImg.complete) {
                    showLightbox();
                } else {
                    // 3. 如果圖片尚未載入完成 (例如首次載入或快取被清除)
                    //    就使用 onload 事件監聽，直到載入完成後才顯示 Lightbox
                    lightboxImg.onload = showLightbox;
                }
            }
        });

        // 關閉按鈕
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('show');
            lightboxImg.src = ""; 
        });

        // 點擊背景（Lightbox 空白區域）
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('show');
                lightboxImg.src = "";
            }
        });

        // 點擊圖片本身也可關閉
        lightboxImg.addEventListener('click', () => {
            lightbox.classList.remove('show');
            lightboxImg.src = "";
        });

        // 按下 ESC 關閉
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('show')) {
                lightbox.classList.remove('show');
                lightboxImg.src = "";
            }
        });
    }

    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
    // 顯示按鈕條件（例如滑動超過 300px）
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
    });

    // 點擊回到頂部，使用平滑滾動
    backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    });

});

// 以下的程式碼保持不變
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});
document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
});