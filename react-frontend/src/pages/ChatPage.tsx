import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import useStore from "../store/useStore";

// Styled components
const ChatMessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  height: "calc(100vh - 350px)",
  minHeight: "400px",
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

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  gap: theme.spacing(1),
}));

const ExampleCard = styled(Card)(({ theme }) => ({
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: theme.shadows[4],
  },
}));

const ChatPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chatMessages,
    loadingChat,
    chatError,
    sendChatMessage,
    realTimeData,
    fetchRealTimeData,
  } = useStore();

  // Example categories and questions
  const exampleCategories = [
    {
      title: "Deliveries",
      questions: [
        "What are today's deliveries?",
        "Do I have any pending deliveries?",
        "Show me deliveries in Downtown area",
      ],
    },
    {
      title: "Customers",
      questions: [
        "Tell me about Aditya's preferences",
        "Best time to deliver to Kabir?",
        "Who has the highest delivery success rate?",
      ],
    },
    {
      title: "Conditions",
      questions: [
        "How is traffic in Downtown?",
        "Will the weather affect today's deliveries?",
        "Is Diwali affecting any routes today?",
      ],
    },
    {
      title: "Routes",
      questions: [
        "Explain the current optimized route",
        "Which route is most efficient?",
        "How long will today's deliveries take?",
      ],
    },
  ];

  // Load data on mount
  useEffect(() => {
    if (!realTimeData) {
      fetchRealTimeData();
    }
  }, [realTimeData, fetchRealTimeData]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const message = inputMessage;
    setInputMessage("");
    await sendChatMessage(message);
  };

  const handleExampleClick = (example: string) => {
    sendChatMessage(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Delivery Assistant
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Ask questions about deliveries, customers, routes, and real-time
        conditions
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Main chat area */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ height: "100%" }}>
            {/* Chat messages */}
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
                  <SmartToyIcon style={{ fontSize: 60, marginBottom: 16 }} />
                  <Typography variant="h6" gutterBottom>
                    Hello, I'm your delivery assistant!
                  </Typography>
                  <Typography variant="body1">
                    Ask me about deliveries, optimal times, or current
                    conditions. Try one of the example questions to get started.
                  </Typography>
                </Box>
              ) : (
                chatMessages.map((msg, index) => (
                  <MessageBubble key={index} isUser={msg.role === "user"}>
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
                            width: 28,
                            height: 28,
                            bgcolor: "primary.main",
                            fontSize: "0.8rem",
                          }}
                        >
                          <SmartToyIcon fontSize="small" />
                        </Avatar>
                      )}
                      <Typography
                        variant="body1"
                        sx={{ flex: 1, whiteSpace: "pre-wrap" }}
                      >
                        {msg.content}
                      </Typography>
                      {msg.role === "user" && (
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
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
                ))
              )}
              {loadingChat && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {chatError && (
                <Box
                  sx={{
                    p: 2,
                    color: "error.main",
                    bgcolor: "error.light",
                    borderRadius: 1,
                    fontSize: "0.9rem",
                  }}
                >
                  Error: {chatError}
                </Box>
              )}
              <div ref={messagesEndRef} />
            </ChatMessagesContainer>

            <Divider />

            {/* Chat input */}
            <ChatInputContainer>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about deliveries, routes, or conditions..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loadingChat}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === "" || loadingChat}
                size="large"
              >
                <SendIcon />
              </IconButton>
            </ChatInputContainer>
          </Paper>
        </Grid>

        {/* Example questions sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <QuestionAnswerIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="h6">Example Questions</Typography>
            </Box>

            {exampleCategories.map((category, catIndex) => (
              <Box key={catIndex} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {category.title}
                </Typography>
                <Grid container spacing={1}>
                  {category.questions.map((question, qIndex) => (
                    <Grid item xs={12} key={qIndex}>
                      <ExampleCard
                        variant="outlined"
                        onClick={() => handleExampleClick(question)}
                      >
                        <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                          <Typography variant="body2">{question}</Typography>
                        </CardContent>
                      </ExampleCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}

            {/* Real-time context */}
            {realTimeData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Current Conditions
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {realTimeData.weather && realTimeData.weather.conditions && (
                    <Chip
                      icon={<SmartToyIcon />}
                      label={`Weather: ${realTimeData.weather.conditions}, ${
                        realTimeData.weather.temperature?.current || "N/A"
                      }°${realTimeData.weather.temperature?.units || "C"}`}
                      sx={{ mb: 1, mr: 1 }}
                    />
                  )}
                  {realTimeData.traffic &&
                    typeof realTimeData.traffic === "object" &&
                    "Downtown" in realTimeData.traffic &&
                    realTimeData.traffic.Downtown &&
                    typeof realTimeData.traffic.Downtown === "object" &&
                    "status" in realTimeData.traffic.Downtown && (
                      <Chip
                        label={`Traffic: ${
                          realTimeData.traffic.Downtown.status || "Unknown"
                        } in Downtown`}
                        sx={{ mb: 1 }}
                      />
                    )}
                  {realTimeData.festivals &&
                    realTimeData.festivals.has_festival_today &&
                    realTimeData.festivals.festivals &&
                    Array.isArray(realTimeData.festivals.festivals) &&
                    realTimeData.festivals.festivals.length > 0 && (
                      <Chip
                        label={`Festival: ${realTimeData.festivals.festivals[0].name}`}
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                    )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChatPage;
