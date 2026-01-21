// Phone UI Extension for SillyTavern
// Created by Robo

(function() {
    // 1. HTML Structure (Phone + Button)
    const phoneHTML = `
    <div id="phone-toggle-btn" title="Toggle Phone">📱</div>

    <div id="rp-phone-container">
        <div class="rp-status-bar">
            <span id="rp-clock">12:00</span>
            <span>🔋 100%</span>
        </div>

        <!-- Home Screen -->
        <div class="rp-screen" id="rp-home">
            <div class="rp-app-grid">
                <div class="rp-app-icon" onclick="openRpApp('rp-bank')">
                    <div class="rp-icon-box">🏦</div><span class="rp-app-name">Bank</span>
                </div>
                <div class="rp-app-icon" onclick="openRpApp('rp-notes')">
                    <div class="rp-icon-box">📝</div><span class="rp-app-name">Notes</span>
                </div>
                <div class="rp-app-icon" onclick="openRpApp('rp-social')">
                    <div class="rp-icon-box">🐦</div><span class="rp-app-name">Social</span>
                </div>
                <div class="rp-app-icon" onclick="openRpApp('rp-chat')">
                    <div class="rp-icon-box">💬</div><span class="rp-app-name">Chat</span>
                </div>
            </div>
        </div>

        <!-- Apps (Hidden by default) -->
        <div class="rp-app-view" id="rp-bank">
            <div class="rp-header"><span class="rp-back-btn" onclick="closeRpApp()">❮</span> Bank</div>
            <div class="rp-content">
                <div class="rp-bank-card">
                    <div style="font-size:12px; opacity:0.8;">Balance</div>
                    <div style="font-size:24px; font-weight:bold;">฿ <span id="data-balance">0.00</span></div>
                </div>
                <div style="margin-top:15px; font-weight:500; color:#666;">Recent</div>
                <div id="data-transactions" style="font-size:13px; margin-top:10px;">- No Data -</div>
            </div>
        </div>

        <div class="rp-app-view" id="rp-notes">
            <div class="rp-header"><span class="rp-back-btn" onclick="closeRpApp()">❮</span> Notes</div>
            <div class="rp-content">
                <div style="background:#fff8c4; padding:10px; border-radius:8px; margin-bottom:15px;" id="data-thought">...</div>
                <div style="font-weight:500;">To-Do</div>
                <div id="data-todo" style="margin-top:5px;"></div>
            </div>
        </div>

        <div class="rp-app-view" id="rp-social">
            <div class="rp-header"><span class="rp-back-btn" onclick="closeRpApp()">❮</span> Feed</div>
            <div class="rp-content" id="data-tweet">Loading feed...</div>
        </div>

        <div class="rp-app-view" id="rp-chat">
            <div class="rp-header"><span class="rp-back-btn" onclick="closeRpApp()">❮</span> Messages</div>
            <div class="rp-content" style="display:flex; flex-direction:column;" id="data-chat-history">
                <div class="rp-msg rp-msg-in">Welcome to Chat!</div>
            </div>
        </div>
    </div>
    `;

    // 2. Inject HTML into SillyTavern
    $(document).ready(function() {
        $('body').append(phoneHTML);

        // Toggle Logic
        $('#phone-toggle-btn').on('click', function() {
            $('#rp-phone-container').toggleClass('open');
            // Change Icon based on state
            if($('#rp-phone-container').hasClass('open')) {
                $(this).html('❌'); // Close icon
            } else {
                $(this).html('📱'); // Phone icon
            }
        });

        // App Navigation Logic (Global functions)
        window.openRpApp = function(appId) {
            $('#' + appId).addClass('active');
        };
        window.closeRpApp = function() {
            $('.rp-app-view').removeClass('active');
        };

        // Clock Logic
        setInterval(() => {
            const now = new Date();
            $('#rp-clock').text(now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0'));
        }, 1000);
    });

    // 3. AI Message Interceptor (The Brain)
    const onMessageReceived = (data) => {
        if (!data || !data.message) return;

        const text = data.message;
        // Regex to find JSON block at the end
        const jsonRegex = /```json\s*({[\s\S]*?})\s*```|({[\s\S]*?})$/;
        const match = text.match(jsonRegex);

        if (match) {
            try {
                // Try parsing the first or second group
                const jsonStr = match[1] || match[2];
                const uiData = JSON.parse(jsonStr);

                console.log("[PhoneUI] Updating data:", uiData);

                // Update UI Elements safely
                if (uiData.balance) $('#data-balance').text(uiData.balance);
                if (uiData.thought) $('#data-thought').text(uiData.thought);

                if (uiData.transactions) {
                    let html = '';
                    uiData.transactions.forEach(t => html += `<div style="padding:5px 0; border-bottom:1px solid #eee;">${t}</div>`);
                    $('#data-transactions').html(html);
                }

                if (uiData.todo) {
                    let html = '';
                    if(Array.isArray(uiData.todo)) {
                         uiData.todo.forEach(t => html += `<div>☐ ${t}</div>`);
                    } else {
                         html = `<div>☐ ${uiData.todo}</div>`;
                    }
                    $('#data-todo').html(html);
                }

                if (uiData.tweet) $('#data-tweet').html(`<div style="border-bottom:1px solid #eee; padding:10px 0;"><b>Latest</b><br>${uiData.tweet}</div>`);

            } catch (e) {
                console.error("[PhoneUI] JSON Parse Error:", e);
            }
        }
    };

    // Register Extension in SillyTavern
    // Note: SillyTavern extensions work by simply running the JS.
    // We hook into the event bus if available, or just rely on the script running.
    // For message interception, we hook into the global event source if possible,
    // but the easiest way for extensions is usually watching the DOM or hooking `generation_after`.

    // Hooking into SillyTavern's event system (if available)
    if (window.eventSource) {
        window.eventSource.on(event_types.MESSAGE_RECEIVED, (id) => {
             // We need to fetch the message content.
             // Since accessing internal context is hard, we scan the last message div.
             // But for a cleaner approach, let's assume the user puts the JSON in the text.
             // We can scan the latest message in the DOM.
             setTimeout(() => {
                 const lastMsg = $('.mes_text').last().text();
                 onMessageReceived({message: lastMsg});
             }, 500);
        });
    } else {
        // Fallback: MutationObserver to watch for new messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    const lastMsg = $('.mes_text').last().text();
                    // Basic debounce/check could be added here
                    onMessageReceived({message: lastMsg});
                }
            });
        });

        // Start observing the chat container once it exists
        const checkChat = setInterval(() => {
            const chat = document.getElementById('chat');
            if (chat) {
                observer.observe(chat, { childList: true, subtree: true });
                clearInterval(checkChat);
            }
        }, 1000);
    }
})();    </div>

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

                            
