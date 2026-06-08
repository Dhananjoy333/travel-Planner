
const API_URL = "https://travel-planner-gkib.onrender.com/api/plan-itinerary";

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const userInput = document.getElementById("userInput");
    const chatTimeline = document.getElementById("chatTimeline");
    const clearChatBtn = document.getElementById("clearChatBtn");
    const sendBtn = document.getElementById("sendBtn");

    // --- DOM Elements for Mobile Collapsible Menu ---
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const plannerSidebar = document.getElementById("plannerSidebar");

    const overlay = document.getElementById("transitionOverlay");
    if (overlay) {
        setTimeout(() => overlay.classList.add("is-hidden"), 200);
    }

    // --- Mobile Sidebar Click Logic ---
    if (menuToggleBtn && plannerSidebar) {
        menuToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            plannerSidebar.classList.toggle("active");
        });

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

        if (plannerSidebar && plannerSidebar.classList.contains("active")) {
            plannerSidebar.classList.remove("active");
        }

        // 1. Render User Message on Screen
        appendMessage(query, "user");
        userInput.value = "";

        // 2. Fetch context multipliers from the sidebar controls
        const pace = document.getElementById("paceSelect").value;
        const budget = document.getElementById("budgetSelect").value;

        // 3. Render Loading Indicator
        const loadingId = appendMessage('<div class="typing-dots">Thinking<span>.</span><span>.</span><span>.</span></div>', "bot");

        try {
            sendBtn.disabled = true;

            // Send raw clean traits to backend proxy API securely
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query,
                    budget: budget,
                    pace: pace
                })
            });

            const data = await response.json();

            // Remove the loading indicator text
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Extract content safely from payload map sent from backend proxy logic
            if (data.candidates && data.candidates[0].content?.parts?.[0]?.text) {
                let aiResponseText = data.candidates[0].content.parts[0].text;

                // Minimal formatting handler to replace residual asterisks with html tags
                let cleanedText = aiResponseText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');

                appendMessage(cleanedText, "bot");
            } else {
                appendMessage("I ran into an issue scanning that criteria. Could you try wording it differently?", "bot");
            }

        } catch (error) {
            console.error("Communication Error:", error);
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            appendMessage("Unable to reach the backend servers right now. Please verify your connection.", "bot");
        } finally {
            sendBtn.disabled = false;
        }
    });

    // Helper Utility to dynamically append bubbles into timeline view
    function appendMessage(text, sender) {
        const messageId = "msg-" + Date.now() + Math.random().toString(36).substr(2, 4);
        const msgDiv = document.createElement("div");
        msgDiv.id = messageId;
        msgDiv.classList.add("msg", sender === "user" ? "user-msg" : "bot-msg");

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatar = sender === "user" ? "👤" : "🤖";

        msgDiv.innerHTML = `
            <div class="msg-avatar">${avatar}</div>
            <div class="msg-bubble">
                <div>${text}</div>
                <small class="msg-timestamp">${time}</small>
            </div>
        `;

        chatTimeline.appendChild(msgDiv);
        chatTimeline.scrollTop = chatTimeline.scrollHeight;
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

        if (plannerSidebar && plannerSidebar.classList.contains("active")) {
            plannerSidebar.classList.remove("active");
        }
    });
});