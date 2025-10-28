// Jest setup file
import '@types/jest';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onSuspend: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: {
      addListener: jest.fn()
    }
  }
} as any;

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://notebooklm.google.com/test'
  },
  writable: true
});
