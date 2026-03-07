export type Screen = "auth" | "room" | "chat";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type User = {
  key: string;
};

export type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  time: string;
  system?: boolean;
};

export type Toast = {
  id: string;
  text: string;
};
