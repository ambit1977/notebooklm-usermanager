import { NotebookLMDebugger } from '../debug';

describe('NotebookLMDebugger', () => {
  let debugger: NotebookLMDebugger;

  beforeEach(() => {
    debugger = new NotebookLMDebugger();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('should add log entry to logs array', () => {
      debugger.log('Test message', { data: 'test' });
      
      expect(debugger.logs).toHaveLength(1);
      expect(debugger.logs[0].message).toBe('Test message');
      expect(debugger.logs[0].data).toEqual({ data: 'test' });
    });

    it('should call console.log when debug mode is enabled', () => {
      debugger.log('Test message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[NotebookLM Debug'),
        'Test message',
        ''
      );
    });

    it('should not call console.log when debug mode is disabled', () => {
      debugger.disable();
      debugger.log('Test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should add error entry to logs array', () => {
      const error = new Error('Test error');
      debugger.error('Test error message', error);
      
      expect(debugger.logs).toHaveLength(1);
      expect(debugger.logs[0].level).toBe('ERROR');
      expect(debugger.logs[0].message).toBe('Test error message');
      expect(debugger.logs[0].error).toBe('Error: Test error');
    });
  });

  describe('analyzePage', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.querySelectorAll = jest.fn().mockImplementation((selector) => {
        if (selector === 'button') {
          return [
            { textContent: 'Share', getAttribute: () => 'Share button', className: 'btn', id: 'share-btn' },
            { textContent: 'Add User', getAttribute: () => 'Add user', className: 'btn', id: 'add-btn' }
          ];
        }
        if (selector === 'input') {
          return [
            { type: 'email', placeholder: 'Enter email', className: 'input', id: 'email-input' }
          ];
        }
        if (selector === 'select') {
          return [
            { className: 'select', id: 'role-select' }
          ];
        }
        if (selector === '[role="dialog"]') {
          return [];
        }
        return [];
      });
    });

    it('should analyze page and return analysis object', () => {
      const analysis = debugger.analyzePage();
      
      expect(analysis).toHaveProperty('url');
      expect(analysis).toHaveProperty('title');
      expect(analysis).toHaveProperty('timestamp');
      expect(analysis).toHaveProperty('elements');
      expect(analysis).toHaveProperty('potentialSelectors');
      
      expect(analysis.elements.buttons).toBe(2);
      expect(analysis.elements.inputs).toBe(1);
      expect(analysis.elements.selects).toBe(1);
      expect(analysis.elements.dialogs).toBe(0);
    });
  });

  describe('exportLogs', () => {
    it('should create download link for logs', () => {
      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      const mockClick = jest.fn();
      
      Object.defineProperty(window, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL
        },
        writable: true
      });
      
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };
      
      document.createElement = jest.fn().mockReturnValue(mockLink);
      
      debugger.log('Test log');
      debugger.exportLogs();
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });
});
