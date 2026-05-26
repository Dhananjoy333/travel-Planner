// WARNING: For production environments, hide your keys using an environment variable backend server proxy.
const GEMINI_API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const userInput = document.getElementById("userInput");
    const chatTimeline = document.getElementById("chatTimeline");
    const clearChatBtn = document.getElementById("clearChatBtn");
    const sendBtn = document.getElementById("sendBtn");

    // --- New DOM Elements for Mobile Collapsible Menu ---
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const plannerSidebar = document.getElementById("plannerSidebar");

    // Clear overlay animations if page loaded natively
    const overlay = document.getElementById("pageOverlay");
    if (overlay) {
        setTimeout(() => overlay.classList.add("is-hidden"), 200);
    }

    // --- New: Mobile Sidebar Click Logic ---
    if (menuToggleBtn && plannerSidebar) {
        // Toggle Sidebar active state when clicking hamburger button
        menuToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevents document click event from instantly closing it
            plannerSidebar.classList.toggle("active");
        });

        // Close Sidebar dynamically if a user clicks anywhere else on the screen
        document.addEventListener("click", (e) => {
            if (!plannerSidebar.contains(e.target) && plannerSidebar.classList.contains("active")) {
                plannerSidebar.classList.remove("active");
            }
        });
    }

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;

        // Automatically hide mobile sidebar overlay upon form submission so user sees response
        if (plannerSidebar && plannerSidebar.classList.contains("active")) {
            plannerSidebar.classList.remove("active");
        }

        // 1. Render User Message on Screen
        appendMessage(query, "user");
        userInput.value = ""; // Clear input text field immediately

        // 2. Fetch context multipliers from the sidebar controls
        const pace = document.getElementById("paceSelect").value;
        const budget = document.getElementById("budgetSelect").value;

        // Build system architecture prompt modifier for tailored results
        const structuredSystemPrompt = `You are a professional travel assistant agent inside the TravelEase ecosystem. 
        The traveler is asking for: "${query}". 
        Incorporate these parameters into your recommendation details:
        - Budget Style: ${budget}
        - Travel Intensity Pace: ${pace}.
        Format your response cleanly with brief line breaks where appropriate. Do not use complex raw markdown syntax blocks like hashes, keep it clear and easy to read.`;

        // 3. Render Loading Indicator
        const loadingId = appendMessage('<div class="typing-dots">Thinking<span>.</span><span>.</span><span>.</span></div>', "bot");

        try {
            sendBtn.disabled = true;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: structuredSystemPrompt }] }]
                })
            });

            const data = await response.json();

            // Remove the loading indicator text
            document.getElementById(loadingId).remove();

            // Extract content cleanly from the Gemini JSON return array map
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let aiResponseText = data.candidates[0].content.parts[0].text;
                appendMessage(aiResponseText, "bot");
            } else {
                appendMessage("I ran into an issue scanning that criteria. Could you try wording it differently?", "bot");
            }

        } catch (error) {
            console.error("API Communication Error:", error);
            if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
            appendMessage("Unable to reach the AI servers right now. Please verify your internet connection or API Key.", "bot");
        } finally {
            sendBtn.disabled = false;
        }
    });

    // Helper Utility to dynamically append bubbles into timeline view
    function appendMessage(text, sender) {
        const messageId = "msg-" + Date.now();
        const msgDiv = document.createElement("div");
        msgDiv.id = messageId;
        msgDiv.classList.add("msg", sender === "user" ? "user-msg" : "bot-msg");

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = sender === "user" ? "👤" : "🤖";

        msgDiv.innerHTML = `
            <div class="msg-avatar">${avatar}</div>
            <div class="msg-bubble">
                <p>${text}</p>
                <small class="msg-timestamp">${time}</small>
            </div>
        `;

        chatTimeline.appendChild(msgDiv);
        chatTimeline.scrollTop = chatTimeline.scrollHeight; // Auto scrolls down to newest text element
        return messageId;
    }

    // Clear Canvas Handler Button
    clearChatBtn.addEventListener("click", () => {
        chatTimeline.innerHTML = `
            <div class="msg bot-msg">
                <div class="msg-avatar">🤖</div>
                <div class="msg-bubble">
                    <p>Timeline cleared. Where shall we plan to fly to next?</p>
                    <small class="msg-timestamp">Just Now</small>
                </div>
            </div>
        `;

        // Automatically close the sidebar overlay on mobile once cleared
        if (plannerSidebar && plannerSidebar.classList.contains("active")) {
            plannerSidebar.classList.remove("active");
        }
    });
});