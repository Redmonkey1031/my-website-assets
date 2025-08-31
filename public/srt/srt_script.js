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
        });

    function loadInitialBatch() {
        // 此函式不變
        const initialBatch = allImages.slice(0, INITIAL_LOAD_SIZE);
        const newItems = createAndPrepareItems(initialBatch);
        newItems.forEach(item => visibilityObserver.observe(item));
        processLazyQueue();
    }

    function loadNextImage() {
        // 此函式不變
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
        // 此函式不變
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
        // 此函式不變
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

    /**
     * 【核心修改點】: 修改此觀察器，使其能夠處理進入和離開事件
     */
    function initVisibilityAndLoadNextObserver() {
        visibilityObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // --- 進入可視範圍 ---
                    
                    // 任務1: 讓圖片顯示出來
                    entry.target.classList.add('visible');

                    // 任務2: 檢查是否需要觸發載入下一張 (只觸發一次)
                    // 使用 data-load-triggered 屬性作為標記
                    if (!entry.target.dataset.loadTriggered) {
                        loadNextImage();
                        // 標記為已觸發，防止重複執行
                        entry.target.dataset.loadTriggered = 'true';
                    }

                } else {
                    // --- 離開可視範圍 ---

                    // 任務: 讓圖片隱藏起來
                    entry.target.classList.remove('visible');
                }
            });
            // 【重要】不能再 unobserve，因為需要持續監控
            // observer.unobserve(entry.target); <-- 移除這一行
        }, { threshold: 0.1 }); // threshold 保持不變
    }
});

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});
document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
});