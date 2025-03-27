import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your delivery assistant. How can I help you today?",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef(null);

  // Example question suggestions
  const exampleQuestions = [
    "What's the best time to deliver to Aditya?",
    "Why is my delivery success rate low in Satellite?",
    "How does traffic affect deliveries?",
    "Are there any festivals affecting deliveries today?",
    "What's the weather forecast for today?",
  ];

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", content: newMessage };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input field
    setNewMessage("");

    // Send to API
    setSending(true);
    try {
      const response = await sendChatMessage(newMessage);

      // Add assistant response to chat
      const assistantMessage = {
        role: "assistant",
        content: response.response || "Sorry, I couldn't process your request.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your request. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleExampleClick = (question) => {
    setNewMessage(question);
  };

  return (
    <div>
      <h1 className="mb-4">Delivery Assistant</h1>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h4>
                <i className="bi bi-chat-dots me-2"></i>AI Assistant
              </h4>
            </div>
            <div className="card-body">
              {/* Chat Container */}
              <div className="chat-container mb-3" ref={chatContainerRef}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}

                {sending && (
                  <div className="chat-message assistant-message">
                    <div className="d-flex align-items-center">
                      <div
                        className="spinner-grow spinner-grow-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your question here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || !newMessage.trim()}
                  >
                    <i className="bi bi-send"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Example Questions</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                Click on any example to ask the assistant:
              </p>
              <div className="d-grid gap-2">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="btn btn-outline-secondary text-start"
                    onClick={() => handleExampleClick(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">Assistant Capabilities</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Delivery time recommendations
                </li>
                <li className="list-group-item">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Traffic and weather insights
                </li>
                <li className="list-group-item">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Festival and event information
                </li>
                <li className="list-group-item">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Delivery success pattern analysis
                </li>
                <li className="list-group-item">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Troubleshooting delivery issues
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
