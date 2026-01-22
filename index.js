import { eventSource, event_types } from <q>"../../../../script.js"</q>;

// Simple setup without complex setting loading to avoid AbortError
const extensionName = <q>"interactive-phone"</q>;

// Default State
let phoneState = {
    bankBalance: <q>"5,000.00 ฿"</q>,
    tweets: [],
    messages: [],
    notes: [],
    logs: {
        location: <q>"Unknown"</q>,
        date: <q>"Unknown"</q>,
        time: <q>"Unknown"</q>,
        weather: <q>"Unknown"</q>,
        clothes: <q>"Casual"</q>,
        event: <q>"None"</q>,
        summary: <q>"No data yet."</q>
    }
};

// Regex to capture JSON from AI response
const DATA_REGEX = //i;

// CSS Styles injected directly via JS to avoid MIME type issues
const phoneStyles = `
    #smart-phone-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        height: 600px;
        background-color: #000;
        border-radius: 30px;
        border: 8px solid #333;
        overflow: hidden;
        z-index: 2000;
        display: none;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    #phone-screen {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        position: relative;
        color: white;
        transition: background-image 0.5s ease;
    }

    .status-bar {
        display: flex;
        justify-content: space-between;
        padding: 5px 15px;
        font-size: 12px;
        background: rgba(0,0,0,0.2);
        backdrop-filter: blur(2px);
    }

    .app-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        padding: 20px;
        margin-top: 20px;
    }

    .app-item {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .app-icon {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        background: rgba(255,255,255,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        transition: transform 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        color: #333; /* Default icon color */
    }

    .app-icon:hover {
        transform: scale(1.1);
    }

    .app-label {
        text-align: center;
        font-size: 10px;
        margin-top: 4px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }

    .app-window {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fff;
        color: #333;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    .app-window.open {
        transform: translateY(0);
    }

    .app-header {
        padding: 15px;
        background: #f8f9fa;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        font-weight: bold;
    }

    .back-btn {
        margin-right: 10px;
        cursor: pointer;
        font-size: 18px;
    }

    .app-content {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
    }

    .twitter-post {
        border-bottom: 1px solid #eee;
        padding: 10px 0;
    }

    .bank-card {
        background: linear-gradient(45deg, #1e3c72, #2a5298);
        color: white;
        padding: 20px;
        border-radius: 15px;
        margin-bottom: 20px;
    }

    .message-bubble {
        background: #e9ecef;
        padding: 10px 15px;
        border-radius: 15px;
        margin-bottom: 10px;
        max-width: 80%;
    }

    .log-entry {
        font-size: 12px;
        margin-bottom: 8px;
        border-left: 3px solid #007bff;
        padding-left: 8px;
    }

    .home-indicator {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 40%;
        height: 5px;
        background: rgba(255,255,255,0.5);
        border-radius: 5px;
        cursor: pointer;
        z-index: 20;
    }
`;

function injectStyles() {
    if ($('#interactive-phone-styles').length === 0) {
        $('')
            .attr('id', 'interactive-phone-styles')
            .text(phoneStyles) // ใส่ตัวแปร phoneStyles ที่มี CSS เต็มๆ
            .appendTo('head');
    }
}

function createPhoneUI() {
    if ($('#smart-phone-container').length) return;
    const html = `
        <div id="smart-phone-container">
            <div id="phone-screen" style="background-image: url('${phoneState.wallpaper}')">
                <div class="status-bar">
                    <span id="phone-clock">12:00</span>
                    <span><i class="fa-solid fa-wifi"></i> <i class="fa-solid fa-battery-full"></i> 100%</span>
                </div>

                <div class="app-grid">
                    <div class="app-item" onclick="openApp('bank')">
                        <div class="app-icon" style="color: #2ecc71"><i class="fa-solid fa-building-columns"></i></div>
                        <div class="app-label">Bank</div>
                    </div>
                    <div class="app-item" onclick="openApp('twitter')">
                        <div class="app-icon" style="color: #1da1f2"><i class="fa-brands fa-twitter"></i></div>
                        <div class="app-label">Twitter</div>
                    </div>
                    <div class="app-item" onclick="openApp('messages')">
                        <div class="app-icon" style="color: #27ae60"><i class="fa-solid fa-comment"></i></div>
                        <div class="app-label">Message</div>
                    </div>
                    <div class="app-item" onclick="openApp('notes')">
                        <div class="app-icon" style="color: #f1c40f"><i class="fa-solid fa-note-sticky"></i></div>
                        <div class="app-label">Notes</div>
                    </div>
                    <div class="app-item" onclick="openApp('settings')">
                        <div class="app-icon" style="color: #95a5a6"><i class="fa-solid fa-gear"></i></div>
                        <div class="app-label">System Log</div>
                    </div>
                </div>

                <!-- App Windows -->
                <div id="app-bank" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('bank')"></i> Mobile Banking</div>
                    <div class="app-content">
                        <div class="bank-card">
                            <div>Savings Account</div>
                            <h2 id="bank-balance">${phoneState.bankBalance}</h2>
                            <div>**** **** **** 1234</div>
                        </div>
                        <div>Recent Transactions</div>
                        <hr>
                        <div style="margin-top:10px; color:#888; text-align:center;">No recent history</div>
                    </div>
                </div>

                <div id="app-twitter" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('twitter')"></i> Twitter</div>
                    <div class="app-content" id="twitter-feed"></div>
                </div>

                <div id="app-messages" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('messages')"></i> Messages</div>
                    <div class="app-content" id="message-list"></div>
                </div>

                <div id="app-notes" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('notes')"></i> Notes</div>
                    <div class="app-content" id="note-list"></div>
                </div>

                <div id="app-settings" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('settings')"></i> System Log</div>
                    <div class="app-content">
                        <h3>Current Status</h3>
                        <div class="log-entry"><strong>Location:</strong> <span id="log-loc">Unknown</span></div>
                        <div class="log-entry"><strong>Date:</strong> <span id="log-date">Unknown</span></div>
                        <div class="log-entry"><strong>Time:</strong> <span id="log-time">Unknown</span></div>
                        <div class="log-entry"><strong>Weather:</strong> <span id="log-weather">Unknown</span></div>
                        <div class="log-entry"><strong>Clothes:</strong> <span id="log-clothes">Unknown</span></div>
                        <div class="log-entry"><strong>Event:</strong> <span id="log-event">None</span></div>
                        <hr>
                        <h4>Summary</h4>
                        <p id="log-summary" style="font-size:12px; color:#555;">...</p>
                    </div>
                </div>

                <div class="home-indicator" onclick="closeAllApps()"></div>
            </div>
        </div>
    `;

    $('body').append(html);

    // Bind Events
    window.openApp = (appName) => $(`#app-${appName}`).addClass('open');
    window.closeApp = (appName) => $(`#app-${appName}`).removeClass('open');
    window.closeAllApps = () => $('.app-window').removeClass('open');
    window.togglePhone = () => {
        const p = $('#smart-phone-container');
        if (p.css('display') === 'none') p.fadeIn(200); else p.fadeOut(200);
    };
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const clockEl = document.getElementById('phone-clock');
        if(clockEl) clockEl.innerText = timeStr;
    }, 1000);
}

function handleNewMessage(mesId) {
    const context = getContext();
    if (!context.chat || context.chat.length === 0) return;

    const lastMsg = context.chat[context.chat.length - 1].mes;
    const match = lastMsg.match(DATA_REGEX);

    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            updatePhoneData(data);
        } catch (e) {
            console.error(<q>"[Interactive Phone] Failed to parse JSON"</q>, e);
        }
    }
}

function updatePhoneData(data) {
    if(data.wallpaper) {
        $('#phone-screen').css('background-image', `url('${data.wallpaper}')`);
    }
    if(data.bank) $('#bank-balance').text(data.bank);
    if(data.twitter_new) {
        const tweetHtml = `<div class="twitter-post"><div style="font-weight:bold;">@User</div><div>${data.twitter_new}</div></div>`;
        $('#twitter-feed').prepend(tweetHtml);
    }
    if(data.message_new) {
         const msgHtml = `<div class="message-bubble">${data.message_new}</div>`;
         $('#message-list').append(msgHtml);
    }
    if(data.note_new) {
         const noteHtml = `<div class="message-bubble" style="background:#fff3cd;">${data.note_new}</div>`;
         $('#note-list').prepend(noteHtml);
    }
    if(data.log) {
        if(data.log.location) $('#log-loc').text(data.log.location);
        if(data.log.date) $('#log-date').text(data.log.date);
        if(data.log.time) $('#log-time').text(data.log.time);
        if(data.log.weather) $('#log-weather').text(data.log.weather);
        if(data.log.clothes) $('#log-clothes').text(data.log.clothes);
        if(data.log.event) $('#log-event').text(data.log.event);
        if(data.log.summary) $('#log-summary').text(data.log.summary);
    }
}

jQuery(async () => {
    await loadSettings();
    injectStyles(); // Inject CSS first
    createPhoneUI();

    if ($('#phone-toggle-btn').length === 0) {
        const menuBtn = $('<div>').attr({
            id: 'phone-toggle-btn',
            title: 'Open Phone'
        }).addClass('fa-solid fa-mobile-screen-button').css({
            cursor: 'pointer',
            margin: '0 10px',
            fontSize: '1.2em',
            color: 'var(--smart-theme-body-color, #ccc)'
        }).on('click', window.togglePhone);

        const targetContainer = $('#extensionsMenu');
        if(targetContainer.length) {
            targetContainer.append(menuBtn);
        } else {
            menuBtn.css({
                position: 'fixed',
                top: '10px',
                right: '100px',
                zIndex: 2001,
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '50%'
            });
            $('body').append(menuBtn);
        }
    }

    startClock();
    eventSource.on(event_types.MESSAGE_RECEIVED, handleNewMessage);
    console.log(`${extensionName} loaded successfully with injected styles.`);
});
