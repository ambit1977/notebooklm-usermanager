// Common type definitions for NotebookLM User Manager

export interface Selectors {
  shareButton: string;
  shareMenu: string;
  addUserButton: string;
  emailInput: string;
  roleSelect: string;
  inviteButton: string;
  dialog: string;
  closeButton: string;
  confirmButton: string;
}

export interface MessageRequest {
  action: 'checkPage' | 'addUser' | 'addMultipleUsers' | 'debugUI' | 'log' | 'ping';
  email?: string;
  emails?: string[];
  role?: string;
  message?: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface UserFormData {
  email: string;
  role: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
  url: string;
  level?: 'ERROR';
  error?: string | undefined;
}

export interface PageAnalysis {
  url: string;
  title: string;
  timestamp: string;
  elements: {
    buttons: number;
    inputs: number;
    selects: number;
    dialogs: number;
  };
  potentialSelectors: {
    shareButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
    emailInputs: Array<{
      index: number;
      type: string;
      placeholder: string | null;
      className: string;
      id: string;
    }>;
    addUserButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
    inviteButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
  };
}

export interface DebugCommands {
  analyze: () => PageAnalysis;
  logs: () => LogEntry[];
  export: () => void;
  clear: () => void;
  enable: () => void;
  disable: () => void;
}
