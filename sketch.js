// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 【新增】全域變數：用於管理所有煙火實例
let fireworks = [];
// 【新增】重力向量
let gravity;


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (由於動畫需要連續播放，通常會移除 redraw() / loop() 邏輯，
        // 但如果外部系統有呼叫，則保留)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            // redraw(); // 在使用 loop() 時，通常不需要
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 【修改】為實現連續動畫，移除 noLoop(); 讓 draw() 函式連續執行
    // background(255); // 首次設置背景
    
    // 【新增】設定重力向量 (向下)
    gravity = createVector(0, 0.2);
    
    // 設定色彩模式為 HSB (Hue, Saturation, Brightness)，方便處理色彩變化和隨機顏色
    colorMode(HSB, 360, 255, 255, 255); 
} 

function draw() { 
    // 【關鍵】背景使用部分透明的黑色 (HSB: 0, 0, 0, 25)，創造夜空和煙火拖尾殘影效果
    background(0, 0, 0, 25); 

    // 計算百分比
    // 使用三元運算符避免 maxScore 為 0 時除以零
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0; 

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(120, 255, 255); // 綠色 (HSB)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【關鍵步驟：煙火生成邏輯】
        // 以 10% 的機率在每一幀發射一個新的煙火 (可調整 random(1) < 0.1 的值)
        if (random(1) < 0.1) { 
            fireworks.push(new Firework());
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 (HSB)
        fill(60, 255, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 (HSB)
        fill(0, 255, 255); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(0, 0, 150); // 灰色 (HSB)
        text(scoreText, width / 2, height / 2);
    }
    
    // -----------------------------------------------------------------
    // 【新增】煙火更新與繪製
    // -----------------------------------------------------------------
    // 從後往前遍歷，安全地移除已結束的煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update(); 
        fireworks[i].show();   
        
        if (fireworks[i].done()) {
            fireworks.splice(i, 1); // 移除已結束的煙火實例
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
        // 畫一個大圓圈代表完美 
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

// 粒子類別 (Particle Class)
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hu; // 色相 (Hue)

        if (this.firework) {
            // 作為火箭上升的粒子，給予向上的速度 (負 y 值)
            this.vel = createVector(0, random(-10, -8)); 
        } else {
            // 作為爆炸後散開的粒子，給予隨機方向的速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 8)); // 調整爆炸強度
        }
        
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸粒子受到摩擦力影響，速度會逐漸減慢 (模擬空氣阻力)
            this.vel.mult(0.9);
            this.lifespan -= 4; // 壽命減少，逐漸淡出
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重置加速度
    }

    done() {
        // 爆炸粒子在壽命結束後被移除
        return this.lifespan < 0; 
    }

    show() {
        strokeWeight(this.firework ? 4 : 2); // 火箭較粗，爆炸粒子較細
        
        // 設定顏色：色相(hu), 飽和度(255), 亮度(255), 透明度(lifespan)
        stroke(this.hu, 255, 255, this.lifespan); 
        point(this.pos.x, this.pos.y);
    }
}

// 煙火類別 (Firework Class) - 管理火箭發射和爆炸過程
class Firework {
    constructor() {
        // 隨機顏色
        this.hu = random(360); 
        // 從底部隨機位置發射一個火箭粒子 (firework: true)
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = []; // 爆炸粒子陣列
    }

    done() {
        // 如果已爆炸，且所有爆炸粒子都已消失，則煙火結束
        return this.exploded && this.particles.length === 0;
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            // 判斷火箭是否達到頂點 (速度變為正或接近 0)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 爆炸時生成大量粒子 (範例為 100 個)
        for (let i = 0; i < 100; i++) { 
            // 爆炸粒子使用相同的顏色 (hu)，但不是火箭 (firework: false)
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show(); // 繪製火箭粒子
        }

        // 繪製爆炸粒子
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}
