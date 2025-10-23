// =================================================================
// 步驟一：成績數據接收與全域變數設定
// -----------------------------------------------------------------

// 確保這是全域變數，用於儲存 H5P 傳來的分數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 【煙火新增】全域變數：用於管理所有煙火實例
let fireworks = [];
// 【煙火新增】重力向量
let gravity;


// H5P 成績接收器
window.addEventListener('message', function (event) {
    // 執行來源驗證 (略)
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新全域分數變數
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 由於我們移除了 noLoop()，draw() 會自動連續執行，
        // 所以收到分數後不需要特別呼叫 redraw()。
    }
}, false);


// =================================================================
// 步驟二：p5.js setup() 和 draw() 核心邏輯
// -----------------------------------------------------------------

function setup() { 
    // 建立畫布，大小為視窗的一半
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 移除 noLoop()，讓 draw() 函式連續執行，這是動畫的關鍵
    
    // 【煙火設定】設定重力向量 (向下，正 y 值)
    gravity = createVector(0, 0.2);
    
    // 設定色彩模式為 HSB (色相, 飽和度, 亮度, 透明度)
    // 方便隨機產生鮮豔的煙火顏色
    colorMode(HSB, 360, 255, 255, 255); 
} 

function draw() { 
    // 【動畫關鍵】背景使用部分透明的黑色 (HSB: 0, 0, 0, 25)，
    // 讓上一幀的煙火產生殘影拖尾效果
    background(0, 0, 0, 25); 

    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0; 

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 高分區間：顯示鼓勵文本，**並發射煙火**
        fill(120, 255, 255); // 鮮豔綠色 (HSB)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【煙火生成】
        // 以 10% 的機率在每一幀發射一個新的煙火 (0.1 可調整發射頻率)
        if (random(1) < 0.1) { 
            // 發射新煙火，它會從底部升空然後爆炸
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數
        fill(60, 255, 255); // 黃色 (HSB)
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分
        fill(0, 255, 255); // 紅色 (HSB)
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 初始狀態
        fill(0, 0, 150); // 灰色 (HSB)
        text("等待成績...", width / 2, height / 2 - 50);
    }
    
    // -----------------------------------------------------------------
    // 【煙火更新與繪製】
    // -----------------------------------------------------------------
    // 從後往前遍歷，安全地移除已結束的煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update(); // 更新位置、套用重力、判斷是否爆炸
        fireworks[i].show();   // 繪製粒子
        
        if (fireworks[i].done()) {
            fireworks.splice(i, 1); // 移除已結束的實例
        }
    }
    
    // 顯示具體分數
    textSize(50);
    fill(0, 0, 200); // 偏暗的顏色 (HSB)
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈
        fill(120, 255, 255, 100); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(60, 255, 255, 100);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}


// =================================================================
// 步驟三：定義粒子和煙火類別 (Firework/Particle Classes)
// -----------------------------------------------------------------

// 粒子類別 (Particle Class) - 構成火箭和爆炸的最小單元
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // true: 是火箭粒子; false: 是爆炸粒子
        this.lifespan = 255;      // 透明度/壽命 (255=完全不透明)
        this.hu = hu;             // 顏色色相

        if (this.firework) {
            // 火箭：給予向上的速度
            this.vel = createVector(0, random(-10, -8)); 
        } else {
            // 爆炸：給予隨機方向的速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 8)); 
        }
        
        this.acc = createVector(0, 0); // 加速度
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸粒子：速度逐漸減慢，壽命減少 (淡出)
            this.vel.mult(0.9);
            this.lifespan -= 4; 
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重置加速度
    }

    done() {
        // 爆炸粒子在壽命結束時 (透明度小於 0) 被移除
        return this.lifespan < 0; 
    }

    show() {
        // 繪製粒子，使用點 (point)
        strokeWeight(this.firework ? 4 : 2); // 火箭點較粗
        // 使用 HSB 顏色模式，將壽命作為透明度
        stroke(this.hu, 255, 255, this.lifespan); 
        point(this.pos.x, this.pos.y);
    }
}

// 煙火類別 (Firework Class) - 管理一個完整的發射 -> 爆炸過程
class Firework {
    constructor() {
        this.hu = random(360); // 隨機選擇顏色
        // 在畫布底部隨機位置創建一個火箭粒子
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = []; // 爆炸粒子陣列
    }

    done() {
        // 當爆炸完成且所有爆炸粒子都消失時，返回 true
        return this.exploded && this.particles.length === 0;
    }

    update() {
        if (!this.exploded) {
            // 第一階段：火箭上升
            this.firework.applyForce(gravity);
            this.firework.update();

            // 判斷是否達到頂點 (速度不再向上)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 第二階段：爆炸粒子散開
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 爆炸：生成 100 個向各方向散開的粒子
        for (let i = 0; i < 100; i++) { 
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); // 繪製火箭
        }

        // 繪製爆炸粒子
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}
