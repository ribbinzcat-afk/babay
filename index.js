import { extension_settings } from "../../../extensions.js";

const extensionName = "PhoneUI";

// 1. สร้าง HTML โครงสร้างโทรศัพท์
const phoneHTML = `
<div id="rp-phone-container">
    <div class="rp-status-bar">
        <span id="rp-clock">12:00</span>
        <span>🔋 100%</span>
    </div>

    <!-- Home Screen -->
    <div class="rp-screen" id="rp-home-screen">
        <div class="rp-home-grid">
            <div class="rp-app-icon" onclick="openApp('rp-app-bank')">🏦<div class="rp-app-label">Bank</div></div>
            <div class="rp-app-icon" onclick="openApp('rp-app-social')">🐦<div class="rp-app-label">Social</div></div>
            <div class="rp-app-icon" onclick="openApp('rp-app-note')">📝<div class="rp-app-label">Notes</div></div>
        </div>
    </div>

    <!-- Bank App -->
    <div class="rp-app-view" id="rp-app-bank">
        <div class="rp-app-header"><span class="rp-back-btn" onclick="goHome()">❮</span> My Bank</div>
        <div class="rp-app-content">
            <div class="rp-bank-card">
                <div style="font-size:12px; opacity:0.8;">Total Balance</div>
                <div class="rp-balance">฿ <span id="data-balance">0.00</span></div>
                <div style="font-size:12px; margin-top:10px;">**** **** **** 8899</div>
            </div>
            <div style="font-weight:500; color:#636e72; margin-bottom:10px;">Recent Transactions</div>
            <div id="data-transactions">
                <!-- รายการธุรกรรมจะถูกเติมที่นี่ -->
                <div style="padding:10px; color:#aaa; text-align:center;">No transactions yet</div>
            </div>
        </div>
    </div>

    <!-- Social App -->
    <div class="rp-app-view" id="rp-app-social">
        <div class="rp-app-header"><span class="rp-back-btn" onclick="goHome()">❮</span> Feed</div>
        <div class="rp-app-content" id="data-tweets">
            <!-- ทวิตจะถูกเติมที่นี่ -->
            <div style="padding:20px; color:#aaa; text-align:center;">Feed is empty</div>
        </div>
    </div>

    <!-- Note App -->
    <div class="rp-app-view" id="rp-app-note">
        <div class="rp-app-header"><span class="rp-back-btn" onclick="goHome()">❮</span> Notes</div>
        <div class="rp-app-content">
            <div style="font-weight:500; color:#636e72;">To-Do List</div>
            <div id="data-todo" style="margin-top:10px;">
                <!-- To-Do จะถูกเติมที่นี่ -->
            </div>
        </div>
    </div>

    <div class="rp-home-indicator" onclick="goHome()"><div class="rp-home-bar"></div></div>
</div>

<div id="phone-toggle-btn">📱</div>
`;

// 2. ฟังก์ชันหลักสำหรับโหลด Extension
jQuery(async () => {
    // ใส่ HTML ลงไปใน Body
    $('body').append(phoneHTML);

    // ฟังก์ชันเปิด/ปิดมือถือ
    $('#phone-toggle-btn').on('click', () => {
        $('#rp-phone-container').toggleClass('visible');
    });

    // ฟังก์ชันนาฬิกา
    setInterval(() => {
        const now = new Date();
        $('#rp-clock').text(now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0'));
    }, 1000);

    // Expose functions to window scope (เพื่อให้ HTML เรียกใช้ได้)
    window.openApp = (appId) => { $(`#${appId}`).addClass('active'); };
    window.goHome = () => { $('.rp-app-view').removeClass('active'); };

    console.log(`${extensionName} Loaded!`);
});

// 3. ฟังก์ชันดักจับข้อความจาก AI (The Interceptor)
// SillyTavern จะเรียก event นี้เมื่อได้รับข้อความใหม่
eventSource.on(event_types.MESSAGE_RECEIVED, (data) => {
    const message = data.message.mes; // ข้อความที่ AI ตอบมา

    // Regex ค้นหา JSON Block ท้ายข้อความ
    // รูปแบบ: ```json { ... } ``` หรือแค่ { ... } ท้ายสุด
    const jsonRegex = /```json\s*({[\s\S]*?})\s*```|({[\s\S]*?})$/;
    const match = message.match(jsonRegex);

    if (match) {
        try {
            // ดึง JSON String ออกมา (กลุ่มที่ 1 หรือ 2)
            const jsonStr = match[1] || match[2];
            const uiData = JSON.parse(jsonStr);

            console.log("PhoneUI Update:", uiData);

            // อัปเดตข้อมูลตาม Key ที่ส่งมา
            if (uiData.balance) {
                $('#data-balance').text(uiData.balance);
            }

            if (uiData.transactions && Array.isArray(uiData.transactions)) {
                let html = '';
                uiData.transactions.forEach(t => {
                    const color = t.amount.startsWith('-') ? '#ff7675' : '#00b894';
                    html += `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f0f0f0;">
                        <span>${t.desc}</span><span style="color:${color}">${t.amount}</span>
                    </div>`;
                });
                $('#data-transactions').html(html);
            }

            if (uiData.tweets && Array.isArray(uiData.tweets)) {
                let html = '';
                uiData.tweets.forEach(t => {
                    html += `<div class="rp-tweet">
                        <div class="rp-tweet-header">
                            <div class="rp-avatar"></div>
                            <div><span class="rp-username">${t.user}</span><span class="rp-handle">@${t.handle}</span></div>
                        </div>
                        <div class="rp-tweet-content">${t.text}</div>
                    </div>`;
                });
                $('#data-tweets').html(html);
            }

            if (uiData.todo && Array.isArray(uiData.todo)) {
                let html = '';
                uiData.todo.forEach(item => {
                    html += `<div style="padding:10px; background:#fff8c4; margin-bottom:5px; border-radius:5px;">◻️ ${item}</div>`;
                });
                $('#data-todo').html(html);
            }

            // แจ้งเตือนว่าอัปเดตแล้ว (สั่นปุ่ม)
            $('#phone-toggle-btn').css('transform', 'scale(1.2)');
            setTimeout(() => $('#phone-toggle-btn').css('transform', ''), 200);

        } catch (e) {
            console.error("PhoneUI JSON Parse Error:", e);
        }
    }
});

                            
