import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '@/components/FileUpload';
import { toast } from 'sonner';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('FileUpload Component', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('displays accepted file types', () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        acceptedTypes={['image/*', '.pdf']} 
      />
    );
    
    expect(screen.getByText('Supports: image/*, .pdf')).toBeInTheDocument();
  });

  it('displays maximum file size', () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        maxSize={50} 
      />
    );
    
    expect(screen.getByText('Maximum file size: 50MB')).toBeInTheDocument();
  });

  it('handles file selection through input', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    }
  });

  it('validates file size', async () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        maxSize={1} // 1MB limit
      />
    );
    
    // Create a file larger than 1MB
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File size must be less than 1MB');
      });
    }
  });

  it('validates file type', async () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        acceptedTypes={['image/*']}
      />
    );
    
    const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [textFile],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('File type not supported')
        );
      });
    }
  });

  it('handles multiple files when allowed', async () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        multiple={true}
      />
    );
    
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument();
        expect(screen.getByText('test2.jpg')).toBeInTheDocument();
      });
    }
  });

  it('prevents multiple files when not allowed', async () => {
    render(
      <FileUpload 
        onUpload={mockOnUpload} 
        multiple={false}
      />
    );
    
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Only one file is allowed');
      });
    }
  });

  it('calls onUpload when file is successfully uploaded', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith('mock-url', 'test.jpg');
        expect(toast.success).toHaveBeenCalledWith('test.jpg uploaded successfully');
      }, { timeout: 3000 });
    }
  });

  it('allows file removal', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /choose files/i }).parentElement?.querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      });
    }
  });
});
