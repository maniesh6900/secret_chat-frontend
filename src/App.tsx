import { useEffect, useMemo, useRef, useState } from "react";
import ToastStack from "./components/ToastStack";
import ChatScreen from "./screens/ChatScreen";
import AuthScreen from "./screens/AuthScreen";
import RoomScreen from "./screens/RoomScreen";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { resetUsers, setUsers, userJoined, userLeft } from "./store/usersSlice";
import type { ChatMessage, ConnectionState, Screen, Toast } from "./types/chat";
import "./App.css";

const WS_URL = "https://secret-chat-backend-ht4w.onrender.com";

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function buildMessage(sender: string, text: string, system = false): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    time: formatClock(new Date()),
    system,
  };
}

function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.list);

  const [screen, setScreen] = useState<Screen>("auth");
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [error, setError] = useState("");

  const [loginKeyInput, setLoginKeyInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [text, setText] = useState("");

  const [key, setKey] = useState("");
  const [roomid, setRoomid] = useState("");

  function applyUsersAndGuard(incomingUsers: unknown, activeKey: string) {
    if (!Array.isArray(incomingUsers)) {
      return false;
    }

    dispatch(setUsers(incomingUsers));

    const normalizedActive = normalizeKey(activeKey);
    if (!normalizedActive) {
      return false;
    }

    const sameKeyCount = incomingUsers.reduce((count, user) => {
      if (user && typeof user.key === "string" && normalizeKey(user.key) === normalizedActive) {
        return count + 1;
      }
      return count;
    }, 0);

    if (sameKeyCount > 1) {
      const notice = `Key '${activeKey}' is already in use in this room. Choose a different key.`;
      setError(notice);
      pushToast(notice);
      wsRef.current?.close();
      wsRef.current = null;
      dispatch(resetUsers());
      setConnection("disconnected");
      setMessages([]);
      setKey("");
      localStorage.removeItem("key");
      setScreen("auth");
      return true;
    }

    return false;
  }

  useEffect(() => {
    const rememberedKey = localStorage.getItem("key") ?? "";
    const rememberedRoom = localStorage.getItem("roomid") ?? "";
    if (rememberedKey) {
      setLoginKeyInput(rememberedKey);
    }
    if (rememberedRoom) {
      setRoomInput(rememberedRoom);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (screen !== "chat" || !key || !roomid) {
      return;
    }

    setConnection("connecting");
    setError("");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnection("connected");
      setMessages((prev) => [...prev, buildMessage("system", `Connected to ${WS_URL}`, true)]);
      ws.send(
        JSON.stringify({
          type: "join",
          key,
          roomid,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "joined": {
            const joinedKey = typeof msg.key === "string" ? msg.key : key;
            if (typeof msg.key === "string") {
              setKey(msg.key);
              localStorage.setItem("key", msg.key);
            }
            if (typeof msg.roomid === "string") {
              setRoomid(msg.roomid);
              localStorage.setItem("roomid", msg.roomid);
            }
            if (applyUsersAndGuard(msg.users, joinedKey)) {
              break;
            }
            setMessages((prev) => [...prev, buildMessage("system", "Joined room successfully.", true)]);
            break;
          }
          case "key_taken":
          case "join_error": {
            const notice =
              typeof msg.message === "string"
                ? msg.message
                : msg.type === "key_taken"
                  ? "Key already in use in this room."
                  : "Join failed.";
            setError(notice);
            pushToast(notice);
            setConnection("error");
            wsRef.current?.close();
            wsRef.current = null;
            dispatch(resetUsers());
            setMessages([]);
            setKey("");
            localStorage.removeItem("key");
            setScreen("auth");
            break;
          }
          case "msg":
          case "message": {
            const incomingText =
              typeof msg.text === "string" ? msg.text : typeof msg.message === "string" ? msg.message : "";
            if (!incomingText) {
              break;
            }
            const sender =
              typeof msg.key === "string"
                ? msg.key
                : typeof msg.sender === "string"
                  ? msg.sender
                  : "unknown";

            setMessages((prev) => [...prev, buildMessage(sender, incomingText)]);
            if (applyUsersAndGuard(msg.users, key)) {
              break;
            }
            break;
          }
          case "users": {
            applyUsersAndGuard(msg.users, key);
            break;
          }
          case "left":
          case "joined_user": {
            const changedUser =
              typeof msg.key === "string"
                ? msg.key
                : typeof msg.userKey === "string"
                  ? msg.userKey
                  : typeof msg.user === "string"
                    ? msg.user
                    : "A user";

            const notice =
              typeof msg.text === "string"
                ? msg.text
                : msg.type === "joined_user"
                  ? `${changedUser} joined the room.`
                  : `${changedUser} left the room.`;

            setMessages((prev) => [...prev, buildMessage("system", notice, true)]);

            if (msg.type === "joined_user") {
              dispatch(userJoined({ key: changedUser }));
            } else {
              dispatch(userLeft(changedUser));
            }

            pushToast(notice);

            applyUsersAndGuard(msg.users, key);
            break;
          }
          default:
            break;
        }
      } catch {
        setMessages((prev) => [...prev, buildMessage("system", "Received invalid JSON payload.", true)]);
      }
    };

    ws.onerror = () => {
      setConnection("error");
      setError("WebSocket error. Check if backend is running on ws://localhost:3001");
      setMessages((prev) => [...prev, buildMessage("system", "Socket error detected.", true)]);
    };

    ws.onclose = () => {
      setConnection("disconnected");
      setMessages((prev) => [...prev, buildMessage("system", "Socket disconnected.", true)]);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [screen, key, roomid, dispatch]);

  const statusLabel = useMemo(() => {
    if (connection === "connected") {
      return "ONLINE";
    }
    if (connection === "connecting") {
      return "CONNECTING";
    }
    if (connection === "error") {
      return "ERROR";
    }
    return "OFFLINE";
  }, [connection]);

  function pushToast(text: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  }

  function handleLoginSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeKey(loginKeyInput);
    if (!normalized) {
      return;
    }
    setLoginKeyInput(normalized);
    setKey(normalized);
    localStorage.setItem("key", normalized);
    setScreen("room");
  }

  function handleRoomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedRoom = roomInput.trim();
    if (!trimmedRoom) {
      return;
    }
    setRoomid(trimmedRoom);
    localStorage.setItem("roomid", trimmedRoom);
    setMessages([buildMessage("system", `Preparing room ${trimmedRoom}...`, true)]);
    dispatch(resetUsers());
    setScreen("chat");
  }

  function sendmsg() {
    const ws = wsRef.current;
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [...prev, buildMessage("system", "Message not sent: socket is not open.", true)]);
      return;
    }

    ws.send(
      JSON.stringify({
        type: "msg",
        key,
        roomid,
        text: trimmed,
      }),
    );
    setText("");
  }

  function logout() {
    wsRef.current?.close();
    wsRef.current = null;
    setConnection("disconnected");
    dispatch(resetUsers());
    setMessages([]);
    setText("");
    setKey("");
    setRoomid("");
    setScreen("auth");
  }

  if (screen === "auth") {
    return (
      <AuthScreen
        loginKeyInput={loginKeyInput}
        onKeyChange={setLoginKeyInput}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  if (screen === "room") {
    return (
      <RoomScreen
        roomInput={roomInput}
        keyValue={key}
        onRoomChange={setRoomInput}
        onSubmit={handleRoomSubmit}
      />
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} />
      <ChatScreen
        roomid={roomid}
        keyValue={key}
        connection={connection}
        statusLabel={statusLabel}
        users={users}
        messages={messages}
        error={error}
        text={text}
        messagesEndRef={messagesEndRef}
        onClear={() => setMessages([])}
        onLogout={logout}
        onTextChange={setText}
        onSend={sendmsg}
      />
    </>
  );
}

export default App;
