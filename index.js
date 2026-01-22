// index.js
import { extension_settings } from <q>"../../../extensions.js"</q>;
import { eventSource, event_types } from <q>"../../../script.js"</q>;

const SETTING_KEY = <q>"interactive_phone"</q>;
let phoneContainer;
let currentTimeInterval;

// Default State
let phoneState = {
    wallpaper: <q>"url('https://images.unsplash.com/photo-1554147090-e1221a04a0bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80')"</q>, // Default abstract
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
// Expects format:  or just raw JSON block at end
const DATA_REGEX = //i;

function init() {
    // Create UI
    createPhoneUI();

    // Add Menu Button
    const menuBtn = document.createElement(<q>"div"</q>);
    menuBtn.id = <q>"phone-toggle-btn"</q>;
    menuBtn.className = <q>"fa-solid fa-mobile-screen-button"</q>;
    menuBtn.title = <q>"Open Phone"</q>;
    menuBtn.style.cursor = <q>"pointer"</q>;
    menuBtn.onclick = togglePhone;

    // Add to extension menu (Top Bar or Extensions list depending on ST version)
    // For simplicity, appending to the extensions menu container if available, or body as floating
    // Adjust selector based on your specific ST version layout
    const extensionMenu = document.getElementById(<q>"extensionsMenu"</q>) || document.body;
    // Better approach: Add to the extension list in UI

    // Start Clock
    startClock();

    // Listen for AI Generation
    eventSource.on(event_types.MESSAGE_RECEIVED, handleNewMessage);

    console.log(<q>"Interactive Phone Extension Loaded"</q>);
}

function createPhoneUI() {
    const html = `
        <div id="smart-phone-container">
            <div id="phone-screen" style="background-image: ${phoneState.wallpaper}">
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
                    <div class="app-content" id="twitter-feed">
                        <!-- Tweets go here -->
                    </div>
                </div>

                <div id="app-messages" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('messages')"></i> Messages</div>
                    <div class="app-content" id="message-list">
                        <!-- Messages go here -->
                    </div>
                </div>

                <div id="app-notes" class="app-window">
                    <div class="app-header"><i class="fa-solid fa-chevron-left back-btn" onclick="closeApp('notes')"></i> Notes</div>
                    <div class="app-content" id="note-list">
                        <!-- Notes go here -->
                    </div>
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

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);

    // Make global functions for onclick
    window.openApp = (appName) => {
        document.getElementById(`app-${appName}`).classList.add('open');
    };

    window.closeApp = (appName) => {
        document.getElementById(`app-${appName}`).classList.remove('open');
    };

    window.closeAllApps = () => {
        document.querySelectorAll('.app-window').forEach(el => el.classList.remove('open'));
    };

    window.togglePhone = () => {
        const p = document.getElementById('smart-phone-container');
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
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
    // Retrieve the message content. (Implementation depends on ST version API, assuming getting text)
    // This is a simplified fetch, you might need context.chat[mesId].mes
    const context = SillyTavern.getContext();
    const lastMsg = context.chat[context.chat.length - 1].mes;

    const match = lastMsg.match(DATA_REGEX);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            updatePhoneData(data);
        } catch (e) {
            console.error(<q>"Failed to parse Phone JSON"</q>, e);
        }
    }
}

function updatePhoneData(data) {
    // Update Wallpaper
    if(data.wallpaper) {
        phoneState.wallpaper = `url('${data.wallpaper}')`;
        document.getElementById('phone-screen').style.backgroundImage = phoneState.wallpaper;
    }

    // Update Bank
    if(data.bank) {
        phoneState.bankBalance = data.bank;
        document.getElementById('bank-balance').innerText = data.bank;
    }

    // Update Twitter
    if(data.twitter_new) {
        const tweetHtml = `
            <div class="twitter-post">
                <div style="font-weight:bold;">@User</div>
                <div>${data.twitter_new}</div>
            </div>`;
        document.getElementById('twitter-feed').insertAdjacentHTML('afterbegin', tweetHtml);
    }

    // Update Messages
    if(data.message_new) {
         const msgHtml = `<div class="message-bubble">${data.message_new}</div>`;
         document.getElementById('message-list').insertAdjacentHTML('beforeend', msgHtml);
    }

    // Update Notes
    if(data.note_new) {
         const noteHtml = `<div class="message-bubble" style="background:#fff3cd;">${data.note_new}</div>`;
         document.getElementById('note-list').insertAdjacentHTML('afterbegin', noteHtml);
    }

    // Update Logs
    if(data.log) {
        if(data.log.location) document.getElementById('log-loc').innerText = data.log.location;
        if(data.log.date) document.getElementById('log-date').innerText = data.log.date;
        if(data.log.time) document.getElementById('log-time').innerText = data.log.time;
        if(data.log.weather) document.getElementById('log-weather').innerText = data.log.weather;
        if(data.log.clothes) document.getElementById('log-clothes').innerText = data.log.clothes;
        if(data.log.event) document.getElementById('log-event').innerText = data.log.event;
        if(data.log.summary) document.getElementById('log-summary').innerText = data.log.summary;
    }
}

// Register Extension
jQuery(document).ready(function () {
    init();
});
