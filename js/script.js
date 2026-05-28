/**
 * ==================== 購物車管理類 ====================
 * 功能說明：
 *   - 管理購物車中的商品集合
 *   - 提供新增、移除、統計功能
 *   - 自動將購物車資料持久化到 localStorage
 */
class ShoppingCart {
    /**
     * 建構子 - 初始化購物車
     * 流程：
     *   1. 創建空的商品陣列
     *   2. 從本地儲存中載入之前保存的商品
     */
    constructor() {
        this.items = [];          // 存儲所有商品的陣列
        this.loadFromStorage();   // 載入已保存的購物車資料
    }

    /**
     * 新增商品到購物車
     * @param {Object} product - 商品物件 {id, name, price, description}
     * @param {number} quantity - 數量（預設值為 1）
     * 
     * 邏輯：
     *   - 若商品已存在，則增加數量
     *   - 若商品不存在，則新增到陣列
     *   - 操作完成後自動保存到 localStorage
     */
    addItem(product, quantity = 1) {
        // 查找購物車中是否已有相同 ID 的商品
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            // 若存在：增加該商品的數量
            existingItem.quantity += quantity;
        } else {
            // 若不存在：新增商品到購物車（使用展開運算子複製商品資訊）
            this.items.push({
                ...product,
                quantity: quantity
            });
        }
        
        this.saveToStorage();  // 保存到本地儲存
    }

    /**
     * 從購物車移除商品
     * @param {number} productId - 要移除的商品 ID
     * 
     * 邏輯：使用 filter() 篩選出不等於指定 ID 的商品
     */
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
    }

    /**
     * 計算購物車的總金額
     * @returns {number} 所有商品的(單價 × 數量)之總和
     * 
     * 邏輯：使用 reduce() 累加每件商品的小計
     */
    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    /**
     * 計算購物車的商品總數量
     * @returns {number} 所有商品數量的總和
     * 
     * 邏輯：使用 reduce() 累加所有商品的數量欄位
     */
    getTotalCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * 將購物車資料保存到瀏覽器本地儲存 (localStorage)
     * 使用 JSON.stringify() 轉換物件為文字格式
     */
    saveToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    /**
     * 從本地儲存讀取購物車資料
     * 流程：
     *   1. 嘗試從 localStorage 取得 'cart' 的值
     *   2. 若存在：使用 JSON.parse() 轉換回物件
     *   3. 若不存在：使用空陣列作為預設值
     */
    loadFromStorage() {
        const stored = localStorage.getItem('cart');
        this.items = stored ? JSON.parse(stored) : [];
    }

    /**
     * 清空購物車所有商品
     */
    clear() {
        this.items = [];
        this.saveToStorage();
    }
}

/**
 * ==================== 示範商品 ====================
 * 用途：
 *   - 模擬真實的商品物件
 *   - 用於演示購物車的加入商品功能
 * 
 * 結構：
 *   - id: 商品的唯一識別符
 *   - name: 商品名稱
 *   - price: 商品單價
 *   - description: 商品描述
 */
const DEMO_PRODUCT = {
    id: 1,
    name: '示範商品',
    price: 99.99,
    description: '這是一個演示商品'
};

/**
 * ==================== 模擬 API 調用 ====================
 * 功能說明：
 *   - 模擬真實的後端 API 呼叫
 *   - 用於演示非同步操作和錯誤處理
 *   - 包含隨機延遲和失敗率，用於測試 UI 反應
 * 
 * @param {Object} product - 商品物件
 * @param {number} quantity - 購買數量
 * @returns {Promise} 返回一個 Promise 物件
 *   成功時：{ success: true, message: string, timestamp: string }
 *   失敗時：{ code: 'INVENTORY_ERROR', message: string }
 */
async function addToCartAPI(product, quantity) {
    return new Promise((resolve, reject) => {
        // 模擬 API 延遲 (500-1000ms)
        // Math.random() 產生 0-1 的隨機數，乘以 500 再加 500 即為 500-1000ms
        const delay = Math.random() * 500 + 500;
        
        setTimeout(() => {
            // 模擬 10% 的失敗率（Math.random() > 0.9 代表只有 10% 機率進入此判斷）
            // 用於演示錯誤處理機制
            if (Math.random() > 0.9) {
                reject({
                    code: 'INVENTORY_ERROR',
                    message: '庫存不足，請稍後再試'
                });
            } else {
                // 成功回應：返回成功狀態和時間戳
                resolve({
                    success: true,
                    message: `已成功加入 ${quantity} 件商品`,
                    timestamp: new Date().toISOString()
                });
            }
        }, delay);
    });
}

/**
 * ==================== UI 管理器 ====================
 * 功能說明：
 *   - 管理所有 UI 相關的互動和顯示
 *   - 連接 HTML 元素與業務邏輯
 *   - 處理動畫、訊息顯示和錯誤提示
 * 
 * 主要責任：
 *   1. 初始化 DOM 元素和事件監聽器
 *   2. 處理使用者點擊事件
 *   3. 管理購物車的視覺更新
 *   4. 執行各種動畫效果
 *   5. 顯示和隱藏提示訊息
 */
class UIManager {
    /**
     * 建構子 - 初始化 UI 管理器
     * 流程：
     *   1. 從 HTML 中取得各個 DOM 元素的參考
     *   2. 建立 ShoppingCart 實例
     *   3. 初始化內部狀態標誌
     */
    constructor() {
        // ===== DOM 元素參考 =====
        this.addBtn = document.getElementById('addBtn');           // 「加入購物車」按鈕
        this.quantityInput = document.getElementById('quantity');  // 數量輸入欄位
        this.messageDiv = document.getElementById('message');      // 訊息顯示區域
        this.cartCountSpan = document.getElementById('cartCount'); // 購物車數量計數器
        this.cartList = document.getElementById('cartList');       // 購物車項目列表
        this.totalPrice = document.getElementById('totalPrice');   // 購物車總金額

        // ===== 內部狀態 =====
        this.cart = new ShoppingCart();  // 建立購物車實例
        this.isProcessing = false;       // 標誌：是否正在處理加入購物車的操作（防止重複點擊）
    }

    /**
     * 初始化 UI 事件監聽器
     * 在 DOM 完全加載後調用
     */
    init() {
        // 為「加入購物車」按鈕綁定點擊事件
        this.addBtn.addEventListener('click', () => this.handleAddToCart());
        // 初始化購物車顯示
        this.updateCartDisplay();
    }

    /**
     * ==================== 核心動畫函數 ====================
     * 處理「加入購物車」的完整流程
     * 包含驗證、動畫、API 呼叫、錯誤處理和狀態更新
     * 
     * 流程步驟：
     *   1. 檢查是否已有操作進行中（防止重複點擊）
     *   2. 取得使用者輸入的數量
     *   3. 驗證數量的有效性
     *   4. 執行各種視覺動畫效果
     *   5. 呼叫模擬 API
     *   6. 成功時更新購物車
     *   7. 失敗時顯示錯誤訊息
     */
    async handleAddToCart() {
        // 防止重複點擊
        if (this.isProcessing) {
            this.showMessage('操作進行中，請稍候...', 'loading');
            return;
        }

        try {
            // ===== 初始化操作狀態 =====
            this.isProcessing = true;      // 鎖定操作（防止重複執行）
            this.addBtn.disabled = true;   // 禁用按鈕，防止使用者再次點擊
            this.showMessage('正在加入購物車...', 'loading');

            // ===== 驗證使用者輸入 =====
            const quantity = parseInt(this.quantityInput.value);
            
            if (!this.validateQuantity(quantity)) {
                throw new Error('請輸入有效的數量（1-10）');
            }

            // ===== 執行視覺動畫效果 =====
            this.animateButtonClick();        // 按鈕點擊動畫
            this.shakeProductCard();          // 商品卡片搖晃效果
            this.createFloatingParticles();   // 建立浮動粒子動畫

            // ===== 調用 API（模擬加入購物車） =====
            // 等待 API 回應（帶有延遲和隨機失敗模擬）
            const result = await addToCartAPI(DEMO_PRODUCT, quantity);

            // ===== 成功時的處理 =====
            this.cart.addItem(DEMO_PRODUCT, quantity);  // 將商品添加到購物車實例
            this.updateCartDisplay();                   // 更新 UI 顯示
            this.showMessage(`✓ ${result.message}`, 'success');

            // ===== 重置表單 =====
            this.quantityInput.value = 1;

            // 2 秒後清除成功訊息
            setTimeout(() => {
                this.clearMessage();
            }, 2000);

        } catch (error) {
            // ===== 錯誤處理 =====
            this.handleError(error);

        } finally {
            // ===== 清理和重置狀態 =====
            // 無論成功或失敗都要執行這部分，用來恢復 UI 狀態
            this.isProcessing = false;
            this.addBtn.disabled = false;
        }
    }

    /**
     * ==================== 錯誤處理 ====================
     * 集中管理各種類型的錯誤
     * 
     * @param {Error} error - 錯誤物件
     * 
     * 處理流程：
     *   1. 記錄錯誤到瀏覽器控制台（用於開發調試）
     *   2. 根據錯誤類型決定要顯示的訊息
     *   3. 以友善的方式呈現給使用者
     *   4. 設定超時自動清除錯誤訊息
     */
    handleError(error) {
        console.error('Error:', error);

        let errorMessage = '操作失敗，請稍後再試';  // 預設錯誤訊息

        // ===== 根據錯誤類型判斷顯示的訊息 =====
        if (error instanceof TypeError) {
            // TypeError 通常表示網絡或連接問題
            errorMessage = '網絡錯誤，請檢查連接';
        } else if (error.code === 'INVENTORY_ERROR') {
            // 庫存錯誤：使用 API 回傳的具體訊息
            errorMessage = error.message;
        } else if (error.message) {
            // 其他錯誤：使用原始錯誤訊息
            errorMessage = error.message;
        }

        // 顯示錯誤訊息
        this.showMessage(`✗ ${errorMessage}`, 'error');

        // 5 秒後自動清除錯誤訊息
        setTimeout(() => {
            this.clearMessage();
        }, 5000);
    }

    /**
     * ==================== 驗證函數 ====================
     * 驗證使用者輸入的數量是否有效
     * 
     * @param {number} quantity - 要驗證的數量
     * @returns {boolean} true 表示有效，false 表示無效
     * 
     * 驗證規則：
     *   1. 必須是有效的數字（使用 !isNaN() 檢查）
     *   2. 必須 >= 1（至少購買 1 件）
     *   3. 必須 <= 10（最多購買 10 件）
     */
    validateQuantity(quantity) {
        return !isNaN(quantity) && quantity >= 1 && quantity <= 10;
    }

    /**
     * ==================== 動畫函數 ====================
     * 為按鈕點擊事件添加視覺反饋動畫
     * 
     * 技術細節：
     *   1. 移除 'clicked' class 以清除之前的動畫
     *   2. 使用 offsetWidth 觸發強制重排（reflow）
     *      - 這是必要的，因為移除和立即添加相同的 class 不會觸發動畫
     *      - 透過存取 DOM 屬性強制瀏覽器進行重排
     *   3. 再次添加 'clicked' class，觸發 CSS 動畫
     */
    animateButtonClick() {
        this.addBtn.classList.remove('clicked');
        // 強制重排以重新觸發動畫
        // 此行代碼會強制瀏覽器計算元素的寬度，從而進行重排
        void this.addBtn.offsetWidth;
        this.addBtn.classList.add('clicked');
    }

    /**
     * 商品卡片搖晃動畫
     * 
     * 技術細節：
     *   - 同樣使用強制重排技術讓 CSS 動畫重新執行
     *   - 選擇具有 'product-card' 類別的元素
     */
    shakeProductCard() {
        const card = document.querySelector('.product-card');
        card.classList.remove('shake');
        // 強制重排
        void card.offsetWidth;
        card.classList.add('shake');
    }

    /**
     * 建立浮動粒子動畫效果
     * 用於視覺反饋，讓使用者感知到成功操作
     * 
     * 效果說明：
     *   - 在按鈕位置生成 2-3 個隨機粒子（✓、🛒、💚）
     *   - 粒子向上浮動並逐漸消失
     *   - 1 秒後自動移除 DOM 元素
     * 
     * 流程：
     *   1. 定義可用的粒子符號
     *   2. 隨機決定生成 2-3 個粒子
     *   3. 為每個粒子：
     *      a. 建立 HTML 元素
     *      b. 設定初始位置（在按鈕中心）
     *      c. 添加到頁面
     *      d. 觸發 CSS 動畫
     *      e. 動畫完成後移除元素
     */
    createFloatingParticles() {
        // ===== 定義粒子符號 =====
        const particles = ['✓', '🛒', '💚'];
        
        // ===== 隨機決定粒子數量（2-3 個） =====
        // Math.floor(Math.random() * 2) 產生 0 或 1
        // 再加 2，所以結果為 2 或 3
        const randomCount = Math.floor(Math.random() * 2) + 2;

        // ===== 為每個粒子建立動畫 =====
        for (let i = 0; i < randomCount; i++) {
            // 建立粒子元素
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            // 隨機選擇一個粒子符號
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            
            // ===== 設定粒子位置（在按鈕附近） =====
            // getBoundingClientRect() 取得按鈕的位置和尺寸資訊
            const rect = this.addBtn.getBoundingClientRect();
            // 設定粒子在按鈕中心位置
            particle.style.left = (rect.left + rect.width / 2) + 'px';
            particle.style.top = (rect.top + rect.height / 2) + 'px';

            // 將粒子添加到頁面
            document.body.appendChild(particle);

            // ===== 觸發動畫 =====
            // 使用 setTimeout 確保元素已被添加到 DOM 再添加 class
            // 否則可能無法觸發 CSS 過渡效果
            setTimeout(() => {
                particle.classList.add('float');
            }, 10);

            // ===== 動畫完成後清理 =====
            // 1000ms 後移除元素，防止 DOM 節點堆積
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * ==================== 訊息管理 ====================
     * 向使用者顯示訊息（成功、錯誤或載入中的狀態提示）
     * 
     * @param {string} text - 要顯示的訊息文字
     * @param {string} type - 訊息類型：'success'、'error' 或 'loading'
     *                        用於套用對應的 CSS 樣式
     */
    showMessage(text, type) {
        this.messageDiv.textContent = text;
        // 設定 class 為 'message {type}'，用於套用相應的樣式
        this.messageDiv.className = `message ${type}`;
    }

    /**
     * 清除訊息
     * 將訊息區域隱藏並清空內容
     */
    clearMessage() {
        this.messageDiv.className = 'message hidden';
        this.messageDiv.textContent = '';
    }

    /**
     * ==================== 購物車顯示 ====================
     * 更新購物車的所有視覺元素
     * 
     * 更新內容：
     *   1. 購物車商品數量計數器
     *   2. 購物車項目列表（產品名稱、數量、單價）
     *   3. 購物車總金額
     * 
     * 流程：
     *   - 若購物車為空，顯示「購物車為空」訊息
     *   - 若有商品，逐一顯示每件商品的詳細資訊
     */
    updateCartDisplay() {
        // ===== 更新購物車數量計數器 =====
        const count = this.cart.getTotalCount();
        this.cartCountSpan.textContent = count;

        // ===== 更新購物車項目列表 =====
        this.cartList.innerHTML = '';  // 清空列表
        
        if (this.cart.items.length === 0) {
            // 購物車為空時的提示
            this.cartList.innerHTML = '<p style="color: #999; text-align: center;">購物車為空</p>';
        } else {
            // 逐一顯示購物車中的商品
            this.cart.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                // 建立每件商品的 HTML 結構
                // 包含：商品名稱 × 數量、小計金額、移除按鈕
                itemEl.innerHTML = `
                    <span class="cart-item-name">${item.name} × ${item.quantity}</span>
                    <span class="cart-item-price">￥${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="cart-item-remove" onclick="uiManager.removeFromCart(${item.id})">移除</button>
                `;
                this.cartList.appendChild(itemEl);
            });
        }

        // ===== 更新購物車總金額 =====
        const total = this.cart.getTotal();
        this.totalPrice.textContent = `￥${total.toFixed(2)}`;
    }

    /**
     * 從購物車移除指定商品
     * @param {number} productId - 要移除的商品 ID
     */
    removeFromCart(productId) {
        this.cart.removeItem(productId);
        this.updateCartDisplay();
    }
}

/**
 * ==================== 初始化 ====================
 * 程式進入點：當 DOM 完全加載時啟動應用
 * 
 * 流程：
 *   1. 監聽 'DOMContentLoaded' 事件（確保 HTML 已完全加載）
 *   2. 建立 UIManager 實例
 *   3. 調用 init() 方法初始化事件監聽器和 UI 顯示
 * 
 * 為什麼使用 DOMContentLoaded？
 *   - 確保所有 HTML 元素都已存在
 *   - 允許 JavaScript 檔案放在 HTML 中的任何位置
 *   - 不需要等待圖片等資源加載完成
 */
let uiManager;  // 全域變數，用於在其他函數中存取 UIManager 實例

// 監聽 DOM 完全加載事件
document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();  // 建立 UI 管理器實例
    uiManager.init();             // 初始化事件監聽器和 UI
});
