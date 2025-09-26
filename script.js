const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = ''; // 🔑 replace with your real key

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const imageInput = document.getElementById("image-input");
const imageButton = document.getElementById("image-button");

let conversationHistory = [];
let isFirstResponse = true; // track Kannada-only greeting
let pendingImage = null; // 🖼️ store uploaded image until user sends

// ✨ Typing indicator
function showTypingIndicator() {
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.id = "typing-indicator";
  typing.innerHTML = `
    <div class="avatar"><img src="bot.jpg" alt="Bot"></div>
    <div class="bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const t = document.getElementById("typing-indicator");
  if (t) t.remove();
}

// 🔥 OpenAI call
async function generateResponse(retries = 3, delay = 1000) {
  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // supports text + vision
        messages: conversationHistory,
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI API error:", errText);
      throw new Error("⚠ Failed to generate response.");
    }

    const data = await resp.json();
    console.log("OpenAI raw response:", data);

    return data.choices?.[0]?.message?.content || "⚠ No response";
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... attempts left: ${retries}`);
      await new Promise(r => setTimeout(r, delay));
      return generateResponse(retries - 1, delay * 2);
    }
    throw error;
  }
}

// 📌 Format text (bold, italic, links, etc.)
function formatText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}

// 📌 Add chat bubble
function addMessageBubble(text, fromUser = false) {
  const msg = document.createElement("div");
  msg.className = "message " + (fromUser ? "user" : "bot");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const img = document.createElement("img");
  img.src = fromUser ? "user.jpg" : "tig.jpg";
  img.alt = fromUser ? "User" : "Bot";
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = formatText(text);

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 📌 Handle user input
async function handleUserInput() {
  const userMessage = userInput.value.trim();
  if (!userMessage && !pendingImage) return;

  // Show user text
  if (userMessage) addMessageBubble(userMessage, true);

  // Show image preview (if exists)
  if (pendingImage) {
    addMessageBubble(
      `<img src="${pendingImage}" alt="Uploaded Image" style="max-width:200px; border-radius:8px;">`,
      true
    );
  }

  // Build user content
  let userContent = [];
  if (userMessage) userContent.push({ type: "text", text: userMessage });
  if (pendingImage) userContent.push({ type: "image_url", image_url: { url: pendingImage } });

  conversationHistory.push({
    role: "user",
    content: userContent
  });

  // reset pending image after sending
  pendingImage = null;

  userInput.value = "";
  sendButton.disabled = true;
  userInput.disabled = true;

  // Bot typing...
  showTypingIndicator();
  try {
    let botReply;

    // 🔑 First reply in Kannada only
    if (isFirstResponse) {
      botReply = "ನಮಸ್ಕಾರ! How can I assist you today?";
      isFirstResponse = false;
    } else {
      botReply = await generateResponse();
    }

    removeTypingIndicator();
    addMessageBubble(botReply, false);

    conversationHistory.push({
      role: "assistant",
      content: botReply
    });
  } catch (err) {
    removeTypingIndicator();
    addMessageBubble("⚠ " + err.message, false);
  } finally {
    sendButton.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}

// 📌 Events
sendButton.addEventListener("click", () => handleUserInput());
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput();
  }
});
imageButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = reader.result; // store image until user sends
      addMessageBubble(
        `<i>Image selected. Type a message and press send.</i>`,
        true
      );
    };
    reader.readAsDataURL(file);
  }
});

