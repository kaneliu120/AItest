import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

// 示例测试组件
function ExampleComponent({ title = 'Hello World' }: { title?: string }) {
  return (
    <div>
      <h1 data-testid="title">{title}</h1>
      <p data-testid="description">This is an example component for testing</p>
    </div>
  );
}

describe('ExampleComponent', () => {
  it('renders with default title', () => {
    render(<ExampleComponent />);
    expect(screen.getByTestId('title')).toHaveTextContent('Hello World');
  });

  it('renders with custom title', () => {
    render(<ExampleComponent title="Custom Title" />);
    expect(screen.getByTestId('title')).toHaveTextContent('Custom Title');
  });

  it('renders description', () => {
    render(<ExampleComponent />);
    expect(screen.getByTestId('description')).toBeInTheDocument();
  });
});

// 工具函数测试示例
function add(a: number, b: number): number {
  return a + b;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

describe('Utility Functions', () => {
  describe('add', () => {
    it('adds two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(-1, 1)).toBe(0);
      expect(add(0, 0)).toBe(0);
    });

    it('handles decimal numbers', () => {
      expect(add(1.5, 2.5)).toBe(4);
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2026-02-24T12:00:00Z');
      expect(formatDate(date)).toBe('2026-02-24');
    });

    it('handles different dates', () => {
      const date1 = new Date('2026-01-01T00:00:00Z');
      const date2 = new Date('2026-12-31T23:59:59Z');
      expect(formatDate(date1)).toBe('2026-01-01');
      expect(formatDate(date2)).toBe('2026-12-31');
    });
  });
});

// API 客户端测试示例
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getHealth(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3001');
  });

  it('creates instance with baseUrl', () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  // 注意：这是一个异步测试示例
  it.skip('fetches health status (requires actual API)', async () => {
    // 这个测试需要实际的API，所以跳过
    // 在实际项目中，可以使用jest.mock来模拟fetch
    const result = await apiClient.getHealth();
    expect(result).toHaveProperty('status');
  });
});

// 错误处理测试示例
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

describe('Error Handling', () => {
  it('divides numbers correctly', () => {
    expect(divide(10, 2)).toBe(5);
    expect(divide(9, 3)).toBe(3);
  });

  it('throws error when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
    expect(() => divide(0, 0)).toThrow('Division by zero');
  });
});

// 组件交互测试示例
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = React.useState(initialCount);

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button 
        data-testid="increment" 
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <button 
        data-testid="decrement" 
        onClick={() => setCount(count - 1)}
      >
        Decrement
      </button>
      <button 
        data-testid="reset" 
        onClick={() => setCount(initialCount)}
      >
        Reset
      </button>
    </div>
  );
}

describe('Counter Component', () => {
  it('renders with initial count', () => {
    render(<Counter initialCount={5} />);
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });

  it('increments count', async () => {
    render(<Counter />);
    const incrementButton = screen.getByTestId('increment');
    const countDisplay = screen.getByTestId('count');

    expect(countDisplay).toHaveTextContent('0');
    
    // 模拟点击 - 使用act包装状态更新
    await act(async () => {
      incrementButton.click();
    });
    expect(countDisplay).toHaveTextContent('1');
    
    await act(async () => {
      incrementButton.click();
    });
    expect(countDisplay).toHaveTextContent('2');
  });

  it('decrements count', async () => {
    render(<Counter initialCount={10} />);
    const decrementButton = screen.getByTestId('decrement');
    const countDisplay = screen.getByTestId('count');

    expect(countDisplay).toHaveTextContent('10');
    
    await act(async () => {
      decrementButton.click();
    });
    expect(countDisplay).toHaveTextContent('9');
  });

  it('resets count', async () => {
    render(<Counter initialCount={3} />);
    const incrementButton = screen.getByTestId('increment');
    const resetButton = screen.getByTestId('reset');
    const countDisplay = screen.getByTestId('count');

    // 先增加几次 (从3开始，点击2次应该是5)
    await act(async () => {
      incrementButton.click();
    });
    expect(countDisplay).toHaveTextContent('4');
    
    await act(async () => {
      incrementButton.click();
    });
    expect(countDisplay).toHaveTextContent('5');
    
    // 重置
    await act(async () => {
      resetButton.click();
    });
    expect(countDisplay).toHaveTextContent('3');
  });
});

// 快照测试示例
function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

describe('Header Component Snapshot', () => {
  it('matches snapshot with title only', () => {
    const { container } = render(<Header title="Mission Control" />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with title and subtitle', () => {
    const { container } = render(
      <Header 
        title="Mission Control" 
        subtitle="Central Dashboard for Automation" 
      />
    );
    expect(container).toMatchSnapshot();
  });
});

// 测试覆盖率报告
export { 
  ExampleComponent, 
  add, 
  formatDate, 
  ApiClient, 
  divide, 
  Counter, 
  Header 
};