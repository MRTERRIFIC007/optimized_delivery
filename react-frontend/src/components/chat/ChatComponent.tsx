import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Collapse,
  Zoom,
  Fade,
  Button,
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import useStore from "../../store/useStore";
import { ChatMessage } from "../../types/chat";

// Styled components
const ChatPaper = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  width: 350,
  maxHeight: 500,
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
  overflow: "hidden",
  transition: "all 0.3s ease-in-out",
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
}));

const ChatMessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  maxHeight: 320,
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isUser",
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: "80%",
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  backgroundColor: isUser
    ? theme.palette.primary.light
    : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : "inherit",
  alignSelf: isUser ? "flex-end" : "flex-start",
  wordBreak: "break-word",
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  position: "relative",
}));

const ExamplesContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  gap: theme.spacing(1),
}));

interface ChatComponentProps {
  initialOpen?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  initialOpen = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [showExamples, setShowExamples] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chatMessages,
    loadingChat,
    chatError,
    sendChatMessage,
    fetchRealTimeData,
    realTimeData,
  } = useStore();

  // Don't show the floating chat on the ChatPage
  const isOnChatPage = location.pathname === "/chat";

  // Example questions that can quickly be sent
  const exampleQuestions = [
    "What are today's deliveries?",
    "Best time to deliver to Aditya?",
    "Explain the current route",
    "Traffic conditions?",
    "Diwali impact on deliveries?",
  ];

  // Load realtime data for context if not loaded yet
  useEffect(() => {
    if (!realTimeData && !isOnChatPage) {
      fetchRealTimeData();
    }
  }, [realTimeData, fetchRealTimeData, isOnChatPage]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      await sendChatMessage(inputMessage.trim());
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleExampleClick = (example: string) => {
    sendChatMessage(example);
    setShowExamples(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleHeaderClick = () => {
    // Navigate to chat page if header is clicked
    if (!isOnChatPage) {
      navigate("/chat");
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Don't render on the Chat page
  if (isOnChatPage) {
    return null;
  }

  return (
    <Zoom in={true} style={{ transitionDelay: "300ms" }}>
      <ChatPaper elevation={5}>
        <ChatHeader onClick={handleHeaderClick}>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToyIcon />
            <Typography variant="subtitle1">Delivery Assistant</Typography>
          </Box>
          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </ChatHeader>

        <Collapse in={isOpen}>
          <ChatMessagesContainer>
            {chatMessages.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                p={2}
                textAlign="center"
                color="text.secondary"
              >
                <SmartToyIcon style={{ fontSize: 40, marginBottom: 10 }} />
                <Typography variant="body2">
                  Hi! I'm your delivery assistant. Ask me about deliveries,
                  optimal times, or current conditions.
                </Typography>
              </Box>
            ) : (
              chatMessages.map((msg, index) => (
                <Fade key={index} in={true} timeout={500}>
                  <MessageBubble isUser={msg.role === "user"}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                      }}
                    >
                      {msg.role === "assistant" && (
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: "primary.main",
                            fontSize: "0.8rem",
                          }}
                        >
                          <SmartToyIcon fontSize="small" />
                        </Avatar>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </Typography>
                      {msg.role === "user" && (
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: "secondary.main",
                            fontSize: "0.8rem",
                            ml: "auto",
                          }}
                        >
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      )}
                    </Box>
                  </MessageBubble>
                </Fade>
              ))
            )}
            {loadingChat && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            {chatError && (
              <Box
                sx={{
                  p: 2,
                  color: "error.main",
                  bgcolor: "error.light",
                  borderRadius: 1,
                  fontSize: "0.8rem",
                }}
              >
                Error: {chatError}
              </Box>
            )}
            <div ref={messagesEndRef} />
          </ChatMessagesContainer>

          {showExamples && chatMessages.length === 0 && (
            <ExamplesContainer>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <QuestionAnswerIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Try asking:
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {exampleQuestions.map((example, index) => (
                  <Chip
                    key={index}
                    label={example}
                    size="small"
                    onClick={() => handleExampleClick(example)}
                    sx={{
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  />
                ))}
              </Box>
            </ExamplesContainer>
          )}

          <ChatInputContainer>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Ask about deliveries or conditions..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loadingChat}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={inputMessage.trim() === "" || loadingChat}
              sx={{ minWidth: 100 }}
              onClick={handleSendMessage}
            >
              <SendIcon />
            </Button>
          </ChatInputContainer>
        </Collapse>
      </ChatPaper>
    </Zoom>
  );
};

export default ChatComponent;
