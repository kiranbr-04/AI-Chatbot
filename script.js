const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = ''; // 🔑 Replace with your real key

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const imageInput = document.getElementById("image-input");
const imageButton = document.getElementById("image-button");
const themeToggle = document.getElementById("theme-toggle");

let conversationHistory = [];
let pendingImage = null;

/* ===== THEME ===== */
function setTheme(theme) {
  document.body.className = theme;
  localStorage.setItem("chat-theme", theme);
  themeToggle.innerHTML =
    theme === "dark" ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  lucide.createIcons();
}

const savedTheme = localStorage.getItem("chat-theme");
if (savedTheme) {
  setTheme(savedTheme);
} else {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(newTheme);
});

/* ===== API CALL ===== */
async function generateResponse() {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: conversationHistory,
      temperature: 0.7,
    }),
  });

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "⚠ No response";
}

/* ===== Add Message Bubble ===== */
function addMessageBubble(text, fromUser = false) {
  const msg = document.createElement("div");
  msg.className = "message " + (fromUser ? "user" : "bot");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const img = document.createElement("img");
  img.src = fromUser ? "user.jpg" : "tig.jpg"; // user and bot avatars
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = text;

  if (fromUser) {
    msg.appendChild(bubble);
    msg.appendChild(avatar);
  } else {
    msg.appendChild(avatar);
    msg.appendChild(bubble);
  }

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

/* ===== Typing Indicator ===== */
function showTypingIndicator() {
  const msg = document.createElement("div");
  msg.className = "message bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const img = document.createElement("img");
  img.src = "tig.jpg";
  avatar.appendChild(img);

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";

  msg.appendChild(avatar);
  msg.appendChild(indicator);

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

/* ===== Handle User Input ===== */
async function handleUserInput() {
  const userMessage = userInput.value.trim();
  if (!userMessage && !pendingImage) return;

  if (userMessage) addMessageBubble(userMessage, true);

  if (pendingImage) {
    addMessageBubble(
      `<img src="${pendingImage}" style="max-width:200px; border-radius:8px;">`,
      true
    );
  }

  let userContent = [];
  if (userMessage) userContent.push({ type: "text", text: userMessage });
  if (pendingImage)
    userContent.push({ type: "image_url", image_url: { url: pendingImage } });

  conversationHistory.push({ role: "user", content: userContent });

  pendingImage = null;
  userInput.value = "";

  // Show typing indicator while waiting
  const typingMsg = showTypingIndicator();

  try {
    const botReply = await generateResponse();

    // Remove typing indicator
    chatMessages.removeChild(typingMsg);

    // Add bot reply
    addMessageBubble(botReply, false);
    conversationHistory.push({ role: "assistant", content: botReply });
  } catch (err) {
    chatMessages.removeChild(typingMsg);
    addMessageBubble("⚠ Error: " + err.message, false);
  }
}

/* ===== Events ===== */
sendButton.addEventListener("click", handleUserInput);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleUserInput();
});
imageButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = reader.result;
      addMessageBubble("<i>Image selected. Type a message and press send.</i>", true);
    };
    reader.readAsDataURL(imageInput.files[0]);
  }
});


